#!/usr/bin/env python3
"""Generate CP437-style ASCII art for the terminal experiment.

Writes src/app/services/ascii-art.ts. Run: python3 scripts/gen-ascii-art.py
Sources:
  JW logo      scripts/ascii-src/jw-logo.png (render of src/assets/img/branding/favicon.svg)
  Photo        scripts/ascii-src/github-avatar.png (github.com/u/14099593 avatar used by the old about page)
  Logos        src/assets/img/resume/{volgistics.png,configura.png,GVSU.jpg}
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CELL_ASPECT = 0.6  # JetBrains Mono advance width / line height (line-height: 1)

HALF = {(0, 0): ' ', (1, 0): '▀', (0, 1): '▄', (1, 1): '█'}


def half_blocks(mask: Image.Image, cols: int) -> str:
    """Binary mask -> ▀ ▄ █ using two vertical pixels per character cell."""
    w, h = mask.size
    rows = round(cols * h / w * CELL_ASPECT) * 2
    m = mask.convert('L').resize((cols, rows), Image.LANCZOS)
    px = m.load()
    lines = []
    for y in range(0, rows, 2):
        line = ''.join(HALF[(px[x, y] > 127, px[x, y + 1] > 127)] for x in range(cols))
        lines.append(line.rstrip())
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return '\n'.join(lines)


SHADES = ' ░▒▓█'


def shade_photo(img: Image.Image, cols: int, ramp=SHADES) -> str:
    """CP437 shade ramp ( ░▒▓█), sketch style: dark features (hair, glasses, mustache,
    shirt) get dense glyphs so the face reads on a dark terminal and the flat
    light background drops out to blank."""
    g = ImageOps.grayscale(img)
    g = ImageOps.autocontrast(g, cutoff=3)
    g = ImageOps.invert(g).filter(ImageFilter.UnsharpMask(radius=2, percent=180))
    w, h = g.size
    rows = round(cols * h / w * CELL_ASPECT)
    g = g.resize((cols, rows), Image.LANCZOS)
    px = g.load()
    n = len(ramp) - 1
    lut = lambda v: ' ' if v < 105 else ramp[min(n, max(1, round(((v / 255) ** 1.15) * n)))]
    return '\n'.join(''.join(lut(px[x, y]) for x in range(cols)).rstrip() for y in range(rows))


def gray_halfblocks(img: Image.Image, cols: int, levels: int = 32):
    """Grayscale photo as ▀ cells: fg = top pixel gray, bg = bottom pixel gray.
    Rendered at line-height: normal (JetBrains Mono content box = 1.32em), so a
    half-cell is 0.6em x 0.66em. Returns rows of merged runs [fg, bg, count]."""
    g = ImageOps.grayscale(img)
    g = ImageOps.autocontrast(g, cutoff=1)
    g = ImageOps.equalize(g).point(lambda v: int(255 * (v / 255) ** 1.1))
    g = g.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=2))
    w, h = g.size
    rows = round(cols * h / w * 0.6 / 0.66 / 2) * 2
    g = g.resize((cols, rows), Image.LANCZOS)
    px = g.load()
    q = lambda v: round(v / 255 * (levels - 1))
    out = []
    for y in range(0, rows, 2):
        runs = []
        for x in range(cols):
            fg, bg = q(px[x, y]), q(px[x, y + 1])
            if runs and runs[-1][0] == fg and runs[-1][1] == bg:
                runs[-1][2] += 1
            else:
                runs.append([fg, bg, 1])
        out.append(runs)
    return out


def key_background(img: Image.Image, tol: int = 40) -> Image.Image:
    """Make the flat background connected to the corners transparent (flood fill),
    so white parts inside a logo (e.g. the Volgistics V) are kept."""
    rgba = img.convert('RGBA')
    w, h = rgba.size
    px = rgba.load()
    ref = px[0, 0]
    if ref[3] < 20:
        return rgba
    seen = set()
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        r, g, b, a = px[x, y]
        if abs(r - ref[0]) + abs(g - ref[1]) + abs(b - ref[2]) > tol:
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return rgba


def color_halfblocks(img: Image.Image, max_cols: int, max_rows: int):
    """Logo as ▀ cells with real colors: fg = top pixel, bg = bottom pixel,
    None = transparent. Fits inside max_cols x max_rows keeping aspect.
    Colors are quantized to 4 bits/channel so runs merge. Returns rows of [fg, bg, n]."""
    rgba = img.convert('RGBA')
    rgba = rgba.crop(rgba.getchannel('A').point(lambda a: 255 if a > 100 else 0).getbbox())
    w, h = rgba.size
    cell_w, half_h = 0.6, 0.66  # em
    cols = max_cols
    prow = round(cols * cell_w * h / w / half_h)
    if prow > max_rows * 2:
        prow = max_rows * 2
        cols = round(prow * half_h * w / h / cell_w)
    prow += prow % 2
    # Supersample then box-reduce (premultiplied) for clean anti-aliased edges.
    small = rgba.resize((cols, prow), Image.BOX)
    px = small.load()

    def col(v):
        r, g, b, a = v
        if a < 100:
            return None
        q = lambda c: min(15, round(c / 17))
        return '#' + ''.join('0123456789abcdef'[q(c)] for c in (r, g, b))

    out = []
    for y in range(0, prow, 2):
        runs = []
        for x in range(cols):
            fg, bg = col(px[x, y]), col(px[x, y + 1])
            if runs and runs[-1][0] == fg and runs[-1][1] == bg:
                runs[-1][2] += 1
            else:
                runs.append([fg, bg, 1])
        while runs and runs[-1][0] is None and runs[-1][1] is None:
            runs.pop()
        out.append(runs)
    while out and not out[0]:
        out.pop(0)
    while out and not out[-1]:
        out.pop()
    return out


def mask_from(img: Image.Image, test) -> Image.Image:
    rgba = img.convert('RGBA')
    out = Image.new('L', rgba.size, 0)
    src, dst = rgba.load(), out.load()
    for y in range(rgba.size[1]):
        for x in range(rgba.size[0]):
            dst[x, y] = 255 if test(*src[x, y]) else 0
    return out


def main():
    res = ROOT / 'src/assets/img/resume'
    logo = Image.open(ROOT / 'scripts/ascii-src/jw-logo.png')
    jw = half_blocks(mask_from(logo, lambda r, g, b, a: r < 128), 50)
    jw_small = half_blocks(mask_from(logo, lambda r, g, b, a: r < 128), 30)

    photo_runs = gray_halfblocks(Image.open(ROOT / 'scripts/ascii-src/github-avatar.png').crop((95, 30, 315, 330)), 60)
    photo = '\\n'.join('▀' * sum(r[2] for r in row) for row in photo_runs)

    volg = half_blocks(mask_from(Image.open(res / 'volgistics.png'),
                                 lambda r, g, b, a: a > 128 and r > 200 and g < 190 and b < 140), 22)
    conf = half_blocks(mask_from(Image.open(res / 'configura.png'), lambda r, g, b, a: a > 128), 22)
    gvsu = half_blocks(mask_from(Image.open(res / 'GVSU.jpg'), lambda r, g, b, a: b > 90 and r < 90), 22)

    def ts(name, s):
        return f'export const {name} = {repr(s)};\n'.replace("'", '`') if '`' not in s else ''

    out = ['// AUTO-GENERATED by scripts/gen-ascii-art.py. Do not edit by hand.\n']
    for name, s in [('JW_LOGO', jw), ('JW_LOGO_SMALL', jw_small), ('PHOTO', photo),
                    ('VOLGISTICS_LOGO', volg), ('CONFIGURA_LOGO', conf), ('GVSU_LOGO', gvsu)]:
        out.append(f'export const {name} = {json_str(s)};\n')
    import json
    SEP = (',', ':')
    out.append('/** Grayscale photo: rows of [fgLevel, bgLevel, count] runs of ▀ (levels 0-31). */\n')
    out.append(f'export const PHOTO_GRAY: [number, number, number][][] = {json.dumps(photo_runs, separators=SEP)};\n')
    out.append('export const PHOTO_GRAY_LEVELS = 32;\n')
    logos = {
        'VOLGISTICS_COLOR': key_background(Image.open(res / 'volgistics.png')),
        'CONFIGURA_COLOR': Image.open(res / 'configura.png').convert('RGBA'),
        'GVSU_COLOR': key_background(Image.open(res / 'GVSU.jpg')),
    }
    out.append('/** Color logos: rows of [fg, bg, count] runs of ▀; null = transparent. */\n')
    for name, im in logos.items():
        out.append(f'export const {name}: [string | null, string | null, number][][] = {json.dumps(color_halfblocks(im, 60, 37), separators=SEP)};\n')
    (ROOT / 'src/app/services/ascii-art.ts').write_text(''.join(out), encoding='utf-8')
    for name, s in [('jw', jw), ('jw_small', jw_small), ('volg', volg), ('conf', conf), ('gvsu', gvsu)]:
        print(f'--- {name}\n{s}')


def json_str(s):
    import json
    return json.dumps(s, ensure_ascii=False)


if __name__ == '__main__':
    main()
