"""
Generate the PWA icon set from the master application icon.

vite-plugin-pwa warns about missing icons and the web manifest ends up with
dead entries. This renders the same artwork as icon.png at the sizes the
manifest declares, so the browser-installable version and the Windows .exe
stay visually consistent.

Usage:
    python assets\\make_pwa_icons.py
"""
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
MASTER = os.path.join(ASSETS, "icon.png")
PUBLIC = os.path.join(ROOT, "public")

# Sizes referenced by vite.config.ts and index.html.
TARGETS = {
    "pwa-192x192.png": 192,
    "pwa-512x512.png": 512,
    "apple-touch-icon.png": 180,
    "favicon.ico": 32,
}


def main():
    if not os.path.exists(MASTER):
        print(f"Master icon missing: {MASTER}")
        print("Run assets\\make_icon.py first.")
        return 1

    master = Image.open(MASTER).convert("RGBA")
    os.makedirs(PUBLIC, exist_ok=True)

    for name, size in TARGETS.items():
        out = os.path.join(PUBLIC, name)
        if name.endswith(".ico"):
            # A multi-size favicon, matching what browsers actually pick from.
            resized = master.resize((size, size), Image.LANCZOS)
            resized.save(
                out,
                sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
            )
        else:
            master.resize((size, size), Image.LANCZOS).save(out)
        print(f"  wrote public/{name} ({size}x{size})")

    print(f"\nGenerated {len(TARGETS)} files in public/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())