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
/** ...except ones Jaxon explicitly wants listed regardless of stars. */
/** Repos never listed, whatever their stars or PRs. */
const EXCLUDE_REPOS = ['causefx/Organizr'];
const ALLOW_REPOS = ['omacom/omarchy', 'ErikBurdett/omarchy-wavebar', 'Dymstro/nova-chatmix-linux'];
/** A PR whose changed files all match this is docs-only and skipped. */
const DOCS_ONLY = f => /(^|\/)README[^/]*$/i.test(f) || /\.md$/i.test(f) || /^docs?\//i.test(f) || /\/docs?\//i.test(f);
const OUT = resolve(import.meta.dirname, '..', 'src/app/services/contributions.json');

const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'jaxon.dev-build' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function get(url) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
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
    if (r.stars < MIN_STARS && !ALLOW_REPOS.some(a => a.toLowerCase() === r.repo.toLowerCase())) repos.delete(r.repo);
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
    if (!kept.some(p => p.state === 'merged')) repos.delete(r.repo);
  }
  const list = [...repos.values()].sort((a, b) =>
    b.prs.filter(p => p.state === 'merged').length - a.prs.filter(p => p.state === 'merged').length
    || b.prs.length - a.prs.length || a.repo.localeCompare(b.repo));
  if (!list.length) throw new Error('no contributions found');
  writeFileSync(OUT, JSON.stringify({ author: AUTHOR, fetchedAt: new Date().toISOString(), repos: list }, null, 2) + '\n');
  console.log(`✓ Contributions: ${list.length} repos, ${list.reduce((n, r) => n + r.prs.length, 0)} PRs -> ${OUT}`);
}

main().catch(err => {
  console.warn(`⚠ Contributions fetch failed (${err.message}); using committed snapshot.`);
  process.exit(0);
});
