# -*- coding: utf-8 -*-
"""
离线重建 Part2：第五章整体替换（更健壮版本）
1. 第五章章标题段 设为 Heading 1（清覆盖）
2. 删除旧 5.1~5.15 内容段（含紧随的表格）
3. 解析 _ch5.md 插入新内容
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.NEW.docx'
MD  = r'D:/maintain/小程序2.0/软著材料/_gen/_ch5.md'

doc = docx.Document(SRC)
body = doc.element.body

# ---------- 工具函数 ----------
def new_heading_para(hstyle, text):
    p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    pStyle = OxmlElement('w:pStyle'); pStyle.set(qn('w:val'), hstyle)
    pPr.append(pStyle)
    # 段前后距
    sp = OxmlElement('w:spacing'); sp.set(qn('w:before'),'120'); sp.set(qn('w:after'),'60'); sp.set(qn('w:line'),'276'); sp.set(qn('w:lineRule'),'auto'); pPr.append(sp)
    p.append(pPr)
    r = OxmlElement('w:r')
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve'); t.text = text
    r.append(t); p.append(r)
    return p

def new_body_para(text):
    p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    ind = OxmlElement('w:ind')
    ind.set(qn('w:firstLineChars'),'200'); ind.set(qn('w:firstLine'),'420')
    pPr.append(ind)
    sp = OxmlElement('w:spacing'); sp.set(qn('w:after'),'0'); sp.set(qn('w:line'),'276'); sp.set(qn('w:lineRule'),'auto'); pPr.append(sp)
    p.append(pPr)
    r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rf = OxmlElement('w:rFonts'); rf.set(qn('w:ascii'),'宋体'); rf.set(qn('w:hAnsi'),'宋体'); rf.set(qn('w:eastAsia'),'宋体')
    rPr.append(rf)
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'),'21'); rPr.append(sz)
    szCs = OxmlElement('w:szCs'); szCs.set(qn('w:val'),'21'); rPr.append(szCs)
    r.append(rPr)
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve'); t.text = text
    r.append(t); p.append(r)
    return p

def new_table(tbl_rows):
    ncols = max(len(r) for r in tbl_rows)
    tbl = OxmlElement('w:tbl')
    tblPr = OxmlElement('w:tblPr')
    style = OxmlElement('w:tblStyle'); style.set(qn('w:val'),'TableGrid'); tblPr.append(style)
    tblW = OxmlElement('w:tblW'); tblW.set(qn('w:w'),'0'); tblW.set(qn('w:type'),'auto'); tblPr.append(tblW)
    tbl.append(tblPr)
    # borders
    borders = OxmlElement('w:tblBorders')
    for edge in ('top','left','bottom','right','insideH','insideV'):
        e = OxmlElement('w:'+edge); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),'4'); e.set(qn('w:color'),'auto'); borders.append(e)
    tblPr.append(borders)
    tblGrid = OxmlElement('w:tblGrid')
    for _ in range(ncols):
        gc = OxmlElement('w:gridCol'); gc.set(qn('w:w'),'4000'); tblGrid.append(gc)
    tbl.append(tblGrid)
    for ri, row in enumerate(tbl_rows):
        tr = OxmlElement('w:tr')
        for ci in range(ncols):
            val = row[ci] if ci < len(row) else ''
            tc = OxmlElement('w:tc')
            tcPr = OxmlElement('w:tcPr')
            tcW = OxmlElement('w:tcW'); tcW.set(qn('w:w'),'0'); tcW.set(qn('w:type'),'auto'); tcPr.append(tcW)
            tc.append(tcPr)
            p = OxmlElement('w:p')
            pPr = OxmlElement('w:pPr')
            if ri == 0:
                jc = OxmlElement('w:jc'); jc.set(qn('w:val'),'center'); pPr.append(jc)
            p.append(pPr)
            r = OxmlElement('w:r')
            rPr = OxmlElement('w:rPr')
            rf = OxmlElement('w:rFonts'); rf.set(qn('w:ascii'),'宋体'); rf.set(qn('w:hAnsi'),'宋体'); rf.set(qn('w:eastAsia'),'宋体'); rPr.append(rf)
            sz = OxmlElement('w:sz'); sz.set(qn('w:val'),'21'); rPr.append(sz)
            if ri == 0:
                b = OxmlElement('w:b'); rPr.append(b)
            r.append(rPr)
            t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve'); t.text = val
            r.append(t); p.append(r); tc.append(p)
            tr.append(tc)
        tbl.append(tr)
    return tbl

# ---------- 第1步：处理第五章标题 ----------
# 重新定位第五章段（从 body 遍历 w:p）
all_p = body.findall(qn('w:p'))
ch5_title_el = None
for p_el in all_p:
    txt = ''.join(t.text or '' for t in p_el.iter(qn('w:t'))).strip()
    if txt.startswith('第五章'):
        ch5_title_el = p_el
        break
assert ch5_title_el is not None, "未找到第五章标题"
print('第五章标题已定位')

# 第2步：删除从第五章标题之后到第六章标题之前的所有段落和表格
# 遍历 body 子元素，在 ch5_title_el 之后、第六章标题之前删除
del_list = []
seen_ch5 = False
for el in body:
    if el is ch5_title_el:
        seen_ch5 = True
        continue
    if seen_ch5:
        # 判断是否第六章标题
        tag = el.tag
        if tag == qn('w:p'):
            txt = ''.join(t.text or '' for t in el.iter(qn('w:t'))).strip()
            if txt.startswith('第六章'):
                break
        del_list.append(el)
print(f'待删除旧五章元素数: {len(del_list)}')
for el in del_list:
    body.remove(el)

# 第3步：解析 MD 生成插入元素
lines = open(MD, encoding='utf-8').read().split('\n')
new_elems = []
i = 0
while i < len(lines):
    s = lines[i].rstrip().strip()
    if not s:
        i += 1; continue
    if s.startswith('#### '):
        new_elems.append(new_heading_para('Heading 4', s[5:]))
    elif s.startswith('### '):
        new_elems.append(new_heading_para('Heading 3', s[4:]))
    elif s.startswith('## '):
        new_elems.append(new_heading_para('Heading 2', s[3:]))
    elif s.startswith('|'):
        tbl_rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            row = [c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.match(r'^:?-{1,}:?$', rr) for rr in row):
                tbl_rows.append(row)
            i += 1
        new_elems.append(new_table(tbl_rows))
        continue
    else:
        new_elems.append(new_body_para(s))
    i += 1

print('生成新五章元素数:', len(new_elems))
for el in new_elems:
    ch5_title_el.addnext(el)
    ch5_title_el = el

doc.save(SRC)
print('第五章替换完成并保存')

# 统计
from collections import Counter
c = Counter()
ch5_done = False
for p in doc.paragraphs:
    t = p.text.strip()
    if t.startswith('第五章'): ch5_done = True; continue
    if t.startswith('第六章'): ch5_done = False
    if ch5_done and t and (t[0].isdigit() or t[0]=='第'):
        c[p.style.name] += 1
print('第五章标题样式统计:', dict(c))
