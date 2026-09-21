"""把匾額文字合成到店內插畫上。

不用 AI 重生：影像模型寫中文幾乎必定產出似是而非的怪字。
這裡用系統的標楷體逐字畫上去，筆畫才會是對的。

匾額本身有透視（由左到右逐漸下沉，每一面也各自傾斜），
所以每一面先量出自己的上緣斜率，文字跟著轉同樣角度再貼上去。
"""
from PIL import Image, ImageDraw, ImageFont
import math
import sys

SRC = sys.argv[1]
DST = sys.argv[2]
FONT = r"C:/Windows/Fonts/kaiu.ttf"          # 標楷體，匾額的慣用字體
INK = (150, 33, 30)                           # 匾額朱紅，比 --vermilion 再深一點才壓得住米白

# 由左到右，照實際店內照片的排列順序
TEXTS = ["老山高麗", "萬蘭真珠", "安南官桂", "美國粉光"]

im = Image.open(SRC).convert("RGB")
W, H = im.size
px = im.load()


def bright(x, y):
    r, g, b = px[x, y]
    return (r + g + b) / 3 > 165 and r > 180


RUN = 14   # 要連續這麼多列都亮才算真的進到匾額，避開牆面與邊框的單列雜訊


def top_edge(x):
    """某一行由上往下找到匾額米白區的起點（需連續 RUN 列都亮）"""
    streak = 0
    for y in range(20, 260):
        if bright(x, y):
            streak += 1
            if streak >= RUN:
                return y - RUN + 1
        else:
            streak = 0
    return None


def bottom_edge(x, start):
    """由起點往下走，遇到連續 6 列不亮才算出界"""
    dark = 0
    y = start
    while y < H - 2:
        if bright(x, y):
            dark = 0
        else:
            dark += 1
            if dark >= 6:
                return y - dark + 1
        y += 1
    return y


# 逐行判斷是否落在匾額帶內，切出各面的水平範圍
cols = [sum(1 for y in range(95, 200, 5) if bright(x, y)) >= 8 for x in range(W)]
runs, cur = [], None
for x, ok in enumerate(cols):
    if ok and cur is None:
        cur = x
    elif not ok and cur is not None:
        if x - cur > 60:
            runs.append((cur, x))
        cur = None
if cur is not None and W - cur > 60:
    runs.append((cur, W))

print(f"偵測到 {len(runs)} 面匾額")
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))

for i, (a, b) in enumerate(runs):
    if i >= len(TEXTS):
        break
    text = TEXTS[i]
    inset = max(10, int((b - a) * 0.04))
    xl, xr = a + inset, b - inset

    tl, tr = top_edge(xl), top_edge(xr)
    if tl is None or tr is None:
        print(f"  第{i+1}面：量不到上緣，跳過")
        continue
    bl = bottom_edge(xl, tl)
    angle = math.degrees(math.atan2(tr - tl, xr - xl))
    ph = bl - tl                                   # 這一面的淨高
    pw = xr - xl

    # 字級：以高度為準（匾額是橫排單行），但不能超過欄寬的四分之一
    size_by_h = int(ph * 0.66)
    size_by_w = int(pw / len(text) * 0.86)
    # 第四面被畫面右緣裁掉，不縮字去硬塞——維持與其他面一致的字級，讓它自然切斷
    clipped = b >= W - 4
    size = size_by_h if clipped else min(size_by_h, size_by_w)
    font = ImageFont.truetype(FONT, size)

    # 先在透明圖層上水平排一行，再整行旋轉
    gap = int(size * 0.14)
    widths = [font.getbbox(c)[2] - font.getbbox(c)[0] for c in text]
    line_w = sum(widths) + gap * (len(text) - 1)
    line_h = int(size * 1.35)
    strip = Image.new("RGBA", (line_w + size, line_h + size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(strip)
    cx = size // 2
    for c, cw in zip(text, widths):
        bb = font.getbbox(c)
        sd.text((cx - bb[0], size // 2 - bb[1]), c, font=font, fill=INK + (238,))
        cx += cw + gap
    strip = strip.rotate(-angle, resample=Image.BICUBIC, expand=True)

    # 對齊：置中於這一面；被裁掉的那面靠左起排
    cyc = (tl + tr) / 2 + ph / 2
    if clipped:
        ox = xl
    else:
        ox = xl + (pw - line_w) // 2 - size // 2
    oy = int(cyc - strip.height / 2)
    layer.alpha_composite(strip, (int(ox), oy))
    fit = "裁切" if clipped else "置中"
    print(f"  第{i+1}面「{text}」 x{a}-{b} 寬{pw} 高{ph} 傾角{angle:+.1f}° 字級{size} {fit}")

out = Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")
out.save(DST)
print("輸出", DST)
