# -*- coding: utf-8 -*-
"""生成《电子维修服务管理系统 源程序代码》—— 合规版（前 30 页 + 后 30 页，共 60 页）。

修复点：
  1) ROOT 指向真实项目目录 D:/maintain/小程序2.0（旧版路径错一级导致全空）。
  2) 长行（SQL / 长属性 wxml / 中文注释）预折行，保证每页恰好 50 物理行、
     不溢出 → 物理页数锁定 60，页眉页码不再串页。
  3) 连续排列：前 30 页取自程序开头（后端核心），后 30 页取自程序末尾（页面逻辑）。
  4) 密钥脱敏、CJK 字体（无黑块）、零 AI 标记。
同时输出 PDF（提交用）与 DOCX（可编辑留档）。
"""
import os
import re

# ===================== 配置 =====================
PROJECT = r"D:\maintain\小程序2.0"
OUT_DIR = r"D:\maintain\小程序2.0\软著材料"
PDF_OUT = os.path.join(OUT_DIR, "众云信息科技维修回收综合服务平台V1.0-源程序代码.pdf")
DOCX_OUT = os.path.join(OUT_DIR, "众云信息科技维修回收综合服务平台V1.0-源程序代码.docx")
SOFT = "众云信息科技维修回收综合服务平台V1.0"
COMPANY = "深圳市众云信息科技有限公司"
PAGE_LINES = 50
FRONT_PAGES = 30
BACK_PAGES = 30
CJK_LIMIT = 58      # 含中文的行按此宽度折行（8pt 下约 58 全角字符 = 464pt < 510pt）
LATN_LIMIT = 108    # 纯西文行按此宽度折行（8pt 下约 108 字符 = 475pt < 510pt）

# ===================== 文件收集 =====================
EXCLUDE_DIRS = {"node_modules", "dist", "build", ".git", "coverage",
                ".cloudbase", "miniprogram_npm", "__pycache__",
                "软著材料", "_gen", "uploads", "docker", "libs",
                "assets", "images", "theme", "miniprogram"}
EXCLUDE_FILES = {"package-lock.json", "package.json"}
EXTS = {".js", ".ts", ".wxml", ".wxss", ".json"}
PRIORITY = [
    ("backend/server.js", 0), ("backend/database.js", 0),
    ("backend/middleware", 1), ("backend/routes", 1),
    ("backend/services", 1), ("backend/utils", 1),
    ("app.js", 2), ("app.json", 2), ("app.wxss", 2),
    ("utils", 3), ("custom-tab-bar", 4), ("components", 5),
    ("pages", 6), ("cloudfunctions", 7),
]


def _prio(rel):
    for prefix, p in PRIORITY:
        if rel == prefix or rel.startswith(prefix + "/"):
            return p
    return 9


def collect_files():
    found = []
    for root, dirs, files in os.walk(PROJECT):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for fn in files:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in EXTS or fn in EXCLUDE_FILES:
                continue
            if fn.endswith(".min.js") or fn.endswith(".min.ts"):
                continue
            if "node_modules" in root.replace("/", "\\").split("\\"):
                continue
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, PROJECT).replace("\\", "/")
            found.append(rel)
    found.sort(key=lambda r: (_prio(r), r))
    return found


# ===================== 脱敏 =====================
SECRET_RE = re.compile(
    r'(?i)((?:(?:api[_-]?key|secret|access[_-]?key|client[_-]?secret|'
    r'private[_-]?key|auth[_-]?token|password|passwd|token|app[_-]?secret)'
    r'\s*[:=]\s*["\'])([^"\']{1,200})(["\']))'
)
PLACEHOLDER_RE = re.compile(r'(your[-_]?key|your[-_]?secret|change[-_]?me|'
                            r'replace[-_]?me|xxxx+|password123|123456|<your|example)', re.I)
SK_RE = re.compile(r'sk-[A-Za-z0-9]{8,}')
# 源码中常见的兜底密钥占位（如 process.env.JWT_SECRET || 'your-secret-key-change-in-production'）
PLACEHOLDER_STR_RE = re.compile(r"['\"]your[-_](?:secret|key)[-_][A-Za-z0-9-]+['\"]")


def mask_line(line):
    def repl(m):
        pre, val, post = m.group(1), m.group(2), m.group(3)
        if "*" in val:
            return m.group(0)
        if PLACEHOLDER_RE.search(val):
            return pre + ("*" * min(len(val), 20)) + post
        if len(val) >= 8 and re.search(r"[A-Za-z]", val) and re.search(r"\d", val):
            return pre + (val[:4] + "*" * (len(val) - 8) + val[-4:]) + post
        return m.group(0)
    line = PLACEHOLDER_STR_RE.sub(lambda m: m.group(0)[0] + "****...****" + m.group(0)[-1], line)
    line = SECRET_RE.sub(repl, line)
    line = SK_RE.sub(lambda m: "sk-" + m.group(0)[3:7] + "****...****" + m.group(0)[-4:], line)
    return line


# ===================== 预折行 =====================
def wrap_line(line):
    if any("\u4e00" <= c <= "\u9fff" for c in line):
        limit = CJK_LIMIT
    else:
        limit = LATN_LIMIT
    if len(line) <= limit:
        return [line]
    return [line[i:i + limit] for i in range(0, len(line), limit)]


def build_physical():
    rels = collect_files()
    phys = []
    missing = 0
    for rel in rels:
        fp = os.path.join(PROJECT, rel)
        if not os.path.exists(fp):
            missing += 1
            phys.extend(wrap_line("/* 文件不存在：%s */" % rel))
            continue
        try:
            with open(fp, "r", encoding="utf-8", errors="replace") as f:
                code = f.read()
        except Exception as e:
            phys.extend(wrap_line("/* 读取失败：%s (%s) */" % (rel, e)))
            continue
        phys.extend(wrap_line("// " + "=" * 18 + " " + rel + " " + "=" * 18))
        for raw in code.split("\n"):
            phys.extend(wrap_line(mask_line(raw)))
    return rels, phys, missing


def paginate(phys):
    if len(phys) > FRONT_PAGES * PAGE_LINES + BACK_PAGES * PAGE_LINES:
        chosen = phys[:FRONT_PAGES * PAGE_LINES] + phys[-BACK_PAGES * PAGE_LINES:]
    else:
        chosen = phys
    pages = [chosen[i:i + PAGE_LINES] for i in range(0, len(chosen), PAGE_LINES)]
    return pages


# ===================== 渲染 PDF =====================
def render_pdf(chosen):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (Paragraph, SimpleDocTemplate, Frame,
                                    PageTemplate, PageBreak)
    from reportlab.lib.styles import ParagraphStyle as PS

    pdfmetrics.registerFont(TTFont("CJK", "C:/Windows/Fonts/msyh.ttc", subfontIndex=0))
    pdfmetrics.registerFont(TTFont("CJKB", "C:/Windows/Fonts/msyhbd.ttc", subfontIndex=0))

    S_CODE = PS("Code", fontName="CJK", fontSize=8, leading=12.5,
                textColor=HexColor("#1E293B"), spaceBefore=0, spaceAfter=0,
                wordWrap="CJK")
    S_HEAD = PS("File", fontName="CJKB", fontSize=8.5, leading=13,
                textColor=HexColor("#00479C"), spaceBefore=0, spaceAfter=1,
                wordWrap="CJK")

    total = FRONT_PAGES + BACK_PAGES

    def on_page(cvs, doc):
        w, h = A4
        pg = cvs.getPageNumber()
        if pg <= FRONT_PAGES:
            lbl = "第 %d 页（前30页）" % pg
        else:
            lbl = "第 %d 页（后%d页）" % (pg, pg - FRONT_PAGES)
        cvs.saveState()
        cvs.setFont("CJKB", 7.5)
        cvs.setFillColor(HexColor("#1F4E79"))
        cvs.drawString(16 * mm, h - 11 * mm, SOFT)
        cvs.drawRightString(w - 14 * mm, h - 11 * mm, lbl)
        cvs.setStrokeColor(HexColor("#E2E8F0"))
        cvs.line(16 * mm, h - 13 * mm, w - 14 * mm, h - 13 * mm)
        cvs.setFont("CJK", 7.5)
        cvs.setFillColor(HexColor("#94A3B8"))
        cvs.drawCentredString(w / 2, 8 * mm, COMPANY)
        cvs.restoreState()

    doc = SimpleDocTemplate(PDF_OUT, pagesize=A4,
                            leftMargin=16 * mm, rightMargin=14 * mm,
                            topMargin=15 * mm, bottomMargin=13 * mm)
    frame = Frame(16 * mm, 13 * mm, A4[0] - 30 * mm, A4[1] - 30 * mm, id="main")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])

    def esc(s):
        s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        return s.replace(" ", "\u00A0").replace("\t", "\u00A0\u00A0\u00A0\u00A0")

    story = []
    n = len(chosen)
    for idx, page in enumerate(chosen):
        for ln in page:
            if ln.startswith("// " + "=" * 18):
                story.append(Paragraph(esc(ln), S_HEAD))
            else:
                story.append(Paragraph(esc(ln) if ln else "\u00A0", S_CODE))
        if idx != n - 1:
            story.append(PageBreak())
    doc.build(story)
    print("PDF ->", PDF_OUT, "(%d pages)" % n)


# ===================== 渲染 DOCX =====================
def render_docx(chosen):
    from docx import Document
    from docx.shared import Pt, RGBColor, Cm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.section import WD_SECTION
    from docx.oxml.ns import qn

    def set_cjk(run, name="宋体", size=8, bold=False, color=None):
        run.font.name = name
        run.font.size = Pt(size)
        run.bold = bold
        if color is not None:
            run.font.color.rgb = color
        r = run._element
        rPr = r.get_or_add_rPr()
        rFonts = rPr.find(qn("w:rFonts"))
        if rFonts is None:
            rFonts = r.makeelement(qn("w:rFonts"), {})
            rPr.append(rFonts)
        rFonts.set(qn("w:eastAsia"), name)
        rFonts.set(qn("w:ascii"), name)
        rFonts.set(qn("w:hAnsi"), name)

    doc = Document()
    # 页边距
    for s in doc.sections:
        s.top_margin = Cm(1.4); s.bottom_margin = Cm(1.2)
        s.left_margin = Cm(1.8); s.right_margin = Cm(1.6)
    st = doc.styles["Normal"]
    st.font.name = "宋体"
    st.font.size = Pt(8)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "宋体")

    def add_line(text, header=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        run = p.add_run(text if text != "" else " ")
        if header:
            set_cjk(run, "黑体", 8, bold=True, color=RGBColor(0x00, 0x47, 0x9C))
        else:
            set_cjk(run, "宋体", 8)
        t = run._element.find(qn("w:t"))
        if t is not None:
            t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
        return p

    def add_page(lines, page_no, last=False):
        if page_no <= FRONT_PAGES:
            lbl = "%s | 第 %d 页（前30页）" % (SOFT, page_no)
        else:
            lbl = "%s | 第 %d 页（后%d页）" % (SOFT, page_no, page_no - FRONT_PAGES)
        h = doc.add_paragraph(); h.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cjk(h.add_run(lbl), "黑体", 8, bold=True, color=RGBColor(0x1F, 0x4E, 0x79))
        h.paragraph_format.space_after = Pt(2)
        for ln in lines:
            add_line(ln, header=ln.startswith("// " + "=" * 18))
        f = doc.add_paragraph(); f.alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cjk(f.add_run(COMPANY), "宋体", 7.5, color=RGBColor(0x80, 0x80, 0x80))
        f.paragraph_format.space_before = Pt(2)
        if not last:
            doc.add_page_break()

    page_no = 1
    n = len(chosen)
    for page in chosen:
        add_page(page, page_no, last=(page_no == n))
        page_no += 1
    doc.save(DOCX_OUT)
    print("DOCX ->", DOCX_OUT, "(%d pages)" % len(chosen))


# ===================== 主流程 =====================
def main():
    rels, phys, missing = build_physical()
    print("收集源文件数：%d ，缺失：%d ，预折行后总行数：%d" % (len(rels), missing, len(phys)))
    chosen = paginate(phys)
    print("实际生成页数：%d（前 %d + 后 %d）" % (len(chosen), FRONT_PAGES, BACK_PAGES))
    render_pdf(chosen)
    render_docx(chosen)
    txt = "\n".join("\n".join(p) for p in chosen)
    with open(os.path.join(OUT_DIR, "_gen", "_source_concat.txt"), "w", encoding="utf-8") as f:
        f.write(txt)
    print("拼接文本 -> _gen/_source_concat.txt")


if __name__ == "__main__":
    main()
