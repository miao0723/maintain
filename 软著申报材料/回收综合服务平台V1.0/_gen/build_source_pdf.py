# -*- coding: utf-8 -*-
"""软著源程序 PDF 生成：严格 60 页（前30+后30），每页恰好 52 行（≥50 行要求），
页眉含软件名称+版本号与页码，前30页为回收后台服务端核心代码，
后30页为小程序回收模块 + 桥接接口 + 管理后台前端代码。"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_PATH = 'C:/Windows/Fonts/msyh.ttc'
pdfmetrics.registerFont(TTFont('CJK', FONT_PATH, subfontIndex=0))

ROOT = 'D:/maintain'
PRODUCT = '众云信息科技电子产品回收综合服务平台V1.0'
OUT = 'D:/maintain/软著申报材料/回收综合服务平台V1.0/众云信息科技电子产品回收综合服务平台V1.0-源程序.pdf'

LINES_PER_PAGE = 52
TOTAL_PAGES = 60
FRONT_PAGES = 30

# 前30页：回收后台服务端核心（入口 → 数据库 → 认证 → 订单 → 配价 → 统计）
FRONT_FILES = [
    'recycle-admin/server/server.js',
    'recycle-admin/server/database.js',
    'recycle-admin/server/middleware/auth.js',
    'recycle-admin/server/utils/oplog.js',
    'recycle-admin/server/routes/authRoutes.js',
    'recycle-admin/server/routes/orderRoutes.js',
    'recycle-admin/server/routes/catalogRoutes.js',
    'recycle-admin/server/routes/statsRoutes.js',
    'recycle-admin/server/routes/settingRoutes.js',
]
# 后30页：小程序回收模块 + 公开接口桥接 + 管理后台前端
BACK_FILES = [
    '小程序2.0/pages/recycle/recycle.js',
    '小程序2.0/pages/recycle-guide/recycle-guide.js',
    '小程序2.0/utils/recycleCatalog.js',
    '小程序2.0/backend/routes/recycleRoutes.js',
    'recycle-admin/web/src/api/request.js',
    'recycle-admin/web/src/api/index.js',
    'recycle-admin/web/src/router/index.js',
    'recycle-admin/web/src/layout/MainLayout.vue',
    'recycle-admin/web/src/views/Orders.vue',
    'recycle-admin/web/src/views/Pricing.vue',
]
# 前后段耗尽时的补行文件
FILLER_FILES = [
    '小程序2.0/utils/recycleData.js',
    'recycle-admin/web/src/views/Catalog.vue',
    'recycle-admin/web/src/views/Dashboard.vue',
    'recycle-admin/server/routes/platformRoutes.js',
    'recycle-admin/server/routes/linkRoutes.js',
]


def read_lines(rel):
    fp = os.path.join(ROOT, rel)
    with open(fp, 'r', encoding='utf-8-sig', errors='replace') as f:
        raw = f.read().split('\n')
    lines = [ln.rstrip() for ln in raw]
    while lines and lines[-1] == '':
        lines.pop()
    return lines


def build_stream(files):
    """文件流 → (kind, text) 序列；kind: F=文件头, C=代码行"""
    stream = []
    for rel in files:
        stream.append(('F', rel))
        stream.append(('C', ''))
        for ln in read_lines(rel):
            stream.append(('C', ln))
    return stream


def take_pages(stream, pages):
    """从流中切出 pages 页，每页 LINES_PER_PAGE 个槽位"""
    out = []
    idx = 0
    for _ in range(pages):
        page = stream[idx:idx + LINES_PER_PAGE]
        out.append(page)
        idx += LINES_PER_PAGE
    return out, idx


def fill_last(page, filler_stream, used_rels):
    """末页不足时从补行流补满"""
    need = LINES_PER_PAGE - len(page)
    for item in filler_stream:
        if need <= 0:
            break
        if item[0] == 'F' and item[1] in used_rels:
            continue
        page.append(item)
        if item[0] == 'F':
            used_rels.add(item[1])
        need -= 1
    while len(page) < LINES_PER_PAGE:
        page.append(('C', ''))
    return page


front_stream = build_stream(FRONT_FILES)
back_stream = build_stream(BACK_FILES)
filler_stream = build_stream(FILLER_FILES)

front_pages, f_used = take_pages(front_stream, FRONT_PAGES)
back_pages, b_used = take_pages(back_stream, TOTAL_PAGES - FRONT_PAGES)

# 每一段的末页补满
used_front = set()
for pg in front_pages:
    for kind, text in pg:
        if kind == 'F':
            used_front.add(text)
used_back = set()
for pg in back_pages:
    for kind, text in pg:
        if kind == 'F':
            used_back.add(text)

front_pages[-1] = fill_last(front_pages[-1], filler_stream, used_front)
back_pages[-1] = fill_last(back_pages[-1], filler_stream, used_back)

all_pages = front_pages + back_pages
assert len(all_pages) == TOTAL_PAGES, f'页数异常: {len(all_pages)}'

# ==================== 渲染 ====================
W, H = A4
M_L, M_R = 14 * mm, 12 * mm
M_T, M_B = 16 * mm, 12 * mm
CODE_PT = 8.2
LEAD = 12.6
MAX_W = W - M_L - M_R

c = pdfcanvas.Canvas(OUT, pagesize=A4)
c.setTitle(PRODUCT + ' 源程序')
c.setAuthor('众云信息科技')

CLIP = '…'


def draw_line(text, x, y, pt, color):
    t = text
    try:
        while pdfmetrics.stringWidth(t, 'CJK', pt) > MAX_W:
            t = t[:int(len(t) * 0.92)]
            if len(t) < 8:
                break
        if t != text:
            t = t + CLIP
    except Exception:
        t = t[:100]
    c.setFont('CJK', pt)
    c.setFillColor(color)
    c.drawString(x, y, t)


def render_page(page_items, page_no):
    # 页眉：软件名称+版本号（左） 页码（右）
    c.setFont('CJK', 7.5)
    c.setFillColor(HexColor('#94A3B8'))
    c.drawString(M_L, H - 10 * mm, PRODUCT)
    seg = '前30页' if page_no <= FRONT_PAGES else '后30页'
    c.drawRightString(W - M_R, H - 10 * mm, f'第 {page_no} 页 / 共 60 页（{seg}）')
    c.setStrokeColor(HexColor('#CBD5E1'))
    c.setLineWidth(0.4)
    c.line(M_L, H - 12 * mm, W - M_R, H - 12 * mm)

    y = H - M_T
    for kind, text in page_items:
        if kind == 'F':
            y -= LEAD * 0.5
            draw_line('// ============ ' + text + ' ============', M_L, y, 8.6, HexColor('#00479C'))
            y -= LEAD
        else:
            draw_line(text if text else ' ', M_L, y, CODE_PT, HexColor('#1E293B'))
            y -= LEAD
    c.showPage()


for i, pg in enumerate(all_pages, 1):
    render_page(pg, i)

c.save()

# ==================== 自检：每页行数 ====================
from pypdf import PdfReader
r = PdfReader(OUT)
print(f'总页数: {len(r.pages)}')
min_lines = min((p.extract_text() or '').count('\n') + 1 for p in r.pages)
print(f'每页最少物理行数(含页眉): {min_lines}')
print('PDF 已生成:', OUT)
