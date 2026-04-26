#!/usr/bin/env python3
"""Generates icon.png (180x180) for the GaragePro iPhone home-screen icon."""
import zlib, struct, math

S = 180  # canvas size

def hex_rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16))

def lerp(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(c1[i] + (c2[i]-c1[i])*t) for i in range(3))

def dist(ax, ay, bx, by):
    return math.sqrt((ax-bx)**2 + (ay-by)**2)

# ── Palette ──────────────────────────────────────────────────
BG_TOP    = hex_rgb('060c1c')
BG_BOT    = hex_rgb('0e1f47')
DOOR_FILL = hex_rgb('e9eef8')
DOOR_SEP  = hex_rgb('aab4cc')
DOOR_EDGE = hex_rgb('c8cfdf')
ORANGE    = hex_rgb('f97316')
ORANGE_D  = hex_rgb('c95c0a')
WHITE     = (255, 255, 255)

# ── Pixel grid ───────────────────────────────────────────────
grid = []
for y in range(S):
    row = []
    t = y / (S - 1)
    bg = lerp(BG_TOP, BG_BOT, t)
    for x in range(S):
        row.append(list(bg))
    grid.append(row)

def set_px(x, y, color):
    if 0 <= x < S and 0 <= y < S:
        grid[y][x] = list(color)

def fill_rect(x1, y1, x2, y2, color):
    for y in range(max(0,y1), min(S,y2+1)):
        for x in range(max(0,x1), min(S,x2+1)):
            set_px(x, y, color)

def fill_circle(cx, cy, r, color, inner_r=0, inner_color=None):
    for y in range(max(0, cy-r-1), min(S, cy+r+2)):
        for x in range(max(0, cx-r-1), min(S, cx+r+2)):
            d = dist(x, y, cx, cy)
            if d <= r:
                if inner_r and d <= inner_r and inner_color:
                    set_px(x, y, inner_color)
                else:
                    set_px(x, y, color)

# ── Garage door ──────────────────────────────────────────────
# Door frame: 130 wide × 96 tall, centred
DX1, DY1 = 25, 28
DX2, DY2 = 155, 124

NUM_PANELS = 4
PH = (DY2 - DY1) // NUM_PANELS   # panel height ≈ 24

# Door panel fills + horizontal separators
for y in range(DY1, DY2 + 1):
    panel_local = (y - DY1) % PH
    color = DOOR_SEP if (panel_local == 0 and y > DY1) else DOOR_FILL
    for x in range(DX1, DX2 + 1):
        set_px(x, y, color)

# Vertical dividers (2 lines → 3 columns)
for vx in [DX1 + 43, DX1 + 87]:
    for y in range(DY1, DY2 + 1):
        set_px(vx, y, DOOR_SEP)

# Outer shadow / depth (2px dark edge above door)
for bx in range(DX1 - 3, DX2 + 4):
    for dy in range(4):
        gy = DY1 - dy - 1
        set_px(bx, gy, lerp(BG_BOT, DOOR_EDGE, dy / 4))

# Door border
for x in range(DX1, DX2 + 1):
    set_px(x, DY1, DOOR_EDGE)
    set_px(x, DY2, DOOR_EDGE)
for y in range(DY1, DY2 + 1):
    set_px(DX1, y, DOOR_EDGE)
    set_px(DX2, y, DOOR_EDGE)

# ── Orange accent bar (ground line) ──────────────────────────
BAR_Y1, BAR_Y2 = 135, 151
for y in range(BAR_Y1, BAR_Y2 + 1):
    t_fade = (y - BAR_Y1) / max(1, BAR_Y2 - BAR_Y1)
    for x in range(DX1, DX2 + 1):
        t_grad = (x - DX1) / max(1, DX2 - DX1)
        c = lerp(ORANGE, ORANGE_D, t_grad * 0.5)
        c = lerp(c, ORANGE_D, t_fade * 0.3)
        set_px(x, y, c)

# ── Door handle (orange ring with white centre) ───────────────
HCX, HCY = 90, DY2 - 4
fill_circle(HCX, HCY, 9, ORANGE, inner_r=5, inner_color=WHITE)

# ── Wrench silhouette (top-right corner accent) ───────────────
# Simplified: two circles + a rectangle to mimic a spanner
def fill_ring(cx, cy, r_out, r_in, color):
    for y in range(max(0, cy-r_out-1), min(S, cy+r_out+2)):
        for x in range(max(0, cx-r_out-1), min(S, cx+r_out+2)):
            d = dist(x, y, cx, cy)
            if r_in < d <= r_out:
                set_px(x, y, color)

WX, WY = 141, 22   # wrench centre-top
fill_ring(WX, WY, 13, 7, ORANGE)
# Wrench handle (diagonal bar going down-left)
for i in range(22):
    bx = WX - 6 - i
    by = WY + 5 + i
    for t in range(-3, 4):
        set_px(bx + t, by, ORANGE)
        set_px(bx, by + t, ORANGE)

# ── PNG encoding ─────────────────────────────────────────────
def write_png(filename):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', S, S, 8, 2, 0, 0, 0)

    raw = b''
    for row in grid:
        raw += b'\x00'
        for px in row:
            raw += bytes([max(0,min(255,px[0])), max(0,min(255,px[1])), max(0,min(255,px[2]))])

    png = (b'\x89PNG\r\n\x1a\n' +
           chunk(b'IHDR', ihdr) +
           chunk(b'IDAT', zlib.compress(raw, 9)) +
           chunk(b'IEND', b''))

    with open(filename, 'wb') as f:
        f.write(png)
    print(f'✓ Created {filename} ({len(png):,} bytes, {S}×{S}px)')

write_png('/Users/guybuganim/Code/Garagedoor App/icon.png')
