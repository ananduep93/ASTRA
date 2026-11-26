"""
Builds every logo file the site uses from ONE source image:
public/brand/astra-logo-white.png (white logo, transparent background).

Run after replacing the source logo:  python scripts/make-brand.py
Needs Pillow (pip install pillow). Outputs:
  public/brand/astra-mark.webp     cropped logo, 512px wide (nav mark, comet)
  public/brand/astra-logo-1024.png cropped logo, 1024px wide (finale dot sampling, static mode)
  app/icon.png, app/apple-icon.png, app/favicon.ico   white logo on the theme black
  app/opengraph-image.png          1200x630 share image placeholder
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BLACK = (10, 10, 10, 255)  # #0A0A0A, same as lib/theme.js

src = Image.open(ROOT / "public/brand/astra-logo-white.png").convert("RGBA")
logo = src.crop(src.getchannel("A").getbbox())  # trim the empty margins


def fit(img, width):
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def on_black(size, logo_share):
    """Logo centred on a black canvas, taking `logo_share` of the shorter side."""
    w, h = size
    box = round(min(w, h) * logo_share)
    l = logo.copy()
    l.thumbnail((box, box), Image.LANCZOS)
    out = Image.new("RGBA", size, BLACK)
    out.alpha_composite(l, ((w - l.width) // 2, (h - l.height) // 2))
    return out


fit(logo, 512).save(ROOT / "public/brand/astra-mark.webp", quality=90, method=6)
fit(logo, 1024).save(ROOT / "public/brand/astra-logo-1024.png", optimize=True)
on_black((512, 512), 0.78).save(ROOT / "app/icon.png", optimize=True)
on_black((180, 180), 0.72).convert("RGB").save(ROOT / "app/apple-icon.png", optimize=True)
on_black((48, 48), 0.86).save(ROOT / "app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
on_black((1200, 630), 0.62).convert("RGB").save(ROOT / "app/opengraph-image.png", optimize=True)
print("brand assets written; logo crop", logo.size)
