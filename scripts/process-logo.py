#!/usr/bin/env python3
"""Logo, favicons and Open Graph image.

    source-images/brand/logo.png
      -> scripts/output/logo/logo-4x.png       (Real-ESRGAN anime model, good for line art)
      -> scripts/output/logo/logo-trace.svg     (vtracer colour trace, for review)
      -> public/brand/logo-mark.png             (512 px, circular, used in header/footer)
      -> src/app/icon.png, apple-icon.png, favicon.ico
      -> src/app/opengraph-image.png            (1200 x 630, logo on the brand palette)

The traced SVG is written for review but not used on the site: the logo's
gradient lettering and fine line-art trace into a rough, heavy file, so the
site uses the 4x PNG (allowed by the brief when tracing looks rough).
"""
from pathlib import Path
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import esrgan_cpu  # noqa: E402

OUT = ROOT / "scripts/output/logo"
OUT.mkdir(parents=True, exist_ok=True)

src = Image.open(ROOT / "source-images/brand/logo.png").convert("RGBA")
w, h = src.size

# 1. upscale 4x (RGB through ESRGAN, alpha with Lanczos)
esrgan_cpu.MODEL = "realesrgan-x4plus-anime"
rgb = np.array(src.convert("RGB"))
up = esrgan_cpu.upscale(rgb)
alpha = src.getchannel("A").resize((w * 4, h * 4), Image.LANCZOS)
big = Image.fromarray(up).convert("RGBA")
big.putalpha(alpha)
big.save(OUT / "logo-4x.png")

# circular mask (the logo is a round badge; clean its edge)
S = big.size[0]
mask = Image.new("L", (S * 2, S * 2), 0)
ImageDraw.Draw(mask).ellipse((4, 4, S * 2 - 4, S * 2 - 4), fill=255)
mask = mask.resize((S, S), Image.LANCZOS)
badge = big.copy()
badge.putalpha(Image.fromarray(np.minimum(np.array(mask), np.array(big.getchannel("A")))))

pub = ROOT / "public/brand"
pub.mkdir(parents=True, exist_ok=True)
badge.resize((512, 512), Image.LANCZOS).save(pub / "logo-mark.png", optimize=True)

# 2. trace for review
try:
    import vtracer

    vtracer.convert_image_to_svg_py(
        str(OUT / "logo-4x.png"), str(OUT / "logo-trace.svg"),
        colormode="color", hierarchical="stacked", mode="spline",
        filter_speckle=6, color_precision=7, layer_difference=12,
        corner_threshold=60, length_threshold=4.0, splice_threshold=45, path_precision=3,
    )
except Exception as e:  # noqa: BLE001
    print("trace skipped:", e)

# 3. favicons
app = ROOT / "src/app"
icon = badge.resize((512, 512), Image.LANCZOS)
icon.save(app / "icon.png", optimize=True)
apple = Image.new("RGBA", (180, 180), (251, 245, 234, 255))
apple.alpha_composite(badge.resize((180, 180), Image.LANCZOS))
apple.convert("RGB").save(app / "apple-icon.png", optimize=True)
badge.resize((256, 256), Image.LANCZOS).save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

# 4. Open Graph image: logo on deep maroon between gamosa borders, tagline in the display face
W, H = 1200, 630
MAROON, GAMOSA, GOLD, IVORY = (94, 20, 20), (163, 22, 30), (226, 181, 79), (251, 245, 234)
og = Image.new("RGB", (W, H), MAROON)
d = ImageDraw.Draw(og)


def band(y, hgt=30):
    """A gamosa border: ivory diamonds with a red core and muga-gold heart on red, with pinstripes."""
    d.rectangle((0, y, W, y + hgt), fill=GAMOSA)
    d.line((0, y + 2, W, y + 2), fill=IVORY, width=2)
    d.line((0, y + hgt - 2, W, y + hgt - 2), fill=IVORY, width=2)
    step = hgt * 2
    for x in range(-step, W + step, step):
        cx, cy = x + step / 2, y + hgt / 2
        for r, fill in ((hgt * 0.36, IVORY), (hgt * 0.2, GAMOSA), (hgt * 0.09, GOLD)):
            d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=fill)
        r3 = hgt * 0.16
        d.polygon([(x, cy - r3), (x + r3, cy), (x, cy + r3), (x - r3, cy)], fill=GOLD)


band(36)
band(H - 66)
L = 400
og.paste(badge.resize((L, L), Image.LANCZOS), (90, (H - L) // 2), badge.resize((L, L), Image.LANCZOS))
font_path = ROOT / "scripts/fonts/YoungSerif-Regular.ttf"
body_path = ROOT / "scripts/fonts/Mukta-Regular.ttf"
try:
    f1 = ImageFont.truetype(str(font_path), 64)
    f2 = ImageFont.truetype(str(body_path), 34)
except OSError:
    f1 = f2 = ImageFont.load_default()
d.text((560, 210), "ND Attire", font=f1, fill=IVORY)
d.text((560, 300), "Handpainted mekhela sador", font=f2, fill=(235, 194, 122))
d.text((560, 345), "and bridal dupattas", font=f2, fill=(235, 194, 122))
d.text((560, 410), "Order on WhatsApp", font=f2, fill=GOLD)
og.save(app / "opengraph-image.png", optimize=True)
print("logo, icons and OG image written")
