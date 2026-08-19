# -*- coding: utf-8 -*-
"""修正：把 markdown 插入的标题（Normal+outlineLvl）改成真正的 Heading 样式"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.oxml.ns import qn

path = r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.docx'
doc = docx.Document(path)

# outlineLvl(0-based) -> Heading 样式
level_map = {
    '1': 'Heading 2',
    '2': 'Heading 3',
    '3': 'Heading 4',
}

fixed = 0
for p in doc.paragraphs:
    pPr = p._element.pPr
    if pPr is None:
        continue
    ol = pPr.find(qn('w:outlineLvl'))
    if ol is None:
        continue
    sn = (p.style.name or '').lower()
    if 'heading' in sn:
        continue  # 已经是 Heading 样式
    ol_val = ol.get(qn('w:val'))
    heading_name = level_map.get(ol_val)
    if heading_name is None:
        continue
    try:
        p.style = doc.styles[heading_name]
    except KeyError:
        continue
    # 去掉 run 级加粗/字号/字体，让它们继承 Heading 样式
    for r in p.runs:
        r.font.bold = None
        r.font.size = None
        r.font.name = None
    # 移除显式 outlineLvl（Heading 样式自带 outline level）
    pPr.remove(ol)
    fixed += 1

doc.save(path)
print(f'已修正 {fixed} 个标题段落的样式为 Heading')
