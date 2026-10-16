#!/usr/bin/env python3
"""Generate CP437-style ASCII art for the terminal experiment.

Writes src/app/services/ascii-art.ts. Run: python3 scripts/gen-ascii-art.py
Sources:
  JW logo      scripts/ascii-src/jw-logo.png (render of src/assets/img/branding/favicon.svg)
  Photo        scripts/ascii-src/github-avatar.png  (▀ half-blocks, 32 levels, theme-tinted) (github.com/u/14099593 avatar used by the old about page)
  Logos        src/assets/img/resume/{volgistics.png,configura.png,GVSU.jpg}
  OS logos     scripts/ascii-src/os/*.svg (Simple Icons, CC0) rendered to *.png at 800px
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


def mask_from(img: Image.Image, test) -> Image.Image:
    rgba = img.convert('RGBA')
    out = Image.new('L', rgba.size, 0)
    src, dst = rgba.load(), out.load()
    for y in range(rgba.size[1]):
        for x in range(rgba.size[0]):
            dst[x, y] = 255 if test(*src[x, y]) else 0
    return out


def tight(mask: Image.Image) -> Image.Image:
    return mask.crop(mask.getbbox())


def two_tone_cells(img: Image.Image, cols: int):
    """Two-tone half-block cells: 1 = ink (dark pixels), 2 = light areas fully enclosed
    by the ink (Tux's belly, face and feet), 0 = outside. Returns rows of
    [top, bottom, count] runs, rendered as ▀/█ with per-cell fg/bg theme colours."""
    from PIL import ImageDraw
    ink = tight(mask_from(img, lambda r, g, b, a: r < 128))
    w, h = ink.size
    rows = round(cols * h / w * CELL_ASPECT) * 2
    pad = Image.new('L', (w + 2, h + 2), 0); pad.paste(ink, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), 128)
    outside = pad.crop((1, 1, w + 1, h + 1)).point(lambda v: 255 if v == 128 else 0)
    ik = ink.resize((cols, rows), Image.LANCZOS).load()
    ou = outside.resize((cols, rows), Image.LANCZOS).load()
    cls = lambda x, y: 1 if ik[x, y] > 110 else (0 if ou[x, y] > 127 else 2)
    out = []
    for y in range(0, rows, 2):
        runs = []
        for x in range(cols):
            c = [cls(x, y), cls(x, y + 1)]
            if runs and runs[-1][:2] == c:
                runs[-1][2] += 1
            else:
                runs.append(c + [1])
        if runs and runs[-1][:2] == [0, 0]:
            runs.pop()
        out.append(runs)
    while out and not out[-1]:
        out.pop()
    return out


def os_logos() -> dict:
    """Official OS marks (Simple Icons) as compact half-block art, fastfetch-style."""
    src = ROOT / 'scripts/ascii-src/os'
    def mono(name, cols):
        return half_blocks(tight(mask_from(Image.open(src / f'{name}.png'), lambda r, g, b, a: r < 128)), cols)
    return {
        'windows': mono('windows', 24),
        'apple': mono('apple', 24),
        'tux': half_blocks(tight(mask_from(Image.open(src / 'linux.png'), lambda r, g, b, a: r < 128)), 30),
        'android': mono('android', 28),
        'chrome': mono('googlechrome', 26),
    }


def main():
    import json
    sep = (',', ':')
    res = ROOT / 'src/assets/img/resume'
    logo = Image.open(ROOT / 'scripts/ascii-src/jw-logo.png')
    jw_mask = mask_from(logo, lambda r, g, b, a: r < 128)
    jw = half_blocks(jw_mask, 50)
    jw_small = half_blocks(jw_mask, 30)

    photo_runs = gray_halfblocks(Image.open(ROOT / 'scripts/ascii-src/github-avatar.png').crop((95, 30, 315, 330)), 60)

    # Monochrome logos: background flood-filled away from the corners, then tightly cropped.
    # Volgistics keeps every non-white pixel of the disc (incl. the lighter highlight at the
    # top, which a plain orange test used to miss and left a notch); the white V is the hole.
    volg = half_blocks(tight(mask_from(key_background(Image.open(res / 'volgistics.png')),
                                       lambda r, g, b, a: a > 100 and not (r > 235 and g > 235 and b > 235))), 22)
    conf = half_blocks(tight(mask_from(Image.open(res / 'configura.png'), lambda r, g, b, a: a > 128)), 22)
    gvsu = half_blocks(tight(mask_from(key_background(Image.open(res / 'GVSU.jpg')),
                                       lambda r, g, b, a: a > 100 and b > 90 and r < 120)), 22)

    osl = os_logos()

    out = ['// AUTO-GENERATED by scripts/gen-ascii-art.py. Do not edit by hand.\n']
    for name, art in [('JW_LOGO', jw), ('JW_LOGO_SMALL', jw_small),
                      ('VOLGISTICS_LOGO', volg), ('CONFIGURA_LOGO', conf), ('GVSU_LOGO', gvsu)]:
        out.append(f'export const {name} = {json.dumps(art, ensure_ascii=False)};\n')
    out.append('/** Static OS silhouettes for the Build Info (fastfetch) page. */\n')
    out.append(f'export const OS_LOGOS: Record<string, string> = {json.dumps(osl, ensure_ascii=False, indent=2)};\n')
    out.append('/** Tux, two-tone: rows of [top, bottom, count]; 0 none, 1 body (accent), 2 belly/feet (light). */\n')
    out.append(f'export const TUX_CELLS: [number, number, number][][] = {json.dumps(two_tone_cells(Image.open(ROOT / "scripts/ascii-src/os/linux.png"), 30), separators=sep)};\n')
    out.append('/** Photo: rows of [topLevel, bottomLevel, count] runs of ▀ (levels 0-31), tinted with the theme color. */\n')
    out.append(f'export const PHOTO_LEVELS: [number, number, number][][] = {json.dumps(photo_runs, separators=sep)};\n')
    out.append('export const PHOTO_LEVEL_COUNT = 32;\n')
    (ROOT / 'src/app/services/ascii-art.ts').write_text(''.join(out), encoding='utf-8')
    for name, art in [('jw', jw), ('jw_small', jw_small), ('volg', volg), ('conf', conf), ('gvsu', gvsu)]:
        print(f'--- {name}\n{art}')
    for name, art in osl.items():
        print(f'--- {name}\n{art}')


if __name__ == '__main__':
    main()
