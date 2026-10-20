#!/usr/bin/env node
// Generates src/assets/img/branding/graph.png: the 1200x630 Open Graph card.
// Renders a terminal-styled page with the site's own font, JW logo and default
// theme in headless Chromium, so the card tracks the live site's look.
// Run: node scripts/gen-social-card.mjs  (needs Chromium; set CHROME to override the binary)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JW_LOGO } from '../src/app/services/ascii-art.ts';
import { TERMINAL_THEMES, DEFAULT_THEME } from '../src/app/services/omarchy-themes.ts';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'src/assets/img/branding/graph.png');
const fonts = join(root, 'src/assets/fonts');
const t = TERMINAL_THEMES.find(theme => theme.name === DEFAULT_THEME);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Verbatim from x.com/jxn_w; update by hand when the bio changes.
const bio = 'software developer • tesla owner, investor • gamer • arch user • wild berry skittles addict • never sarcastic';

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: JBM; src: url("file://${fonts}/JetBrainsMonoNerdFont-Regular.woff2"); font-weight: 400; }
  @font-face { font-family: JBM; src: url("file://${fonts}/JetBrainsMonoNerdFont-Bold.woff2"); font-weight: 700; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    background: ${t.background}; color: ${t.foreground};
    font-family: JBM, monospace; font-size: 26px; line-height: 1.5; letter-spacing: 0.02em;
    display: flex; flex-direction: column;
  }
  .screen { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 64px; }
  .logo { font-size: 15px; line-height: 1; letter-spacing: 0; white-space: pre; color: ${t.bright}; font-variant-ligatures: none; }
  .ps1 { color: ${t.accent}; }
  .muted { color: ${t.dim}; }
  .prompt { margin-top: 44px; }
  .out { padding-left: 2ch; }
  .out h1 { text-transform: uppercase; font-size: 1em; font-weight: 700; color: ${t.bright}; }
  .out h1::before { content: '## '; color: ${t.dim}; font-weight: 400; }
  .cursor { color: ${t.bright}; }
  .bar {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid #333; padding: 18px 64px 22px; font-size: 19px; text-transform: uppercase;
  }
  .bar b { font-weight: 400; color: ${t.bright}; }
</style>
<div class="screen">
  <pre class="logo">${esc(JW_LOGO)}</pre>
  <p class="prompt"><span class="ps1">guest@jaxon.dev:~$</span> whoami</p>
  <div class="out">
    <h1>Jaxon Wright</h1>
    <p class="muted">${esc(bio)}</p>
  </div>
  <p><span class="ps1">guest@jaxon.dev:~$</span> <span class="cursor">█</span></p>
</div>
<footer class="bar">
  <b>jaxon.dev</b>
  <span class="muted">01001010 01001000 01010111</span>
</footer>
`;

const dir = mkdtempSync(join(tmpdir(), 'social-card-'));
try {
  const page = join(dir, 'card.html');
  writeFileSync(page, html);
  execFileSync(process.env.CHROME || 'chromium', [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--allow-file-access-from-files', '--window-size=1200,630', '--virtual-time-budget=3000',
    `--screenshot=${out}`, `file://${page}`,
  ], { stdio: 'ignore' });
  console.log(`wrote ${out}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
