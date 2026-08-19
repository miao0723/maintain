# -*- coding: utf-8 -*-
"""
Part4：目录替换为自动 TOC 域（显示 1~4 级）
删除 [28..41] 旧手写章级目录，在[27]目录标题后插入 TOC field
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.enum.text import WD_ALIGN_PARAGRAPH

SRC = r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.NEW.docx'
doc = docx.Document(SRC)
body = doc.element.body
paras = doc.paragraphs

# 定位目录标题[27] = '目录'
toc_title = None
for i, p in enumerate(paras):
    if i >= 27 and p.text.strip() == '目录' and p.style.name == 'Normal':
        toc_title = p._element
        break
assert toc_title is not None, '未找到目录标题'
print('目录标题定位成功')

# 删除其后的旧目录条目（第一章~第十四章的手写目录，共14段）
# 一直删到遇到'修订记录'或非目录内容
del_list = []
el = toc_title.getnext()
guard = 0
while el is not None and guard < 30:
    guard += 1
    if el.tag == qn('w:p'):
        txt = ''.join(t.text or '' for t in el.iter(qn('w:t'))).strip()
        # 目录条目：'第X章' 或 数字章节
        if re.match(r'^第[一二三四五六七八九十]+章\s', txt) and len(txt) < 40:
            del_list.append(el)
            el = el.getnext()
            continue
        if re.match(r'^\d+\.\d+', txt) and len(txt) < 50:
            del_list.append(el)
            el = el.getnext()
            continue
        if txt == '修订记录' or txt == '':
            # 检查是否分页符
            break
        if txt.startswith('第') or txt == '目录':
            break
        # 遇到其他内容停止
        break
    else:
        break
print(f'待删除旧目录条目: {len(del_list)}')
for el in del_list:
    body.remove(el)

# 插入 TOC 域（在原目录标题后）
# 使用 TOC 域，1~4级
def insert_toc_field(after_el):
    run_p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    pStyle = OxmlElement('w:pStyle'); pStyle.set(qn('w:val'), 'toc 1')
    pPr.append(pStyle)
    run_p.append(pPr)

    # 段落1：TOC 域开头段落（fldChar begin + instrText TOC）
    n_paras = []
    # 生成单段 TOC 域（多行需要多个 r 拼在一个段，但 Word 目录一整段）
    p_fld = OxmlElement('w:p')
    p_fld_pr = OxmlElement('w:pPr')
    fld_style = OxmlElement('w:pStyle'); fld_style.set(qn('w:val'), 'toc 1')
    p_fld_pr.append(fld_style)
    p_fld.append(p_fld_pr)

    r_begin = OxmlElement('w:r')
    fc_b = OxmlElement('w:fldChar'); fc_b.set(qn('w:fldCharType'), 'begin'); rs_b = OxmlElement('w:rPr')
    # 隐藏域代码
    r_begin.append(rs_b); r_begin.append(fc_b)
    p_fld.append(r_begin)

    r_instr = OxmlElement('w:r')
    rs_i = OxmlElement('w:rPr')
    rs_i.append(docx_rPr_hidden())
    r_instr.append(rs_i)
    instr = OxmlElement('w:instrText')
    instr.set(qn('xml:space'), 'preserve')
    instr.text = ' TOC \\o "1-4" \\h \\z \\u '
    r_instr.append(instr)
    p_fld.append(r_instr)

    r_sep = OxmlElement('w:r')
    fc_s = OxmlElement('w:fldChar'); fc_s.set(qn('w:fldCharType'), 'separate')
    r_sep.append(fc_s)
    p_fld.append(r_sep)

    # 占位文本（提示更新域）
    r_txt = OxmlElement('w:r')
    t = OxmlElement('w:t'); t.text = '请在 Word 中按 F9 或右键更新域以生成目录'
    r_txt.append(t)
    p_fld.append(r_txt)

    r_end = OxmlElement('w:r')
    fc_e = OxmlElement('w:fldChar'); fc_e.set(qn('w:fldCharType'), 'end')
    r_end.append(fc_e)
    p_fld.append(r_end)

    after_el.addnext(p_fld)

def docx_rPr_hidden():
    rPr = OxmlElement('w:rPr')
    # 常规显示即可，不需要隐藏
    return rPr

insert_toc_field(toc_title)
print('TOC 域已插入')
doc.save(SRC)
print('Part4 保存完成')
