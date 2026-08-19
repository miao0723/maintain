# -*- coding: utf-8 -*-
"""
离线重建 Part1 修正版：
标题样式化时清除 run 级 rPr 覆盖，让 Heading 样式完全接管（真正的 Word 标题样式）。
仅处理 .NEW.docx 中现有标题段落。第五章范围 [145..197] 跳过（后续整体替换）。
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.oxml.ns import qn

SRC = r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.NEW.docx'
doc = docx.Document(SRC)
paras = doc.paragraphs

ch_re = re.compile(r'^第[一二三四五六七八九十]+章')
sec2_re = re.compile(r'^\d+\.\d+\s')
sec3_re = re.compile(r'^\d+\.\d+\.\d+\s')

CH5_START, CH5_END = 145, 197

def set_heading(p, hname):
    # 1. 段落样式 = Heading
    p.style = doc.styles[hname]
    # 2. 清段落级 pPr 中可能干扰的 outlineLvl 手动值（可选，保留无碍）
    pPr = p._element.find(qn('w:pPr'))
    if pPr is not None:
        ol = pPr.find(qn('w:outlineLvl'))
        if ol is not None and ol.get(qn('w:val')) == '9':
            pPr.remove(ol)
    # 3. 清除所有 run 的 rPr（字体/字号/粗细/颜色覆盖），完全交给样式
    for r in p.runs:
        rPr = r._element.find(qn('w:rPr'))
        if rPr is not None:
            r._element.remove(rPr)

h1=h2=h3=0
for i, p in enumerate(paras):
    t = p.text.strip()
    if not t or len(t) > 50 or i < 44:
        continue
    if CH5_START <= i < CH5_END:
        continue  # 五章内容随后整体替换
    if ch_re.match(t):
        set_heading(p, 'Heading 1'); h1+=1
    elif sec3_re.match(t) and len(t) < 60:
        set_heading(p, 'Heading 3'); h3+=1
    elif sec2_re.match(t) and len(t) < 60:
        set_heading(p, 'Heading 2'); h2+=1

print(f'标题样式化(清覆盖): H1={h1}, H2={h2}, H3={h3}')
doc.save(SRC)
print('已保存')
