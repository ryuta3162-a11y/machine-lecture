"""
名刺サイズ（横型）A4面付け
- 規定ロゴ色 #A5354B
- 規定ロゴ画像をヘッダーに使用
- 文字を大きく・行間は保つ
出力: pop/a4-cards-4x2.png
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(r"C:\Users\ryuta-kusaka\Documents\GitHub\machine-lecture\pop")
qr_path = ROOT / "qr.png"
logo_path = ROOT / "joyfit-logo.png"
out = ROOT / "a4-cards-4x2.png"

PAGE_W, PAGE_H = 2100, 2970
COLS, ROWS = 2, 4
GAP = 22
CUT = "#D0D3DA"

# 規定ロゴから抽出したブランドレッド
RED = "#A5354B"
RED_DEEP = "#8C2A3D"
INK = "#141414"
MUTED = "#5A5A5A"
GRAY = "#9AA0AA"
WHITE = "#FFFFFF"
OFF = "#F5F5F7"

MEISHI_W_MM, MEISHI_H_MM = 91.0, 55.0
max_card_w = (PAGE_W - GAP * (COLS + 1)) // COLS
max_card_h = (PAGE_H - GAP * (ROWS + 1)) // ROWS
scale_fit = min(max_card_w / MEISHI_W_MM, max_card_h / MEISHI_H_MM)
CARD_W = int(MEISHI_W_MM * scale_fit)
CARD_H = int(MEISHI_H_MM * scale_fit)

GRID_W = COLS * CARD_W + (COLS - 1) * GAP
GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP
ORIGIN_X = (PAGE_W - GRID_W) // 2
ORIGIN_Y = (PAGE_H - GRID_H) // 2

SCALE = 3
CW, CH = CARD_W * SCALE, CARD_H * SCALE
PT = 3.53
NOTO = Path(r"C:\Windows\Fonts\NotoSansJP-VF.ttf")


def font(pt, weight=700):
    size = max(8, int(round(pt * PT * SCALE)))
    for path in [NOTO, Path(r"C:\Windows\Fonts\meiryob.ttc"), Path(r"C:\Windows\Fonts\msgothic.ttc")]:
        if not path.exists():
            continue
        try:
            f = ImageFont.truetype(str(path), size)
            if "vf" in path.name.lower():
                try:
                    f.set_variation_by_axes([float(weight)])
                except Exception:
                    try:
                        f.set_variation_by_name("Bold")
                    except Exception:
                        pass
            return f
        except Exception:
            continue
    return ImageFont.load_default()


def s(v):
    return int(round(v * SCALE))


def build_card():
    card = Image.new("RGB", (CW, CH), WHITE)
    draw = ImageDraw.Draw(card)

    def measure(text, fnt):
        bb = draw.textbbox((0, 0), text, font=fnt)
        return bb[2] - bb[0], bb[3] - bb[1], bb

    def fit(text, pt, max_w, weight=700, min_pt=8):
        for p in range(int(pt), int(min_pt) - 1, -1):
            f = font(p, weight)
            tw, th, bb = measure(text, f)
            if tw <= max_w:
                return f, tw, th, bb
        f = font(min_pt, weight)
        tw, th, bb = measure(text, f)
        return f, tw, th, bb

    # ===== 右パネル =====
    split = int(CW * 0.64)
    draw.rectangle([split, 0, CW, CH], fill=OFF)

    # ===== ヘッダー帯（規定色）+ 規定ロゴ（文字の視覚中央） =====
    band_h = s(62)
    draw.rectangle([0, 0, CW, band_h], fill=RED)
    draw.rectangle([0, band_h, CW, band_h + s(2)], fill=RED_DEEP)

    logo = Image.open(logo_path).convert("RGBA")
    # ロゴ内の白文字バウンディングでトリム → 見た目中央に
    arr = logo.convert("RGB")
    px = arr.load()
    w0, h0 = logo.size
    min_x, min_y, max_x, max_y = w0, h0, 0, 0
    for yy in range(h0):
        for xx in range(w0):
            r, g, b = px[xx, yy]
            if r > 200 and g > 200 and b > 200:
                if xx < min_x:
                    min_x = xx
                if yy < min_y:
                    min_y = yy
                if xx > max_x:
                    max_x = xx
                if yy > max_y:
                    max_y = yy
    pad = 8
    crop = logo.crop(
        (
            max(0, min_x - pad),
            max(0, min_y - pad),
            min(w0, max_x + pad + 1),
            min(h0, max_y + pad + 1),
        )
    )
    max_logo_w = CW - s(80)
    max_logo_h = band_h - s(16)
    ratio = min(max_logo_w / crop.width, max_logo_h / crop.height)
    target_w = max(1, int(crop.width * ratio))
    target_h = max(1, int(crop.height * ratio))
    logo_r = crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
    lx = (CW - target_w) // 2
    ly = (band_h - target_h) // 2
    card.paste(logo_r, (lx, ly), logo_r)

    # 左下アクセント（控えめ）
    draw.polygon([(0, CH), (s(56), CH), (0, CH - s(38))], fill=GRAY)
    draw.polygon([(0, CH), (s(34), CH), (0, CH - s(24))], fill=RED)

    # ===== 左テキスト（大きく・上下を使い切る） =====
    left_x = s(16)
    left_w = split - left_x - s(8)
    top = band_h + s(10)
    bottom = CH - s(14)
    avail = bottom - top

    f_hero, tw_hero, th_hero, bb_hero = fit("20分無料", 28, left_w, weight=900)
    f_title, _, th_title, bb_title = fit("マシンレクチャー", 20, left_w, weight=900)
    f_sub, _, th_sub, bb_sub = fit("初心者の方へおすすめ！", 14, left_w, weight=700)
    f_master, tw_master, th_master, bb_master = fit("15台のマシンを全てマスターしよう", 12, left_w, weight=700)
    f_n1, _, th_n1, bb_n1 = fit("スタッフが丁寧に使い方をご案内", 10, left_w, weight=700)
    f_n2, _, th_n2, bb_n2 = fit("※FWエリアはご案内不可", 8, left_w, weight=700)

    badge_pad_y = s(8)
    badge_pad_x = s(12)

    # 基本行間 → 余りを配分して上下の空きを埋める
    gaps = [s(12), s(14), s(12), s(16), s(6)]  # hero→title→sub→master→n1→n2
    block = (
        th_hero
        + badge_pad_y * 2
        + th_title
        + th_sub
        + th_master
        + th_n1
        + th_n2
        + sum(gaps)
    )
    leftover = max(0, avail - block)
    bump = leftover // (len(gaps) + 2)
    top += bump
    gaps = [g + bump for g in gaps]

    y = top

    # 20分無料（規定赤のバッジ・白文字）
    draw.rectangle(
        [
            left_x - badge_pad_x,
            y - badge_pad_y,
            left_x + tw_hero + badge_pad_x,
            y + th_hero + badge_pad_y,
        ],
        fill=RED,
    )
    draw.text((left_x, y - bb_hero[1]), "20分無料", font=f_hero, fill=WHITE)
    y += th_hero + badge_pad_y + gaps[0]

    draw.text((left_x, y - bb_title[1]), "マシンレクチャー", font=f_title, fill=INK)
    y += th_title + gaps[1]

    draw.text((left_x, y - bb_sub[1]), "初心者の方へおすすめ！", font=f_sub, fill=RED)
    y += th_sub + gaps[2]

    # 15台…：赤プレート＋白文字（縁取りなしで上品に）
    plate_pad_x = s(8)
    plate_pad_y = s(5)
    draw.rectangle(
        [
            left_x - plate_pad_x,
            y - plate_pad_y,
            left_x + tw_master + plate_pad_x,
            y + th_master + plate_pad_y,
        ],
        fill=RED,
    )
    draw.text((left_x, y - bb_master[1]), "15台のマシンを全てマスターしよう", font=f_master, fill=WHITE)
    y += th_master + plate_pad_y + gaps[3]

    draw.text((left_x, y - bb_n1[1]), "スタッフが丁寧に使い方をご案内", font=f_n1, fill=MUTED)
    y += th_n1 + gaps[4]
    draw.text((left_x, y - bb_n2[1]), "※FWエリアはご案内不可", font=f_n2, fill="#A0A0A0")

    # ===== 右 QR（上下中央揃え：申請文言 → QR → SCAN） =====
    f_apply, tw_apply, th_apply, bb_apply = fit("↓こちらから申請↓", 9, (CW - split) - s(16), weight=700)
    f_scan = font(8, 700)
    scan = "SCAN"
    letter_gap = s(6)
    scan_widths = []
    scan_total = 0
    for ch in scan:
        w, _, _ = measure(ch, f_scan)
        scan_widths.append(w)
        scan_total += w
    scan_total += letter_gap * (len(scan) - 1)
    _, th_scan, bb_scan = measure("S", f_scan)

    qr_box = int(min((CH - band_h) * 0.46, (CW - split) * 0.58))

    gap_above = s(12)
    gap_below = s(14)
    frame_pad = s(8)
    stack_h = th_apply + gap_above + (qr_box + frame_pad * 2) + gap_below + th_scan
    stack_top = band_h + ((CH - band_h) - stack_h) // 2

    apply_y = stack_top
    qx = split + ((CW - split) - qr_box) // 2
    qy = apply_y + th_apply + gap_above + frame_pad

    draw.text(
        (split + ((CW - split) - tw_apply) // 2, apply_y - bb_apply[1]),
        "↓こちらから申請↓",
        font=f_apply,
        fill=RED,
    )

    # シンプルな一重フレーム
    draw.rectangle(
        [qx - frame_pad, qy - frame_pad, qx + qr_box + frame_pad, qy + qr_box + frame_pad],
        fill=WHITE,
        outline=RED,
        width=s(3),
    )
    qr = Image.open(qr_path).convert("RGB").resize((qr_box, qr_box), Image.Resampling.LANCZOS)
    card.paste(qr, (qx, qy))

    sx = qx + (qr_box - scan_total) // 2
    sy = qy + qr_box + frame_pad + gap_below
    for i, ch in enumerate(scan):
        _, _, bb_s = measure(ch, f_scan)
        draw.text((sx, sy - bb_s[1]), ch, font=f_scan, fill=RED)
        sx += scan_widths[i] + letter_gap

    # 外枠（規定赤）
    frame_w = s(5)
    draw.rectangle([0, 0, CW - 1, CH - 1], outline=RED, width=frame_w)

    return card.resize((CARD_W, CARD_H), Image.Resampling.LANCZOS)


def draw_cut_marks(page_draw, x, y, w, h):
    mark = 12
    inset = 2
    for cx, cy, dx, dy in (
        (x, y, 1, 1),
        (x + w, y, -1, 1),
        (x, y + h, 1, -1),
        (x + w, y + h, -1, -1),
    ):
        page_draw.line([(cx + dx * inset, cy), (cx + dx * mark, cy)], fill=CUT, width=1)
        page_draw.line([(cx, cy + dy * inset), (cx, cy + dy * mark)], fill=CUT, width=1)


def main():
    card = build_card()
    page = Image.new("RGB", (PAGE_W, PAGE_H), WHITE)
    draw = ImageDraw.Draw(page)

    for r in range(ROWS):
        for c in range(COLS):
            x = ORIGIN_X + c * (CARD_W + GAP)
            y = ORIGIN_Y + r * (CARD_H + GAP)
            page.paste(card, (x, y))
            draw_cut_marks(draw, x, y, CARD_W, CARD_H)

    page.save(out, "PNG")
    print(f"brand RED={RED}")
    print(f"card {CARD_W}x{CARD_H}px (~{CARD_W/10:.1f}x{CARD_H/10:.1f}mm)")
    print(f"sheet {COLS}x{ROWS} -> {out}")


if __name__ == "__main__":
    main()
