# -*- coding: utf-8 -*-
"""用 python-docx 在"目录"标题后插入自动 TOC 域（显示 1~4 级）"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

path = r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.docx'
doc = docx.Document(path)

paras = doc.paragraphs

# 1. 定位"目录"标题段落
toc_idx = None
for i, p in enumerate(paras):
    if p.text.strip() == '目录':
        toc_idx = i
        break
assert toc_idx is not None, '未找到目录标题'
print(f'目录标题位于段落 {toc_idx}，style={paras[toc_idx].style.name!r}')

# 2. 定位正文第一个"第一章"标题（Heading 样式）
body_idx = None
for i in range(toc_idx + 1, len(paras)):
    p = paras[i]
    sn = (p.style.name or '').lower()
    if 'heading' in sn and p.text.strip().startswith('第一章'):
        body_idx = i
        break
assert body_idx is not None, '未找到正文第一章'
print(f'正文第一章位于段落 {body_idx}，文本={paras[body_idx].text.strip()!r}')

# 3. 删除手写目录条目（toc_idx+1 ~ body_idx-1）
# 从后往前删，收集要删除的元素
to_delete = [paras[i]._element for i in range(toc_idx + 1, body_idx)]
for el in to_delete:
    el.getparent().remove(el)
print(f'已删除 {len(to_delete)} 个手写目录条目段落')

# 4. 在"目录"标题后插入 TOC 域段落
toc_title_el = paras[toc_idx]._element

new_p = OxmlElement('w:p')
toc_title_el.addnext(new_p)

run = OxmlElement('w:r')
# 字段开始
fld_begin = OxmlElement('w:fldChar')
fld_begin.set(qn('w:fldCharType'), 'begin')
instr = OxmlElement('w:instrText')
instr.set(qn('xml:space'), 'preserve')
instr.text = 'TOC \\o "1-4" \\h \\z \\u'
fld_sep = OxmlElement('w:fldChar')
fld_sep.set(qn('w:fldCharType'), 'separate')
t = OxmlElement('w:t')
t.text = '（请在 Word 中全选后按 F9，或右键选择“更新域”以自动生成目录）'
fld_end = OxmlElement('w:fldChar')
fld_end.set(qn('w:fldCharType'), 'end')

run.append(fld_begin)
run.append(instr)
run.append(fld_sep)
run.append(t)
run.append(fld_end)
new_p.append(run)
print('已插入 TOC 域段落')

doc.save(path)
print('保存成功:', path)
