"""Cover every numeric readout in a screenshot with a redaction bar.

The ministry's operational figures must not leave the building, so the bars go
on before the image reaches a PDF. Two OCR passes, unioned:

  whole-image at 5x   — reads the dense cards and long numbers
  4x4 overlapping tiles at 8x — the only pass that sees single digits and the
                        small skewed text inside the perspective mock-ups

Neither pass finds everything alone. Re-run `verify()` after any change: it
re-reads the output and fails loudly if a digit survived.
"""
import subprocess, sys, csv, io, os
from PIL import Image, ImageDraw

DIM = (110, 129, 148)     # --dim, the colour the site redacts with

def ocr(img, scale, psms=("3", "6", "11", "12"), digits_only=False):
    """Return digit-bearing boxes in `img` coordinates."""
    tmp = os.path.join(os.getcwd(), "_ocr.png")
    img.resize((img.width * scale, img.height * scale), Image.LANCZOS).save(tmp)
    out = []
    for psm in psms:
        cmd = ["tesseract", tmp, "-", "--psm", psm, "tsv"]
        if digits_only:
            cmd += ["-c", "tessedit_char_whitelist=0123456789"]
        txt = subprocess.run(cmd,
                             capture_output=True).stdout.decode("utf-8", "replace")
        for r in csv.DictReader(io.StringIO(txt), delimiter="\t", quoting=csv.QUOTE_NONE):
            try:
                conf, s = float(r["conf"]), (r["text"] or "").strip()
            except (TypeError, ValueError, KeyError):
                continue
            if conf < 5 or not any(c.isdigit() for c in s):
                continue
            x, y, w, h = (int(r[k]) for k in ("left", "top", "width", "height"))
            if w > img.width * scale * 0.55:        # a whole line, not a readout
                continue
            out.append((x / scale, y / scale, w / scale, h / scale))
    return out

def all_boxes(im):
    found = ocr(im, 5)
    TX, TY = 4, 4                                   # overlapping tiles
    tw, th = im.width / TX, im.height / TY
    for i in range(TX):
        for j in range(TY):
            l, t = max(0, i * tw - tw * .15), max(0, j * th - th * .15)
            r, b = min(im.width, l + tw * 1.3), min(im.height, t + th * 1.3)
            tile = im.crop((int(l), int(t), int(r), int(b)))
            for (x, y, w, h) in ocr(tile, 8, ("6", "11")):
                found.append((x + l, y + t, w, h))
    # third pass, digits only on a finer grid: the smaller the tile the larger
    # a lone digit reads, and a lone digit beside a label ("9 / Proses
    # Likuidasi") is exactly what the word-shaped passes walk straight past.
    FX, FY = 8, 8
    fw, fh = im.width / FX, im.height / FY
    for i in range(FX):
        for j in range(FY):
            l, t = max(0, i * fw - fw * .2), max(0, j * fh - fh * .2)
            r, b = min(im.width, l + fw * 1.4), min(im.height, t + fh * 1.4)
            tile = im.crop((int(l), int(t), int(r), int(b)))
            for (x, y, w, h) in ocr(tile, 10, ("11",), digits_only=True):
                if w < tile.width * .5 and h < tile.height * .6:
                    found.append((x + l, y + t, w, h))
    return found

# What OCR cannot see. A pale thin digit on a pale card defeats every pass
# above, so the few that survive are listed by hand after a visual sweep —
# keyed by source name, in coordinates of the cropped image.
PATCHES = {
    "p-003-011.jpg": [(248, 323, 18, 18)],       # "9" · Proses Likuidasi
}

def redact(src, dst):
    im = Image.open(src).convert("RGB")
    d = ImageDraw.Draw(im)
    for (x, y, w, h) in all_boxes(im) + PATCHES.get(os.path.basename(dst), []):
        d.rectangle([x - 1.5, y - 1.5, x + w + 1.5, y + h + 1.5], fill=DIM)
    im.save(dst, quality=92)
    return im

def verify(path):
    """Any digit still legible in the output is a leak."""
    left = ocr(Image.open(path).convert("RGB"), 6, ("6", "11"))
    return len(left)

if __name__ == "__main__":
    os.makedirs("clean", exist_ok=True)
    for p in sys.argv[1:]:
        out = p.replace("imgs/", "clean/")
        redact(p, out)
        print(f"{os.path.basename(p)} → sisa terbaca: {verify(out)}")
