"""
Builds every logo file the site uses from ONE source image:
public/brand/astra-logo-white.png (white logo, transparent background).

Run after replacing the source logo:  python scripts/make-brand.py
Needs Pillow (pip install pillow). Outputs:
  public/brand/astra-mark.webp     cropped logo, 512px wide (nav mark, comet)
  public/brand/astra-logo-1024.png cropped logo, 1024px wide (finale dot sampling, static mode)
  public/brand/astra-iris.png      soft logo mask for the star-iris transition (shader)
  app/icon.png, app/apple-icon.png, app/favicon.ico   white logo on the theme black
  app/opengraph-image.png          1200x630 share image placeholder
"""
from pathlib import Path
from PIL import Image, ImageFilter

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


def iris(width, margin=0.18, blur=0.012, close=0.11):
    """The star-iris mask, with an empty margin (white = logo):
    red   = the logo silhouette, softly blurred (the shader cuts it at 0.5, so the
            blur acts like a distance field: crisp edge at any scale)
    green = the same silhouette thickened until its inner gaps close (dilated,
            then blurred). Late in the transition the shader blends red -> green,
            so the gaps close organically as the star swells."""
    l = fit(logo, round(width * (1 - 2 * margin)))
    pad_x = (width - l.width) // 2
    h = round(l.height / (1 - 2 * margin))
    alpha = Image.new("L", (width, h), 0)
    alpha.paste(l.getchannel("A"), (pad_x, (h - l.height) // 2))
    soft = alpha.filter(ImageFilter.GaussianBlur(width * blur))
    size = int(width * close) | 1  # odd filter size
    closed = alpha.filter(ImageFilter.MaxFilter(size)).filter(ImageFilter.GaussianBlur(width * close / 3))
    return Image.merge("RGB", (soft, closed, Image.new("L", (width, h), 0)))


fit(logo, 512).save(ROOT / "public/brand/astra-mark.webp", quality=90, method=6)
iris(384).save(ROOT / "public/brand/astra-iris.png", optimize=True)
fit(logo, 1024).save(ROOT / "public/brand/astra-logo-1024.png", optimize=True)
on_black((512, 512), 0.78).save(ROOT / "app/icon.png", optimize=True)
on_black((180, 180), 0.72).convert("RGB").save(ROOT / "app/apple-icon.png", optimize=True)
on_black((48, 48), 0.86).save(ROOT / "app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
on_black((1200, 630), 0.62).convert("RGB").save(ROOT / "app/opengraph-image.png", optimize=True)
print("brand assets written; logo crop", logo.size)
