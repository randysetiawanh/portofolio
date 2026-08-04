#!/usr/bin/env python3
"""
Build the link-preview image — the card shown when the site is pasted into
WhatsApp, LinkedIn, Slack or X.

Mirrors the live site: same ink, same accents, same sparkle-grid background, and
the wordmark set wide and heavy the way Archivo is on the page.

    python3 scripts/make-og.py [out.png]

Needs Pillow and macOS system fonts. The result is not committed — it lives in
R2 as img/og.png and is swapped from /admin without a deploy.
"""
from PIL import Image, ImageDraw, ImageFont
import pathlib
import sys

W, H = 1200, 630
INK        = (8, 12, 17)
GRID       = (11, 18, 30)     # structure blue at ~5.5% over the ink
SPARK      = (17, 32, 59)     # structure blue at ~18% — texture, not decoration
RULE       = (31, 44, 57)
DIM        = (110, 129, 148)
TEXT       = (244, 248, 252)
SIGNAL     = (255, 122, 24)

SF   = "/System/Library/Fonts/SFNS.ttf"
MONO = "/System/Library/Fonts/SFNSMono.ttf"


def variable(path, size, **axes):
    """Set variation axes by name; any the face lacks are left at their default.

    Pillow only takes axes positionally, so the whole set has to be rebuilt in
    the face's own order. A static font raises here — that is fine, it just
    renders at its single weight.
    """
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_axes([
            axes.get(a["name"].decode() if isinstance(a["name"], bytes) else str(a["name"]),
                     a["default"])
            for a in f.get_variation_axes()
        ])
    except Exception:
        pass
    return f


def tracked(draw, xy, text, font, fill, tracking):
    """Pillow has no letter-spacing, so lay the glyphs out by hand."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def sparkle(draw, cx, cy, r, fill):
    """The four-pointed mark used on the site — concave sides, not a fat star."""
    k = r * 0.42
    draw.polygon(
        [(cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k),
         (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k)],
        fill=fill,
    )


PAD = 84                                   # well inside every platform's crop
COL = W - PAD * 2                          # the type column
WORDMARK = (150, 400)                      # y-band the wordmark occupies

img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img)

# ── background: 64px grid, sparkle every 256px — matches `sparkle-grid` ──
for x in range(0, W, 64):
    d.line([(x, 0), (x, H)], fill=GRID)
for y in range(0, H, 64):
    d.line([(0, y), (W, y)], fill=GRID)
for x in range(128, W, 256):
    for y in range(128, H, 256):
        if WORDMARK[0] < y < WORDMARK[1]:  # never behind the name
            continue
        sparkle(d, x, y, 10, SPARK)

# ── drawing-sheet frame with registration crosses at the corners ────────
M = 28
d.rectangle([M, M, W - M - 1, H - M - 1], outline=RULE)
for cx, cy in [(M, M), (W - M - 1, M), (M, H - M - 1), (W - M - 1, H - M - 1)]:
    d.line([(cx - 9, cy), (cx + 9, cy)], fill=SIGNAL)
    d.line([(cx, cy - 9), (cx, cy + 9)], fill=SIGNAL)

# ── eyebrow ─────────────────────────────────────────────────────────────
eyebrow = variable(MONO, 19, Weight=500)
tracked(d, (PAD, 118), "JAKARTA, ID  ·  GMT+7", eyebrow, DIM, 3.2)

# ── wordmark: largest size where the longest line still fits the column ─
LINES = ["RANDY SETIAWAN", "HOESIN"]
size = 104
while size > 40:
    name = variable(SF, size, Weight=860, Width=125)
    if max(d.textlength(l, font=name) for l in LINES) <= COL:
        break
    size -= 2

lead = round(size * 1.06)
top = 176
d.text((PAD, top), LINES[0], font=name, fill=TEXT)
d.text((PAD, top + lead), LINES[1], font=name, fill=TEXT)
d.text((PAD + d.textlength(LINES[1], font=name), top + lead), ".",
       font=name, fill=SIGNAL)

# ── what he does ────────────────────────────────────────────────────────
sub = variable(MONO, 21, Weight=500)
tracked(d, (PAD, 428), "FULLSTACK DEVELOPER  ·  INTERNAL SYSTEMS  ·  SINCE 2016",
        sub, DIM, 2.6)

# ── footer rule, domain, availability badge ─────────────────────────────
d.line([(PAD, 500), (W - PAD, 500)], fill=RULE)

dom = variable(SF, 27, Weight=600, Width=110)
d.text((PAD, 528), "rancores.space", font=dom, fill=TEXT)

badge = variable(MONO, 17, Weight=500)
label = "OPEN TO SELECTED WORK"
bw = sum(d.textlength(c, font=badge) + 2.6 for c in label) + 34
bx, by, bh = W - PAD - bw, 524, 38
d.rectangle([bx, by, bx + bw, by + bh], outline=SIGNAL)
d.rectangle([bx + 13, by + bh / 2 - 3, bx + 19, by + bh / 2 + 3], fill=SIGNAL)
tracked(d, (bx + 27, by + 10), label, badge, SIGNAL, 2.6)

out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "og.png")
img.save(out, "PNG", optimize=True)
print(f"{out}  {W}x{H}  {out.stat().st_size / 1024:.0f} KB")
print("upload as img/og.png — /admin → Media, or:\n"
      "  wrangler r2 object put portfolio-media/img/og.png "
      f"--file {out} --content-type image/png --remote")
