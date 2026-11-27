"""
Design B ("The Issue"): builds every logo file from ONE source image,
public/brand/astra-logo-white.png (white logo, transparent background).

The logo is a single-colour shape, so the ink version is the same shape
(its transparency) filled with the theme ink. Nothing is drawn by hand.

Run after replacing the source logo:  python scripts/make-brand.py
Needs Pillow (pip install pillow). Outputs:
  public/brand/astra-ink.webp        cropped logo in ink, 640px wide (cover, HUD, menu)
  app/icon.png, app/apple-icon.png, app/favicon.ico   ink logo on paper
  app/opengraph-image.png            1200x630 share image placeholder
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
INK = (10, 10, 10)  # #0A0A0A, same as lib/theme.js
PAPER = (246, 244, 239)  # #F6F4EF, same as lib/theme.js

src = Image.open(ROOT / "public/brand/astra-logo-white.png").convert("RGBA")
alpha = src.getchannel("A")
alpha = alpha.crop(alpha.getbbox())  # trim the empty margins
ink = Image.new("RGBA", alpha.size, INK + (255,))
ink.putalpha(alpha)


def fit(img, width):
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def on_paper(size, share):
    """Ink logo centred on paper, taking `share` of the shorter side."""
    w, h = size
    box = round(min(w, h) * share)
    logo = ink.copy()
    logo.thumbnail((box, box), Image.LANCZOS)
    out = Image.new("RGBA", size, PAPER + (255,))
    out.alpha_composite(logo, ((w - logo.width) // 2, (h - logo.height) // 2))
    return out


(ROOT / "public/brand").mkdir(parents=True, exist_ok=True)
fit(ink, 640).save(ROOT / "public/brand/astra-ink.webp", quality=90, method=6)
on_paper((512, 512), 0.78).save(ROOT / "app/icon.png", optimize=True)
on_paper((180, 180), 0.72).convert("RGB").save(ROOT / "app/apple-icon.png", optimize=True)
on_paper((48, 48), 0.86).save(ROOT / "app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
on_paper((1200, 630), 0.62).convert("RGB").save(ROOT / "app/opengraph-image.png", optimize=True)
print("design b brand assets written; logo crop", alpha.size, "ink webp", fit(ink, 640).size)
