"""
Design the CharArchive app icon.

The app is a record-keeping archive for character and asset sheets, so the icon
is a bound reference volume standing on a shelf, with a clasp and a ribbon
marker. Colours follow the app's own dark theme: slate background, amber
focal point, emerald accent.

Drawn at 4x and downsampled so the curves stay clean at 16px.
"""
import os
from PIL import Image, ImageDraw

OUT_DIR = r"Z:\Armchiver\App\assets"
PNG = os.path.join(OUT_DIR, "icon_preview.png")
ICO = os.path.join(OUT_DIR, "icon.ico")

S = 1024          # working resolution
F = 4             # supersample factor for the small sizes

# Theme colours
BG_TOP = (30, 41, 59)      # slate-800
BG_BOT = (15, 23, 42)      # slate-900
BOARD = (71, 85, 105)      # slate-600, the shelf edge
BOARD_DK = (51, 65, 85)
LEATHER = (146, 64, 14)    # amber-800 leather
LEATHER_D = (120, 53, 15)
LEATHER_L = (180, 83, 9)
PAGES = (226, 232, 240)    # slate-200 page block
PAGES_D = (148, 163, 184)
GOLD = (245, 158, 11)      # amber-500 clasp
GOLD_D = (202, 138, 4)
RIBBON = (16, 185, 129)    # emerald-500 marker
RIBBON_D = (5, 150, 105)
EMERALD = (52, 211, 153)


def rounded(draw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)


def make_icon(scale=1):
    """Draw one icon at `scale` times the base size."""
    n = S * scale
    u = n / 1024.0                      # one design unit in pixels
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def X(v):
        return v * u

    # ---- Background: rounded app tile, dark slate, subtle vertical fade ----
    bg = Image.new("RGBA", (n, n), BG_BOT + (255,))
    grad = Image.new("L", (n, n))
    gd = ImageDraw.Draw(grad)
    for y in range(n):
        t = y / max(1, n - 1)
        shade = int(255 * (1 - t * 0.55))
        gd.line([(0, y), (n - 1, y)], fill=shade)
    bg.paste(Image.new("RGBA", (n, n), BG_TOP + (255,)), (0, 0), grad)
    mask = Image.new("L", (n, n), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, n - 1, n - 1], radius=int(X(224)), fill=255)
    img.paste(bg, (0, 0), mask)
    d = ImageDraw.Draw(img)

    # ---- Shelf the volume stands on ----
    shelf_y = X(792)
    rounded(d, [X(150), shelf_y, X(874), shelf_y + X(46)], int(X(23)), BOARD)
    rounded(d, [X(150), shelf_y + X(34), X(874), shelf_y + X(46)], int(X(12)), BOARD_DK)

    # ---- The volume: cover, spine, page block ----
    left, right = X(268), X(756)
    top, bottom = X(232), X(792)

    # Page block peeking out on the right, so it reads as a bound volume
    rounded(d, [right - X(30), top + X(26), right + X(34), bottom - X(18)], int(X(16)), PAGES)
    for i in range(7):
        yy = top + X(96 + i * 82)
        d.line([(right - X(26), yy), (right + X(30), yy)], fill=PAGES_D + (255,), width=int(X(7)))

    # Spine
    rounded(d, [left, top, left + X(96), bottom], int(X(26)), LEATHER_D)

    # Front cover
    rounded(d, [left + X(80), top, right, bottom], int(X(22)), LEATHER)

    # Cover sheen: a lighter panel so the face is not flat
    rounded(d, [left + X(140), top + X(48), right - X(54), bottom - X(54)], int(X(18)), LEATHER_L)

    # Gilt rules top and bottom of the cover
    for gy in (top + X(112), bottom - X(112)):
        rounded(d, [left + X(140), gy, right - X(54), gy + X(13)], int(X(6)), GOLD)

    # ---- Clasp: the focal amber detail ----
    clasp_x = right - X(150)
    rounded(d, [clasp_x, top + X(56), clasp_x + X(96), top + X(150)], int(X(20)), GOLD)
    rounded(d, [clasp_x, top + X(86), clasp_x + X(96), top + X(120)], int(X(14)), GOLD_D)
    d.ellipse([clasp_x + X(30), top + X(86), clasp_x + X(66), top + X(122)], fill=BG_BOT + (255,))

    # ---- Ribbon marker hanging from the spine edge ----
    # Placed over the spine rather than across the cover, so it cannot cross
    # the ledger lines or the clasp.
    rib_l, rib_r = left + X(18), left + X(92)
    d.polygon(
        [(rib_l, top + X(10)), (rib_r, top + X(10)), (rib_r, bottom - X(196)), (rib_l, bottom - X(196))],
        fill=RIBBON,
    )
    d.polygon(
        [(rib_l, bottom - X(196)), (rib_r, bottom - X(196)),
         (rib_r - X(18), bottom - X(168)), (rib_l, bottom - X(232))],
        fill=RIBBON_D,
    )
    d.line([(rib_l, top + X(10)), (rib_l, bottom - X(196))], fill=RIBBON_D + (255,), width=int(X(9)))
    d.line([(rib_r, top + X(10)), (rib_r, bottom - X(196))], fill=RIBBON_D + (255,), width=int(X(9)))

    # ---- Ledger lines on the cover panel, so it reads as records ----
    # Kept strictly inside the lighter panel so nothing spills onto the pages.
    panel_l = left + X(140)
    panel_r = right - X(54)
    rib_edge = rib_r + X(18)
    for i in range(4):
        ly = top + X(228 + i * 72)
        line_l = max(panel_l + X(40), rib_edge)
        line_r = panel_r - X(30) - (i * 26 * u if False else i * X(26))
        if line_r - line_l < X(40):
            break
        rounded(d, [line_l, ly, line_r, ly + X(18)], int(X(9)), PAGES)

    return img


def main():
    master = make_icon(1)
    master.resize((512, 512), Image.LANCZOS).save(PNG)
    print(f"preview -> {PNG}")

    # Every size Windows asks for, each rendered at high resolution and
    # downsampled, so small sizes are crisp rather than a shrunken 1024.
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    frames = []
    for px, _ in sizes:
        big = make_icon(max(1, int(round(px / 16))))
        frames.append(big.resize((px, px), Image.LANCZOS))
    frames[max(range(len(sizes)), key=lambda i: sizes[i][0])].save(
        ICO, format="ICO", sizes=sizes, append_images=frames[:-1]
    )
    print(f"icon    -> {ICO}")
    print(f"sizes   -> {sizes}")


if __name__ == "__main__":
    main()