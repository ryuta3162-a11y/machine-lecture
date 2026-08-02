from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

qr_path = Path(r"C:\Users\ryuta-kusaka\Documents\GitHub\machine-lecture\pop\qr.png")
out = Path(r"C:\Users\ryuta-kusaka\Documents\GitHub\machine-lecture\pop\a4-poster-2100x2970.png")

# 3x render → LANCZOS downscale for smooth diagonals
SCALE = 3
W, H = 2100 * SCALE, 2970 * SCALE
RED = "#C21642"
INK = "#141414"
GRAY = "#8E95A1"

canvas = Image.new("RGB", (W, H), "#FFFFFF")
draw = ImageDraw.Draw(canvas)


def font(size):
    size = int(size * SCALE)
    for p in ["C:/Windows/Fonts/meiryob.ttc", "C:/Windows/Fonts/msgothic.ttc"]:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


def s(v):
    return int(round(v * SCALE))


def hline(x0, x1, y, width, fill):
    half = width // 2
    draw.rectangle([min(x0, x1), y - half, max(x0, x1), y - half + width], fill=fill)


def corner(x0, y0, flip_x=False, flip_y=False, size=None):
    """
    Nested right triangles flush to the page corner.
    Red tip + gray outer rim — no gaps, no line intersections.
    """
    size = size if size is not None else s(300)
    ratio = 0.70
    over = s(4)

    def pt(x, y):
        return (x0 + (-x if flip_x else x), y0 + (-y if flip_y else y))

    def tri(w):
        return [pt(-over, -over), pt(w, -over), pt(-over, int(w * ratio))]

    draw.polygon(tri(size), fill=GRAY)
    draw.polygon(tri(int(size * 0.62)), fill=RED)


def center_text(text, y, fnt, fill):
    bb = draw.textbbox((0, 0), text, font=fnt)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    draw.text(((W - tw) // 2, y - bb[1]), text, font=fnt, fill=fill)
    return y + th


def fit_font(text, max_size, max_w, min_size=52):
    for size in range(max_size, min_size - 1, -1):
        f = font(size)
        bb = draw.textbbox((0, 0), text, font=f)
        if bb[2] - bb[0] <= max_w:
            return f, bb
    f = font(min_size)
    return f, draw.textbbox((0, 0), text, font=f)


band = s(280)

# Header — clearer blocks: brand / hero / support
y = s(130)
y = center_text("JOY FIT 24", y, font(148), RED) + s(88)

f_kyodo = font(68)
kyodo = "KYODO"
bb = draw.textbbox((0, 0), kyodo, font=f_kyodo)
tw, th = bb[2] - bb[0], bb[3] - bb[1]
kx = (W - tw) // 2
mid_y = y - bb[1] + th // 2
gap = s(28)
arm = s(280)
hline(kx - arm, kx - gap, mid_y, s(6), RED)
hline(kx + tw + gap, kx + tw + arm, mid_y, s(6), RED)
draw.text((kx, y - bb[1]), kyodo, font=f_kyodo, fill=RED)
# Brand block → hero offer
y += th + s(140)

# Hero pair, then supporting line (おすすめ size kept)
y = center_text("20分無料", y, font(220), RED) + s(100)
y = center_text("マシンレクチャー", y, font(200), INK) + s(100)
y = center_text("初心者の方へおすすめ！", y, font(94), RED) + s(72)

hline(s(520), W - s(520), y, s(6), RED)
y += s(40)

# Footer
line1 = "マシンの使い方をスタッフが丁寧に説明いたします。"
line2 = "※フリーウェイトエリアのマシンご案内はできません。"
pad_x = s(70)
max_w = W - pad_x * 2
f1, bb1 = fit_font(line1, 96, max_w)
f2, bb2 = fit_font(line2, 86, max_w)
tw1, th1 = bb1[2] - bb1[0], bb1[3] - bb1[1]
tw2, th2 = bb2[2] - bb2[0], bb2[3] - bb2[1]
gap_f = s(36)
block_h = th1 + gap_f + th2
footer_y = H - s(90) - block_h - int(band * 0.70)

# Footer divider stays clear of corner bands
footer_line_inset = int(band * 1.05)
hline(footer_line_inset, W - footer_line_inset, footer_y - s(48), s(5), RED)
draw.text(((W - tw1) // 2, footer_y - bb1[1]), line1, font=f1, fill=INK)
draw.text(((W - tw2) // 2, footer_y + th1 + gap_f - bb2[1]), line2, font=f2, fill=INK)

# QR — single clean frame
qr_size = s(700)
pad = s(24)
border = s(16)
total = qr_size + pad * 2 + border * 2
by = y + max(s(10), (footer_y - s(70) - y - total) // 2)
bx = (W - total) // 2
L, T = bx, by
R, B = bx + total, by + total

draw.rectangle([L, T, R, B], fill=RED)
draw.rectangle([L + border, T + border, R - border, B - border], fill="#FFFFFF")
qr = Image.open(qr_path).convert("RGB").resize((qr_size, qr_size), Image.Resampling.LANCZOS)
canvas.paste(qr, (L + border + pad, T + border + pad))

# Corners last so no divider / text cuts through them
corner(0, 0, size=band)
corner(W, 0, flip_x=True, size=band)
corner(0, H, flip_y=True, size=band)
corner(W, H, flip_x=True, flip_y=True, size=band)

final = canvas.resize((2100, 2970), Image.Resampling.LANCZOS)
final.save(out, "PNG")
print("clean nested corners", out)
