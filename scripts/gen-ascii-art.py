#!/usr/bin/env python3
"""Generate CP437-style ASCII art for the terminal experiment.

Writes src/app/services/ascii-art.ts. Run: python3 scripts/gen-ascii-art.py
Sources:
  JW logo      scripts/ascii-src/jw-logo.png (render of src/assets/img/branding/favicon.svg)
  Photo        scripts/ascii-src/github-avatar.png  (▀ half-blocks, 32 levels, theme-tinted) (github.com/u/14099593 avatar used by the old about page)
  Logos        src/assets/img/resume/{volgistics.png,configura.png,GVSU.jpg}
  OS logos     drawn below with PIL primitives (simplified silhouettes, mono, theme-coloured)
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


def os_logos(cols: int = 24) -> dict:
    """Compact fastfetch-style OS silhouettes drawn from primitives (no brand assets)."""
    from PIL import ImageDraw
    S = 400

    def canvas():
        m = Image.new('L', (S, S), 0)
        return m, ImageDraw.Draw(m)

    def done(m):
        return half_blocks(tight(m), cols)

    out = {}
    # Windows: four panes.
    m, d = canvas(); g = 24; h = (S - g) // 2
    for x in (0, h + g):
        for y in (0, h + g):
            d.rectangle((x, y, x + h, y + h), fill=255)
    out['windows'] = done(m)

    # Apple: two-lobed body, bite on the right, leaf on top.
    m, d = canvas()
    d.ellipse((40, 110, 230, 360), fill=255); d.ellipse((170, 110, 360, 360), fill=255)
    d.ellipse((90, 230, 310, 395), fill=255)
    d.ellipse((290, 165, 440, 315), fill=0)
    d.ellipse((150, 120, 250, 150), fill=0)
    leaf = Image.new('L', (S, S), 0); ImageDraw.Draw(leaf).ellipse((165, 10, 245, 100), fill=255)
    m.paste(255, (0, 0), leaf.rotate(-35, center=(205, 55)))
    out['apple'] = done(m)

    # Tux: head + body, belly and eye holes, beak, feet.
    m, d = canvas()
    d.ellipse((120, 20, 280, 170), fill=255)
    d.ellipse((70, 110, 330, 380), fill=255)
    d.ellipse((125, 170, 275, 360), fill=0)
    d.ellipse((150, 60, 185, 105), fill=0); d.ellipse((215, 60, 250, 105), fill=0)
    d.polygon([(165, 115), (235, 115), (200, 150)], fill=0)
    d.ellipse((40, 330, 190, 395), fill=255); d.ellipse((210, 330, 360, 395), fill=255)
    out['tux'] = done(m)

    # Android robot: head dome with antennae and eyes, body, arms, legs.
    m, d = canvas()
    d.pieslice((90, 40, 310, 230), 180, 360, fill=255)
    d.line((140, 70, 110, 20), fill=255, width=14); d.line((260, 70, 290, 20), fill=255, width=14)
    d.ellipse((150, 85, 180, 115), fill=0); d.ellipse((220, 85, 250, 115), fill=0)
    d.rounded_rectangle((90, 148, 310, 320), 30, fill=255)
    d.rounded_rectangle((30, 148, 75, 290), 22, fill=255); d.rounded_rectangle((325, 148, 370, 290), 22, fill=255)
    d.rounded_rectangle((130, 300, 180, 395), 22, fill=255); d.rounded_rectangle((220, 300, 270, 395), 22, fill=255)
    out['android'] = done(m)

    # Chrome: outer ring split by three spokes around an inner disc.
    import math
    m, d = canvas(); c = S / 2
    d.ellipse((0, 0, S, S), fill=255)
    d.ellipse((c - 105, c - 105, c + 105, c + 105), fill=0)
    d.ellipse((c - 75, c - 75, c + 75, c + 75), fill=255)
    for a in (90, 210, 330):
        r = math.radians(a)
        x0, y0 = c + 90 * math.cos(r - math.pi / 2), c + 90 * math.sin(r - math.pi / 2)
        d.line((x0, y0, x0 + 260 * math.cos(r), y0 + 260 * math.sin(r)), fill=0, width=22)
    out['chrome'] = done(m)
    return out


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
