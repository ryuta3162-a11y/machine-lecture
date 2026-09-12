"""
スタッフ角丸ステッカー A4・2×5
- ラミネート後に切りやすい角丸スクエア
- 上帯「今だけ無料」＋指差しキャラ（ジェスチャーが帯を示す）
出力: pop/a4-stickers-2x5.png / pop/sticker-imadake-muryo.png
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"C:\Users\ryuta-kusaka\Documents\GitHub\machine-lecture\pop")
src = ROOT / "staff-bubble.png"
out = ROOT / "a4-stickers-2x5.png"
out_one = ROOT / "sticker-imadake-muryo.png"

PAGE_W, PAGE_H = 2100, 2970
COLS, ROWS = 2, 5
GAP = 36
MARGIN = 48
CUT = "#C8CCD4"
RED = "#A5354B"
NOTO = Path(r"C:\Windows\Fonts\NotoSansJP-VF.ttf")

STICKER_MM = 68.0
STICKER_PX = 680
RADIUS = 56
BAND_H = 112
PAD = 24


def font_px(size, weight=700):
    f = ImageFont.truetype(str(NOTO), max(8, int(size)))
    try:
        f.set_variation_by_axes([float(weight)])
    except Exception:
        try:
            f.set_variation_by_name("Bold")
        except Exception:
            pass
    return f


def flood_clear_background(rgba: Image.Image, thresh=248) -> Image.Image:
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    def is_bg(y, x):
        r, g, b, a = arr[y, x]
        return a > 0 and r >= thresh and g >= thresh and b >= thresh

    seeds = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    for x in range(0, w, 3):
        seeds += [(0, x), (h - 1, x)]
    for y in range(0, h, 3):
        seeds += [(y, 0), (y, w - 1)]
    for y, x in seeds:
        if 0 <= y < h and 0 <= x < w and is_bg(y, x) and not visited[y, x]:
            visited[y, x] = True
            q.append((y, x))

    while q:
        y, x = q.popleft()
        arr[y, x, 3] = 0
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and is_bg(ny, nx):
                visited[ny, nx] = True
                q.append((ny, nx))
    return Image.fromarray(arr)


def trim_alpha(im: Image.Image, pad=2) -> Image.Image:
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        return im
    return im.crop(
        (
            max(0, int(xs.min()) - pad),
            max(0, int(ys.min()) - pad),
            min(im.width, int(xs.max()) + pad + 1),
            min(im.height, int(ys.max()) + pad + 1),
        )
    )


def extract_character(raw: Image.Image) -> Image.Image:
    """旧吹き出しのみ消し、髪を削らないよう範囲を限定"""
    base = raw.convert("RGBA")
    draw = ImageDraw.Draw(base)
    # 吹き出し本体（キャラ頭部より左）
    draw.ellipse([86, 76, 288, 252], fill="#FFFFFF", outline="#FFFFFF")
    # しっぽ（指付近まで。髪・額には触れない）
    draw.polygon([(210, 228), (258, 262), (228, 242)], fill="#FFFFFF")
    # しっぽ付近の黒線残りを薄くカバー
    draw.line([(230, 235), (255, 258)], fill="#FFFFFF", width=8)
    cut = flood_clear_background(base, thresh=248)
    return trim_alpha(cut, pad=2)


def rounded_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def soft_panel(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), "#F7F1F2")
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(248 - 10 * t)
        g = int(242 - 18 * t)
        b = int(243 - 14 * t)
        for x in range(size):
            corner = ((x / size) * (y / size)) * 0.05
            px[x, y] = (
                max(0, int(r - 12 * corner)),
                max(0, int(g - 20 * corner)),
                max(0, int(b - 16 * corner)),
            )
    return img.convert("RGBA")


def fit_text(draw, text, max_w, max_h, weight=750, lo=18, hi=64):
    for px in range(hi, lo - 1, -1):
        f = font_px(px, weight)
        bb = draw.textbbox((0, 0), text, font=f)
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        if tw <= max_w and th <= max_h:
            return f, bb, tw, th
    f = font_px(lo, weight)
    bb = draw.textbbox((0, 0), text, font=f)
    return f, bb, bb[2] - bb[0], bb[3] - bb[1]


def build_sticker(text="今だけ無料") -> Image.Image:
    char = extract_character(Image.open(src))
    size = STICKER_PX
    panel = soft_panel(size)
    draw = ImageDraw.Draw(panel)

    # 上帯
    draw.rectangle([0, 0, size, BAND_H], fill=RED)
    draw.line([(0, BAND_H), (size, BAND_H)], fill="#FFFFFF", width=2)

    f, bb, tw, th = fit_text(draw, text, max_w=size - 64, max_h=BAND_H - 36)
    tx = (size - tw) // 2
    ty = (BAND_H - th) // 2 - bb[1]
    draw.text((tx, ty), text, font=f, fill="#FFFFFF")

    # キャラ背後のソフト楕円（余白を自然に埋める）
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([70, BAND_H + 40, size - 20, size + 40], fill=(165, 53, 75, 28))
    gd.ellipse([120, BAND_H + 90, size - 50, size - 10], fill=(255, 255, 255, 55))
    panel = Image.alpha_composite(panel, glow)

    # 上帯の下にキャラ（指が上帯方向を指す）
    area_top = BAND_H + 2
    area_bottom = size - 8
    area_h = area_bottom - area_top
    area_w = size - PAD * 2

    scale = min(area_w / char.width, area_h / char.height) * 1.12
    cw = max(1, int(char.width * scale))
    ch = max(1, int(char.height * scale))
    char_r = char.resize((cw, ch), Image.Resampling.LANCZOS)

    cx = (size - cw) // 2 + 28
    cy = area_bottom - ch + 8
    panel.paste(char_r, (cx, cy), char_r)

    # 外枠
    border = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle([2, 2, size - 3, size - 3], radius=RADIUS, outline=RED, width=5)
    panel = Image.alpha_composite(panel, border)

    mask = rounded_mask(size, RADIUS)
    out_im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out_im.paste(panel, (0, 0))
    out_im.putalpha(mask)
    return out_im


def draw_cut_guide(draw, x, y, w, h, r):
    draw.rounded_rectangle([x, y, x + w - 1, y + h - 1], radius=r, outline=CUT, width=1)
    mark = 12
    for cx, cy, dx, dy in (
        (x, y, 1, 1),
        (x + w, y, -1, 1),
        (x, y + h, 1, -1),
        (x + w, y + h, -1, -1),
    ):
        draw.line([(cx + dx * 2, cy - dy * 8), (cx + dx * 2, cy + dy * mark)], fill=CUT, width=1)
        draw.line([(cx - dx * 8, cy + dy * 2), (cx + dx * mark, cy + dy * 2)], fill=CUT, width=1)


def main():
    sticker = build_sticker()
    sticker.save(out_one, "PNG")

    max_cell_w = (PAGE_W - MARGIN * 2 - GAP * (COLS - 1)) // COLS
    max_cell_h = (PAGE_H - MARGIN * 2 - GAP * (ROWS - 1)) // ROWS
    lim = int(STICKER_MM * 10)
    cell = min(max_cell_w, max_cell_h, lim)

    scale = cell / sticker.width
    tw = th = max(1, int(sticker.width * scale))
    tile = sticker.resize((tw, th), Image.Resampling.LANCZOS)
    guide_r = max(8, int(RADIUS * scale))

    grid_w = COLS * cell + (COLS - 1) * GAP
    grid_h = ROWS * cell + (ROWS - 1) * GAP
    ox = (PAGE_W - grid_w) // 2
    oy = (PAGE_H - grid_h) // 2

    page = Image.new("RGB", (PAGE_W, PAGE_H), "#FFFFFF")
    draw = ImageDraw.Draw(page)

    for r in range(ROWS):
        for c in range(COLS):
            cx = ox + c * (cell + GAP)
            cy = oy + r * (cell + GAP)
            px = cx + (cell - tw) // 2
            py = cy + (cell - th) // 2
            page.paste(tile, (px, py), tile)
            draw_cut_guide(draw, px, py, tw, th, guide_r)

    page.save(out, "PNG")
    print(f"one -> {out_one} {sticker.size}")
    print(f"tile ~{tw/10:.1f}x{th/10:.1f}mm")
    print(f"sheet 2x5 -> {out}")


if __name__ == "__main__":
    main()
