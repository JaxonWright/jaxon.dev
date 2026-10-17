#!/usr/bin/env python3
"""Subset JetBrains Mono Nerd Font for the terminal.

Writes src/assets/fonts/JetBrainsMonoNerdFont-{Regular,Bold}.woff2.
Run: python3 scripts/subset-fonts.py  (needs: pip install fonttools brotli)

Downloads the pinned Nerd Fonts release and keeps every JetBrains Mono glyph and
OpenType feature, dropping only the Nerd Font icons (Private Use Area), which the
site never renders. Each file goes from ~1 MB to under 100 kB.
"""
import io
import tarfile
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
RELEASE = 'https://github.com/ryanoasis/nerd-fonts/releases/download/v3.5.1/JetBrainsMono.tar.xz'
STYLES = ['Regular', 'Bold']


def is_icon(cp: int) -> bool:
    return 0xE000 <= cp <= 0xF8FF or cp >= 0xF0000


def main() -> None:
    with urllib.request.urlopen(RELEASE) as res:
        archive = tarfile.open(fileobj=io.BytesIO(res.read()), mode='r:xz')
    for style in STYLES:
        font = TTFont(archive.extractfile(f'JetBrainsMonoNerdFont-{style}.ttf'))
        keep = [cp for cp in font.getBestCmap() if not is_icon(cp)]
        options = subset.Options()
        options.layout_features = ['*']
        options.name_IDs = ['*']
        options.name_languages = ['*']
        options.notdef_outline = True
        options.glyph_names = False
        options.hinting = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=keep)
        subsetter.subset(font)
        font.flavor = 'woff2'
        out = ROOT / 'src/assets/fonts' / f'JetBrainsMonoNerdFont-{style}.woff2'
        font.save(out)
        print(f'{out.relative_to(ROOT)}: {len(keep)} codepoints, {out.stat().st_size // 1024} kB')


if __name__ == '__main__':
    main()
