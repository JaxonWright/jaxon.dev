const NAMED = { amp: '&', AMP: '&', lt: '<', LT: '<', gt: '>', GT: '>', quot: '"', QUOT: '"', apos: "'", nbsp: '\u00a0' };

/** The text a browser shows for Spotify's HTML-ish names and descriptions: tags dropped, entities decoded. */
export function htmlToText(html) {
  return html
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi, (m, hex, dec, name) => {
      if (name) return NAMED[name] ?? m;
      const cp = parseInt(hex ?? dec, hex ? 16 : 10);
      return cp > 0 && cp <= 0x10ffff && !(cp >= 0xd800 && cp <= 0xdfff) ? String.fromCodePoint(cp) : '�';
    });
}
