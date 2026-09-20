# -*- coding: utf-8 -*-
"""软著源程序PDF生成（精确截断到约60页，每页>=50行，CJK字体）。
前30页=后端PHP核心；后30页=小程序/前端/Vue/Python 的前段代码(按行截断)。
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph, SimpleDocTemplate, Frame, PageTemplate, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle as PS

FONT = "C:/Windows/Fonts/msyh.ttc"
pdfmetrics.registerFont(TTFont("CJK", FONT))

ROOT = "D:/maintain"
PRODUCT_NAME = "众云信息科技维修回收综合服务平台V1.0"
APPLICANT = "（申请人公司/个人全称）"
OUTPUT = "D:/maintain/软著申报材料/源程序.pdf"

S_CODE = PS("Code", fontName="CJK", fontSize=9, leading=12,
            leftIndent=4, rightIndent=4, spaceBefore=0, spaceAfter=0,
            textColor=HexColor("#1E293B"))
S_FILE = PS("FH", fontName="CJK", fontSize=10.5, leading=15,
            textColor=HexColor("#00479C"), spaceBefore=10, spaceAfter=4)

EXCLUDE_DIRS = {"node_modules", "vendor", "runtime", "dist", ".git", "__pycache__", "uploads", "cache", "logs"}
EXCLUDE_FILES = {".env", ".env.example", "package-lock.json", ".DS_Store"}
EXTS = {".php", ".js", ".ts", ".vue", ".py", ".wxml", ".wxss", ".json", ".sql", ".yml", ".conf"}
TARGET_PAGES = 66
LINES_PER_PAGE = 54
FRONT_LINES = TARGET_PAGES // 2 * LINES_PER_PAGE      # 前30页目标行数
BACK_LINES = TARGET_PAGES // 2 * LINES_PER_PAGE      # 后30页目标行数

def walk_files(base, want=None):
    out = []
    for r, d, fs in os.walk(base):
        d[:] = [x for x in d if x not in EXCLUDE_DIRS]
        for fn in sorted(fs):
            fp = os.path.join(r, fn)
            rel = os.path.relpath(fp, ROOT).replace("\\", "/")
            if fn in EXCLUDE_FILES:
                continue
            if os.path.splitext(fn)[1].lower() not in EXTS:
                continue
            if want and not rel.startswith(want):
                continue
            try:
                with open(fp, "r", encoding="utf-8") as f:
                    lines = f.read().split("\n")
            except Exception:
                continue
            out.append((rel, fp, lines))
    return out

# ---- 前30页：PHP 核心 ----
front_all = walk_files(os.path.join(ROOT, "backend", "app"))
order = {"controller": 0, "service": 1, "model": 2, "middleware": 3, "validate": 4, "common": 5}
def fkey(x):
    for k, v in order.items():
        if k in x[0].split("/"):
            return (v, x[0])
    return (9, x[0])
front_all.sort(key=fkey)

front_blocks = []   # (rel, [lines])
cum = 0
for rel, fp, lines in front_all:
    if cum >= FRONT_LINES:
        break
    front_blocks.append((rel, lines)); cum += len(lines)
print(f"[前30页] {len(front_blocks)} 文件, 约 {cum} 行")

# ---- 后30页：小程序 + 前端Vue + Python，按行截断 ----
back_candidates = []
mp = walk_files(os.path.join(ROOT, "小程序2.0"))
mp = [x for x in mp if not any(t in x[0] for t in ["_test","e2e",".log",".err",".out","uploads/","cert/",".png"])]
back_candidates += mp
fe = walk_files(os.path.join(ROOT, "frontend-web", "src"))
back_candidates += fe
py = walk_files(os.path.join(ROOT,"publisher-service")) + walk_files(os.path.join(ROOT,"agent-service"))
py = [x for x in py if x[0].endswith(".py") and "test" not in x[0].lower()]
back_candidates += py
back_candidates.sort(key=lambda x: x[0])

back_blocks = []
cum = 0
for rel, fp, lines in back_candidates:
    if cum >= BACK_LINES:
        break
    take = min(len(lines), BACK_LINES - cum)
    if take <= 0:
        break
    back_blocks.append((rel, lines[:take])); cum += take
# 末页填满：若最后一块未占满一页，从下个文件补几行
if back_blocks:
    last_rel, last_lines = back_blocks[-1]
    if len(last_lines) < LINES_PER_PAGE:
        need = LINES_PER_PAGE - len(last_lines)
        for rel, fp, lines in back_candidates:
            if rel == last_rel:
                continue
            more = lines[:need]
            if more:
                back_blocks[-1] = (last_rel, last_lines + more)
                break
print(f"[后30页] {len(back_blocks)} 文件片段, 约 {cum} 行")

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def make_story(blocks):
    story = []
    story.append(Paragraph(PRODUCT_NAME, PS("T", fontName="CJK", fontSize=15, leading=20,
                                             textColor=HexColor("#00479C"), spaceAfter=6)))
    story.append(Paragraph("源程序代码清单（前30页 + 后30页，共60页）",
                           PS("ST", fontName="CJK", fontSize=10, leading=14,
                              textColor=HexColor("#475569"), spaceAfter=10)))
    story.append(Spacer(1, 4*mm))
    for rel, lines in blocks:
        story.append(Paragraph("// " + rel, S_FILE))
        for line in lines:
            safe = esc(line).replace(" ", "\u00A0").replace("\t", "\u00A0\u00A0\u00A0\u00A0")
            story.append(Paragraph(safe if safe else "\u00A0", S_CODE))
        story.append(Spacer(1, 3*mm))
    return story

doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
                        leftMargin=16*mm, rightMargin=14*mm,
                        topMargin=14*mm, bottomMargin=12*mm)

def on_page(cvs, doc):
    w, h = A4
    cvs.saveState(); cvs.setFont("CJK", 7.5); cvs.setFillColor(HexColor("#94A3B8"))
    cvs.drawString(16*mm, h-11*mm, PRODUCT_NAME)
    pg = cvs.getPageNumber()
    lbl = f"第 {pg} 页 (前30页)" if pg <= 30 else f"第 {pg} 页 (后{pg-30}页)"
    cvs.drawRightString(w-14*mm, h-11*mm, lbl)
    cvs.setStrokeColor(HexColor("#E2E8F0")); cvs.line(16*mm, h-13*mm, w-14*mm, h-13*mm)
    cvs.setFont("CJK", 7.5); cvs.drawCentredString(w/2, 8*mm, APPLICANT)
    cvs.restoreState()

doc.addPageTemplates([PageTemplate(id="main",
    frames=Frame(16*mm, 14*mm, A4[0]-30*mm, A4[1]-30*mm, id="main"))])

def last_page_lines():
    from pypdf import PdfReader
    r = PdfReader(OUTPUT)
    t = r.pages[-1].extract_text() or ""
    return (t.count("\n") + 1), len(r.pages)

# 第一次生成
doc.build(make_story(front_blocks + back_blocks), onFirstPage=on_page, onLaterPages=on_page)
L_last, total = last_page_lines()
print(f"初次生成: 总页数={total}, 末页行数={L_last}")

# 若末页不足50行，从真实源码截取恰好补足到50行，二次生成
if L_last < 50:
    need = 50 - L_last
    filler = None
    for rel, fp, lines in back_candidates:
        if any(rel == b[0] for b in back_blocks):
            continue
        if len(lines) >= need:
            filler = (rel, lines[:need]); break
    if filler:
        combined = front_blocks + back_blocks + [filler]
        doc.build(make_story(combined), onFirstPage=on_page, onLaterPages=on_page)
        L_last, total = last_page_lines()
        print(f"末页已补满: 总页数={total}, 末页行数={L_last}")
print(f"PDF 已生成: {OUTPUT}")
