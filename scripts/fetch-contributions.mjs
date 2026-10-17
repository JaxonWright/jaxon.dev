#!/usr/bin/env node
// Fetches Jaxon's pull requests to other people's repositories (GitHub search API)
// and writes src/app/services/contributions.json for the /projects page.
// Works unauthenticated; set GITHUB_TOKEN for higher rate limits. On any failure the
// committed snapshot is left untouched so builds never break.
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const AUTHOR = 'JaxonWright';
/** His own account and the orgs he leads/works for (shown elsewhere on the page). */
const EXCLUDE_OWNERS = ['jaxonwright', 'arbitrari', 'dunrite', 'volgistics'];
/** Skip small/personal repos... */
const MIN_STARS = 25;
/** ...except ones Jaxon explicitly wants listed regardless of stars (and of having a merged PR). */
const ALLOW_REPOS = ['omacom/omarchy', 'ErikBurdett/omarchy-wavebar', 'Dymstro/nova-chatmix-linux', 'ypMrg/omarchy-bambu-companion', 'rawritude/omarchy-oled-guard'];
const allowed = repo => ALLOW_REPOS.some(a => a.toLowerCase() === repo.toLowerCase());
/** Repos never listed, whatever their stars or PRs. */
const EXCLUDE_REPOS = ['causefx/Organizr', 'aorumbayev/awesome-omarchy', 'rob2d/use-viewport-sizes'];
/** A PR whose changed files all match this (README, *.md, docs/, LICENSE) is docs-only and skipped. */
const DOCS_ONLY = f => /(^|\/)(LICEN[CS]E|COPYING)[^/]*$/i.test(f) || /(^|\/)README[^/]*$/i.test(f) || /\.md$/i.test(f) || /^docs?\//i.test(f) || /\/docs?\//i.test(f);
/** Platform/framework tags shown before each repo's top languages (GitHub can't infer these). */
const PLATFORM_TAGS = {
  'omacom/omarchy': ['Omarchy', 'Linux'],
  'mattlewis92/angular-calendar': ['Angular'],
  'ErikBurdett/omarchy-wavebar': ['Omarchy'],
  'Dymstro/nova-chatmix-linux': ['Linux', 'SteelSeries'],
  'Cordobo/angularx-qrcode': ['Angular'],
  'ypMrg/omarchy-bambu-companion': ['Omarchy', 'Bambu Lab'],
  'rawritude/omarchy-oled-guard': ['Omarchy'],
};
/** How many of the repo's languages (by bytes, from the GitHub languages API) to tag. */
const MAX_LANGS = 3;
const OUT = resolve(import.meta.dirname, '..', 'src/app/services/contributions.json');

const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'jaxon.dev-build' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw Object.assign(new Error(`${res.status} ${url}`), { status: res.status });
      return await res.json();
    } catch (err) {
      // Retry dropped sockets/timeouts and 5xx; give up on 4xx (rate limit, not found).
      if (i >= tries || (err.status && err.status < 500)) throw err;
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
}

async function main() {
  const items = [];
  for (let page = 1; page <= 5; page++) {
    const data = await get(`https://api.github.com/search/issues?q=author:${AUTHOR}+type:pr&per_page=100&page=${page}&sort=created&order=desc`);
    items.push(...data.items);
    if (items.length >= data.total_count || data.items.length < 100) break;
  }
  const repos = new Map();
  for (const it of items) {
    const full = it.repository_url.replace('https://api.github.com/repos/', '');
    if (EXCLUDE_OWNERS.includes(full.split('/')[0].toLowerCase())) continue;
    if (EXCLUDE_REPOS.some(x => x.toLowerCase() === full.toLowerCase())) continue;
    const state = it.pull_request?.merged_at ? 'merged' : it.state; // open | closed
    if (!repos.has(full)) repos.set(full, { repo: full, url: `https://github.com/${full}`, description: '', prs: [] });
    repos.get(full).prs.push({ number: it.number, title: it.title, state, url: it.html_url, date: (it.pull_request?.merged_at || it.created_at).slice(0, 10) });
  }
  // Star filter (repo lookups also give the description). Fails the whole fetch on
  // error so a rate-limited run never publishes an unfiltered list.
  for (const r of [...repos.values()]) {
    const info = await get(`https://api.github.com/repos/${r.repo}`);
    r.description = info.description || '';
    r.stars = info.stargazers_count;
    if (r.stars < MIN_STARS && !allowed(r.repo)) { repos.delete(r.repo); continue; }
    const langs = await get(`https://api.github.com/repos/${r.repo}/languages`);
    r.languages = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, MAX_LANGS).map(([l]) => l);
    const platform = Object.entries(PLATFORM_TAGS).find(([k]) => k.toLowerCase() === r.repo.toLowerCase())?.[1] ?? [];
    r.tags = [...platform, ...r.languages.filter(l => !platform.includes(l))];
  }
  // Docs-only filter: drop PRs that only touch README / *.md / docs, then empty repos.
  for (const r of [...repos.values()]) {
    const kept = [];
    for (const pr of r.prs) {
      const files = await get(`https://api.github.com/repos/${r.repo}/pulls/${pr.number}/files?per_page=100`);
      if (!files.length || !files.every(f => DOCS_ONLY(f.filename))) kept.push(pr);
    }
    r.prs = kept;
    // Only repos with at least one merged PR (their open/closed PRs stay listed).
    if (!kept.length || (!allowed(r.repo) && !kept.some(p => p.state === 'merged'))) repos.delete(r.repo);
  }
  const list = [...repos.values()].sort((a, b) =>
    b.prs.filter(p => p.state === 'merged').length - a.prs.filter(p => p.state === 'merged').length
    || b.prs.length - a.prs.length || a.repo.localeCompare(b.repo));
  if (!list.length) throw new Error('no contributions found');
  writeFileSync(OUT, JSON.stringify({ author: AUTHOR, fetchedAt: new Date().toISOString(), repos: list }, null, 2) + '\n');
  console.log(`✓ Contributions: ${list.length} repos, ${list.reduce((n, r) => n + r.prs.length, 0)} PRs -> ${OUT}`);
}

main().catch(err => {
  console.warn(`⚠ Contributions fetch failed (${err.message}${err.cause ? `: ${err.cause.code || err.cause.message}` : ""}); using committed snapshot.`);
  process.exit(0);
});
