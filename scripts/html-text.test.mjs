import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { htmlToText } from './html-text.mjs';

const { document } = new JSDOM('').window;
const browser = html => { const el = document.createElement('span'); el.innerHTML = html; return el.textContent; };

test('matches what a browser renders for Spotify text', () => {
  const samples = [
    'Prime Rock', 'R&B <3', 'Rock &amp; Roll', 'AC&#x2F;DC &#x27;n&#x27; friends', '&quot;Quoted&quot; &lt;b&gt;not bold&lt;/b&gt;',
    'Synthwave <a href="spotify:playlist:abc">and friends</a>.', '<b>bold</b> &nbsp;spaced', 'emoji &#128293; &#x1F3B8;',
    '1 < 2 > 0', 'Tom & Jerry', 'unknown &zzz; entity', '&AMP; upper', '', 'line<br>break', '&#0; &#xD800; &#x110000;',
    'Rock&rsquo;n&rsquo;roll &mdash; caf&eacute; &hellip;', 'legacy &copy 2026 &amp no semicolon', '&#x80; &#150; windows-1252',
  ];
  for (const s of samples) assert.equal(htmlToText(s), browser(s), JSON.stringify(s));
});
