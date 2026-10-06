"""
Generate the CharArchive application icon.

The mark is the studio's wooden-mannequin mascot, Artie, set into a circular
portrait on the app's dark plate. The face is lifted from the artwork the app
already ships rather than redrawn, so the icon and the mascot never drift apart.

Outputs:
    assets/icon.png      256x256 master
    assets/icon.ico      seven standard Windows resolutions
    public/*             PWA icon set (see make_pwa_icons.py)

Usage:
    python assets\\make_icon.py
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASCOT = os.path.join(ROOT, "src", "assets", "images", "wooden_dummy_1786259892970.jpg")

SS = 4                      # supersample factor
S = 256                    # final icon size
C = S * SS

TOP = (44, 52, 88)         # deep indigo plate, matches the app's dark UI
BOT = (12, 14, 22)
RING = (150, 200, 255)     # light blue ring around the portrait

# Square crop around the mascot's head in the 1024x1024 source, in source
# pixels. Centred on the face (about 507, 283) so the beret is not clipped and
# the pale paper background does not dominate the circle.
CROP = (292, 56, 740, 504)


def rounded_mask(w, h, radius):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    return m


def vertical_gradient(w, h, top, bot):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    span = max(1, h - 1)
    for y in range(h):
        t = y / span
        draw.line(
            [(0, y), (w, y)],
            fill=(
                int(top[0] + (bot[0] - top[0]) * t),
                int(top[1] + (bot[1] - top[1]) * t),
                int(top[2] + (bot[2] - top[2]) * t),
                255,
            ),
        )
    return img


def mascot_portrait(diameter):
    """Circular crop of the mascot's head, sized to fill the ring."""
    if not os.path.exists(MASCOT):
        raise SystemExit(
            f"Mascot artwork not found:\n  {MASCOT}\n"
            "The icon is generated from this file, so it must be present."
        )

    src = Image.open(MASCOT).convert("RGB")
    side = CROP[2] - CROP[0]
    if side != CROP[3] - CROP[1]:
        raise SystemExit("CROP must be square so the portrait is not stretched")
    head = src.crop(CROP).resize((diameter, diameter), Image.LANCZOS)

    # Circular mask, then feather the edge very slightly so it does not look
    # harshly cut out at small sizes.
    mask = Image.new("L", (diameter, diameter), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, diameter - 1, diameter - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(diameter * 0.004))

    portrait = Image.new("RGBA", (diameter, diameter), (0, 0, 0, 0))
    portrait.paste(head.convert("RGBA"), (0, 0), mask)
    return portrait


def build():
    radius = int(C * 0.22)
    plate = Image.new("RGBA", (C, C), (0, 0, 0, 255))
    plate.paste(vertical_gradient(C, C, TOP, BOT), (0, 0), rounded_mask(C, C, radius))

    # Soft highlight across the top of the plate.
    hl = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse(
        [-int(C * 0.35), -int(C * 0.80), int(C * 1.35), int(C * 0.55)],
        fill=(255, 255, 255, 22),
    )
    plate = Image.alpha_composite(plate, hl)
    d = ImageDraw.Draw(plate)

    # Portrait, inset so the ring reads clearly around it.
    dia = int(C * 0.70)
    pad = (C - dia) // 2
    ring_w = max(2, int(C * 0.030))

    d.ellipse(
        [pad - ring_w, pad - ring_w, pad + dia + ring_w, pad + dia + ring_w],
        fill=RING + (255,),
    )
    plate.paste(mascot_portrait(dia), (pad, pad), mascot_portrait(dia))

    return plate.resize((S, S), Image.LANCZOS)


def main():
    icon = build()

    # Fail loudly rather than shipping a blank or white icon.
    probe = icon.convert("RGBA")
    corner = probe.getpixel((128, 12))
    centre = probe.getpixel((128, 128))
    assert corner[3] == 255 and all(c <= 140 for c in corner[:3]), f"plate is wrong: {corner}"
    assert sum(centre[:3]) > 150, f"portrait looks empty: {centre}"

    icon.save(os.path.join(ROOT, "assets", "icon.png"))
    icon.save(
        os.path.join(ROOT, "assets", "icon.ico"),
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("wrote assets/icon.png and assets/icon.ico")
    print(f"plate check {corner} | portrait check {centre}")


if __name__ == "__main__":
    main()