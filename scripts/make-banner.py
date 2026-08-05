#!/usr/bin/env python3
"""
Build the LinkedIn profile banner — the OG card's drawing sheet folded to 4:1.

Two sizes from one drawing: 1584x396 is LinkedIn's native upload size, 800x200
a half-scale copy for anywhere that wants it small. LinkedIn lays the round
profile photo over the bottom-left of the banner, so everything that matters
sits in the right-hand column; the left stays texture — grid, sparkles, and
the footer rule running out from behind where the portrait will sit.

    python3 scripts/make-banner.py [outdir]

Needs Pillow and macOS system fonts, like make-og.py.
"""
from PIL import Image, ImageDraw, ImageFont
import pathlib
import sys

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
    """Set variation axes by name; any the face lacks are left at their default."""
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


def tracked_w(draw, text, font, tracking):
    return sum(draw.textlength(ch, font=font) + tracking for ch in text) - tracking


def sparkle(draw, cx, cy, r, fill):
    """The four-pointed mark used on the site — concave sides, not a fat star."""
    k = r * 0.42
    draw.polygon(
        [(cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k),
         (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k)],
        fill=fill,
    )


def render(W, H):
    """All layout in 800x200 units; s scales them to the requested canvas."""
    s = H / 200
    P = lambda v: round(v * s)
    lw = max(1, round(s))

    img = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(img)

    # ── background: 40px grid, sparkles only in the left (portrait) zone ──
    for i in range(1, 20):
        d.line([(P(i * 40), 0), (P(i * 40), H)], fill=GRID, width=lw)
    for i in range(1, 5):
        d.line([(0, P(i * 40)), (W, P(i * 40))], fill=GRID, width=lw)
    for cx, cy in [(80, 80), (80, 160), (240, 80), (240, 160)]:
        sparkle(d, P(cx), P(cy), P(6), SPARK)

    # ── drawing-sheet frame with registration crosses at the corners ──────
    M = P(12)
    d.rectangle([M, M, W - M - 1, H - M - 1], outline=RULE, width=lw)
    for cx, cy in [(M, M), (W - M - 1, M), (M, H - M - 1), (W - M - 1, H - M - 1)]:
        d.line([(cx - P(6), cy), (cx + P(6), cy)], fill=SIGNAL, width=lw)
        d.line([(cx, cy - P(6)), (cx, cy + P(6))], fill=SIGNAL, width=lw)

    # ── eyebrow, top-left — the sheet's grid reference ────────────────────
    eyebrow = variable(MONO, P(12), Weight=500)
    tracked(d, (P(32), P(22)), "JAKARTA, ID  ·  GMT+7", eyebrow, DIM, 2.4 * s)

    # ── wordmark, right-aligned: largest size that fits the column ────────
    R = P(768)
    NAME = "RANDY SETIAWAN HOESIN"
    size = 34
    while size > 18:
        name = variable(SF, P(size), Weight=860, Width=125)
        total = d.textlength(NAME, font=name) + d.textlength(".", font=name)
        if total <= R - P(280):
            break
        size -= 1
    x = R - total
    d.text((x, P(44)), NAME, font=name, fill=TEXT)
    d.text((x + d.textlength(NAME, font=name), P(44)), ".", font=name, fill=SIGNAL)

    # ── what he does, right-aligned under the name ────────────────────────
    SUB = "FULLSTACK DEVELOPER  ·  INTERNAL SYSTEMS  ·  SINCE 2016"
    size = 13
    while size > 8:
        sub = variable(MONO, P(size), Weight=500)
        tr = size / 8 * s
        if tracked_w(d, SUB, sub, tr) <= R - P(260):
            break
        size -= 1
    tracked(d, (R - tracked_w(d, SUB, sub, tr), P(98)), SUB, sub, DIM, tr)

    # ── footer rule: runs from behind the portrait, pulse where it lands ──
    d.line([(P(32), P(132)), (R, P(132))], fill=RULE, width=lw)
    d.rectangle([P(265), P(129), P(271), P(135)], fill=SIGNAL)

    dom = variable(SF, P(19), Weight=600, Width=110)
    d.text((P(280), P(142)), "rancores.space", font=dom, fill=TEXT)

    badge = variable(MONO, P(11), Weight=500)
    label = "OPEN TO SELECTED WORK"
    bw = tracked_w(d, label, badge, 2 * s) + P(30)
    bx, by, bh = R - bw, P(140), P(26)
    d.rectangle([bx, by, bx + bw, by + bh], outline=SIGNAL, width=lw)
    d.rectangle([bx + P(10), by + bh / 2 - P(3), bx + P(16), by + bh / 2 + P(3)],
                fill=SIGNAL)
    tracked(d, (bx + P(22), by + P(7)), label, badge, SIGNAL, 2 * s)

    return img


outdir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
for W, H in [(1584, 396), (800, 200)]:
    out = outdir / f"banner-{W}x{H}.png"
    render(W, H).save(out, "PNG", optimize=True)
    print(f"{out}  {W}x{H}  {out.stat().st_size / 1024:.0f} KB")
print("upload the 1584x396 one — LinkedIn's native banner size; the small one\n"
      "is the same drawing at half scale.")
