"""
Generates the CharArchive application icon.

The mark is an archive box with a character head on its label: it reads as
"character archive" at a glance and stays legible down to 16px in the taskbar.

Outputs:
    assets/icon.png   256x256 master
    assets/icon.ico   multi-resolution Windows icon
"""
from PIL import Image, ImageDraw
import os

SS = 8            # supersample factor for clean edges
S = 256# final size
C = S * SS

TOP = (44, 52, 88)     # deep indigo, matches the app's dark UI
BOT = (12, 14, 22)     # near-black
BOX = (233, 238, 248)  # off-white box body
LID = (150, 200, 255)  # light blue lid
DARK = (28, 34, 58)    # dark plate / handle


def rounded_mask(w, h, radius):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    return m


def vertical_gradient(w, h, top, bot):
    """Explicit RGBA so the result is opaque; a 3-tuple can come out transparent."""
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


def build():
    radius = int(C * 0.22)
    mask = rounded_mask(C, C, radius)

    # 1. Dark gradient plate, clipped to the rounded square.
    img = Image.new("RGBA", (C, C), (0, 0, 0, 255))
    grad = vertical_gradient(C, C, TOP, BOT)
    img.paste(grad, (0, 0), mask)

    # 2. Soft top highlight, alpha-blended (not pasted, so it blends).
    hl = Image.new("RGBA", (C, C), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse(
        [-int(C * 0.35), -int(C * 0.75), int(C * 1.35), int(C * 0.60)],
        fill=(255, 255, 255, 26),
    )
    img = Image.alpha_composite(img, hl)

    d = ImageDraw.Draw(img)

    # 3. Archive box body.
    d.rounded_rectangle(
        [int(C * 0.20), int(C * 0.36), int(C * 0.80), int(C * 0.83)],
        radius=int(C * 0.055), fill=BOX + (255,),
    )

    # 4. Lid, a little wider than the body.
    d.rounded_rectangle(
        [int(C * 0.155), int(C * 0.255), int(C * 0.845), int(C * 0.375)],
        radius=int(C * 0.045), fill=LID + (255,),
    )

    # 5. Handle slot in the lid.
    d.rounded_rectangle(
        [int(C * 0.42), int(C * 0.292), int(C * 0.58), int(C * 0.328)],
        radius=int(C * 0.012), fill=DARK + (255,),
    )

    # 6. Label plate on the front of the box.
    px0, py0 = int(C * 0.30), int(C * 0.485)
    px1, py1 = int(C * 0.70), int(C * 0.685)
    d.rounded_rectangle(
        [px0, py0, px1, py1], radius=int(C * 0.022), fill=DARK + (255,)
    )

    # 7. Character head + shoulders on the label.
    cx = (px0 + px1) // 2
    hy = int(C * 0.575)
    r = int(C * 0.047)
    d.ellipse([cx - r, hy - r, cx + r, hy + r], fill=BOX + (255,))

    sw, sy = int(C * 0.090), hy + r - int(C * 0.004)
    d.pieslice([cx - sw, sy, cx + sw, sy + int(C * 0.115)],
               start=180, end=360, fill=BOX + (255,))

    return img.resize((S, S), Image.LANCZOS)


def main():
    icon = build()

    # Fail loudly if the plate is not actually opaque dark, so a broken build
    # never silently ships a white or transparent icon again. The top of the
    # plate is lightened by the highlight, so check a lower band that is not.
    probe = icon.convert("RGBA")
    top = probe.getpixel((128, 20))
    lower = probe.getpixel((128, 240))
    assert top[3] == 255, f"top is not opaque: {top}"
    assert all(c <= 140 for c in top[:3]), f"top is not dark: {top}"
    assert all(c <= 80 for c in lower[:3]), f"lower plate is not dark: {lower}"

    os.makedirs("assets", exist_ok=True)
    icon.save("assets/icon.png")
    icon.save(
        "assets/icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("wrote assets/icon.png and assets/icon.ico")
    print("plate check  top:", top, " lower:", lower)


if __name__ == "__main__":
    main()
