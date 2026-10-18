#!/usr/bin/env python3
"""Generate CP437-style ASCII art for the terminal experiment.

Writes src/app/services/ascii-art.ts. Run: python3 scripts/gen-ascii-art.py
Sources:
  JW logo      scripts/ascii-src/jw-logo.png (render of src/assets/img/branding/favicon.svg)
  Photo        scripts/ascii-src/github-avatar.png  (▀ half-blocks, 32 levels, theme-tinted) (github.com/u/14099593 avatar used by the old about page)
  Logos        src/assets/img/resume/{volgistics.png,configura.png,GVSU.jpg}
  Projects     scripts/ascii-src/projects/* (Simple Icons CC0 SVG renders, project/app icons)
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


def icon_cells(img: Image.Image, cols: int, invert: bool = False, classify=None, max_rows: int = None):
    """Compact two-tone icon: background keyed away, opaque pixels split by luminance
    (Otsu) into the main tone (1, theme accent) and the minor tone (2, light text).
    Returns rows of [top, bottom, count] runs for ▀ cells (0 = empty)."""
    rgba = img.convert('RGBA')
    if rgba.getchannel('A').getextrema()[0] == 255:  # no transparency: key the flat background away
        rgba = key_background(rgba)
    lo, hi = ImageOps.grayscale(rgba).getextrema()
    rgba = rgba.crop(rgba.getchannel('A').point(lambda a: 255 if a > 100 else 0).getbbox())
    w, h = rgba.size
    rows = max(2, round(cols * h / w * CELL_ASPECT) * 2)
    max_rows = max_rows or PROJECT_ICON_MAX_ROWS
    if rows > 2 * max_rows:  # keep tall marks (single letters) to the same height
        cols = max(4, round(cols * 2 * max_rows / rows)); rows = 2 * max_rows
    alpha = rgba.getchannel('A').resize((cols, rows), Image.LANCZOS).load()
    lum = ImageOps.grayscale(rgba.convert('RGB'))
    opaque = [v for v, a in zip(lum.getdata(), rgba.getchannel('A').getdata()) if a > 100]
    hist = [0] * 256
    for v in opaque: hist[v] += 1
    total, sum_all = len(opaque), sum(i * c for i, c in enumerate(hist))
    best, thr, wb, sb = -1, 128, 0, 0
    for t in range(256):
        wb += hist[t]; sb += t * hist[t]
        if wb == 0 or wb == total: continue
        mb, mf = sb / wb, (sum_all - sb) / (total - wb)
        var = wb * (total - wb) * (mb - mf) ** 2
        if var > best: best, thr = var, t
    spread = (max(opaque) - min(opaque)) if opaque else 0
    small = lum.resize((cols, rows), Image.LANCZOS).load()
    dark_n = sum(c for i, c in enumerate(hist) if i <= thr)
    main_is_dark = (dark_n >= total - dark_n) != invert
    if classify:  # explicit colour -> tone mapping (multi-tone icons)
        rgb = rgba.convert('RGB').resize((cols, rows), Image.LANCZOS).load()
    def cls(x, y):
        if alpha[x, y] < 128: return 0
        if classify: return classify(*rgb[x, y])
        if spread < 60: return 1
        dark = small[x, y] <= thr
        return 1 if dark == main_is_dark else 2
    out = []
    for y in range(0, rows, 2):
        runs = []
        for x in range(cols):
            c = [cls(x, y), cls(x, y + 1)]
            if runs and runs[-1][:2] == c: runs[-1][2] += 1
            else: runs.append(c + [1])
        if runs and runs[-1][:2] == [0, 0]: runs.pop()
        out.append(runs)
    while out and not out[-1]: out.pop()
    while out and not out[0]: out.pop(0)
    return out


PROJECT_ICON_COLS = 24
PROJECT_ICON_MAX_ROWS = 14
PROJECT_ICON_WIDE = {'ciner8': 48, 'testube': 60, 'omnigear': 96, 'sentinel': 60, 'midnight': 84, 'passageway': 72, 'nowpaper': 32, 'digalog': 120}  # wordmarks
PROJECT_ICONS = {
    # key: (path relative to repo root, invert minor/main tones)
    'omarchy': ('scripts/ascii-src/projects/omarchy.png', False),
    'angular': ('scripts/ascii-src/projects/angular.png', False),
    'bambulab': ('scripts/ascii-src/projects/bambulab.png', False),
    'steelseries': ('scripts/ascii-src/projects/steelseries.png', False),
    'github': ('scripts/ascii-src/projects/github.png', False),
    'delphi': ('scripts/ascii-src/projects/delphi.png', False),
    'wearos': ('scripts/ascii-src/projects/wearos.png', False),
    # Final Digalog wordmark from Tick (dark-background variant, transparent).
    'digalog': ('scripts/ascii-src/projects/digalog-dark.png', False),
    'jw': ('scripts/ascii-src/jw-logo.png', False),
    'testube': ('src/assets/img/projects/testube.png', False),
    'omnigear': ('scripts/ascii-src/projects/omnigear.png', False),
    'sentinel': ('src/assets/img/projects/sentinel.png', False),
    'passageway': ('scripts/ascii-src/projects/passageway-readme.png', False),
    'midnight': ('scripts/ascii-src/projects/midnight-wordmark.png', False),
    'ciner8': ('scripts/ascii-src/projects/ciner8-icon.png', False),
    'reddit': ('scripts/ascii-src/projects/reddit.png', False),
    'tallyup': ('src/assets/img/apps/tallyup_green.png', False),
    'pixbar': ('src/assets/img/apps/pixbar.png', False),
    'xpaper': ('src/assets/img/apps/xpaper.png', False),
    'nowpaper': ('src/assets/img/apps/nowPaper.png', False),
    # Penny (Grok Bot): the avatar from the bot's x.ai share card (og:image), cropped to the circle.
    'penny': ('scripts/ascii-src/projects/penny.png', False),
    'configura': ('src/assets/img/resume/configura.png', False),
    'volgistics': ('src/assets/img/resume/volgistics.png', False),
}


def fill_outlined(img: Image.Image) -> Image.Image:
    """Outlined lettering (white strokes on black) -> solid letters with counters kept.
    Regions alternate outside / stroke / letter body / stroke / counter, so fill the
    strokes and the black regions at nesting depth 2 (mod 4)."""
    import numpy as np
    from scipy import ndimage
    a = np.array(img.getchannel('A')) > 127
    a = np.pad(a, 1)
    lw, nw = ndimage.label(a)
    lb, nb = ndimage.label(~a)
    lab = np.where(a, lw, lb + nw)
    n = nw + nb
    adj = [set() for _ in range(n + 1)]
    for x, y in ((lab[:, :-1], lab[:, 1:]), (lab[:-1, :], lab[1:, :])):
        m = x != y
        for u, v in set(zip(x[m].tolist(), y[m].tolist())):
            adj[u].add(v); adj[v].add(u)
    depth = {int(lab[0, 0]): 0}
    queue = [int(lab[0, 0])]
    while queue:
        u = queue.pop(0)
        for v in adj[u]:
            if v not in depth:
                depth[v] = depth[u] + 1; queue.append(v)
    keep = np.zeros(n + 1, bool)
    for c, d in depth.items():
        keep[c] = d % 4 != 0  # 1 outer stroke, 2 body, 3 inner stroke; 0 outside/counter
    out = keep[lab][1:-1, 1:-1]
    res = Image.new('RGBA', img.size, (0, 0, 0, 0))
    res.putalpha(Image.fromarray((out * 255).astype('uint8')))
    return res


# Multi-tone icons: 1 theme primary, 2 background cut-out, 3 light text, 4 theme secondary.
PROJECT_ICON_CLASSIFY = {
    # nowPaper: sky -> primary, mountains -> cut-outs, snow caps and sun -> light.
    # Digalog: green seven-segment 'dig' -> theme secondary (4), 'alog' -> primary (faint off-segments drop out via alpha).
    'digalog': lambda r, g, b: 4 if g > r + 40 else 1,
    'nowpaper': lambda r, g, b: 3 if (r > 200 and g > 200) else 2 if (r + g + b) / 3 < 125 else 1,
}

PROJECT_ICON_MAX_ROWS_FOR = {'nowpaper': 20, 'digalog': 18}  # detailed multi-tone art gets more height (digalog: 103 cols, 309px, fits a 360px phone)

PROJECT_ICON_PREP = {
    # Wordmark-only sources: crop the mark / first letter, thicken hairlines.
    # Fill the outlined letters, then erode so neighbouring letters stay separate.
    # Passageway's README wordmark is a hairline font: thicken the strokes.
    'passageway': lambda im: (lambda f: (f.putalpha(f.getchannel('A').filter(ImageFilter.MaxFilter(13))), f)[1])(im.convert('RGBA')),
    'midnight': lambda im: (lambda f: (f.putalpha(f.getchannel('A').filter(ImageFilter.MinFilter(13))), f)[1])(fill_outlined(im)),
}


def project_icons() -> dict:
    out = {}
    for k, (p, inv) in PROJECT_ICONS.items():
        im = Image.open(ROOT / p)
        if k in PROJECT_ICON_PREP:
            im = PROJECT_ICON_PREP[k](im)
        out[k] = icon_cells(im, PROJECT_ICON_WIDE.get(k, PROJECT_ICON_COLS), inv, PROJECT_ICON_CLASSIFY.get(k), PROJECT_ICON_MAX_ROWS_FOR.get(k))
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
    out.append('/** Project logos (two-tone ▀ cells): rows of [top, bottom, count]; 0 none, 1 primary, 2 background cut-out, 3 light text, 4 secondary. */\n')
    out.append(f'export const PROJECT_LOGOS: Record<string, [number, number, number][][]> = {json.dumps(project_icons(), separators=sep)};\n')
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
