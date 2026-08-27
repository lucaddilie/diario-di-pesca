"""One-off script to generate simple PWA icons (fish on solid background).
Run manually if icons need to be regenerated: python3 scripts/generate-icons.py
"""
from PIL import Image, ImageDraw

BG_COLOR = (13, 71, 89)  # dark teal, evokes water
FISH_COLOR = (240, 248, 250)  # near-white

def draw_fish(draw: ImageDraw.ImageDraw, size: int, scale: float = 1.0):
    cx, cy = size / 2, size / 2
    body_w = size * 0.5 * scale
    body_h = size * 0.28 * scale

    # body (ellipse)
    draw.ellipse(
        [cx - body_w / 2, cy - body_h / 2, cx + body_w / 2, cy + body_h / 2],
        fill=FISH_COLOR,
    )

    # tail (triangle) pointing right
    tail_x = cx + body_w / 2
    tail_size = body_h * 1.1
    draw.polygon(
        [
            (tail_x - size * 0.02, cy),
            (tail_x + tail_size, cy - tail_size * 0.65),
            (tail_x + tail_size, cy + tail_size * 0.65),
        ],
        fill=FISH_COLOR,
    )

    # eye
    eye_r = size * 0.025 * scale
    eye_x = cx - body_w * 0.28
    eye_y = cy - body_h * 0.12
    draw.ellipse(
        [eye_x - eye_r, eye_y - eye_r, eye_x + eye_r, eye_y + eye_r],
        fill=BG_COLOR,
    )


def make_icon(path: str, size: int, maskable: bool = False):
    img = Image.new("RGB", (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)
    # maskable icons need extra safe-zone padding (fish drawn smaller)
    scale = 0.72 if maskable else 1.0
    draw_fish(draw, size, scale)
    img.save(path, "PNG")


if __name__ == "__main__":
    make_icon("public/icons/icon-192.png", 192)
    make_icon("public/icons/icon-512.png", 512)
    make_icon("public/icons/icon-maskable-512.png", 512, maskable=True)
    make_icon("public/icons/apple-touch-icon.png", 180)
    print("Icons generated in public/icons/")
