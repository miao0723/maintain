# -*- coding: utf-8 -*-
"""页码域后处理（WPS 兼容）：
1. 移除封面节的空 <w:pgNumType/>
2. 目录节页脚 PAGE 域补 \\* ROMAN，正文节补 \\* arabic
"""
import re, shutil, sys, zipfile, os

DOCX = sys.argv[1] if len(sys.argv) > 1 else r'D:\maintain\软著申报材料\回收综合服务平台V1.0\众云信息科技回收综合服务平台V1.0-说明书.docx'
TMP = DOCX + '.tmp.zip'

with zipfile.ZipFile(DOCX, 'r') as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

doc = files['word/document.xml'].decode('utf-8')

# 1. 移除空 pgNumType（docx-js 对未设置页码的节也会输出空标记）
before = doc.count('<w:pgNumType/>')
doc = doc.replace('<w:pgNumType/>', '')
print(f'removed empty pgNumType: {before}')

# 2. 找到各节的 footerReference 顺序（sectPr 按文档顺序出现）
sectprs = re.findall(r'<w:sectPr[^>]*>.*?</w:sectPr>', doc, re.S)
print(f'sections found: {len(sectprs)}')
rels = files['word/_rels/document.xml.rels'].decode('utf-8')
rid2file = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="(footer\d+\.xml)"', rels))

footer_fmt = {}  # footer file -> roman/arabic
for i, sp in enumerate(sectprs, 1):
    m = re.search(r'<w:footerReference[^>]*w:type="default"[^>]*r:id="(rId\d+)"', sp) or \
        re.search(r'<w:footerReference[^>]*r:id="(rId\d+)"[^>]*w:type="default"', sp)
    if not m:
        continue
    f = rid2file.get(m.group(1))
    if not f:
        continue
    fmt = 'ROMAN' if 'upperRoman' in sp else ('arabic' if ('w:fmt="decimal"' in sp or 'decimal' in sp) else None)
    footer_fmt['word/' + f] = fmt
    print(f'section {i}: footer={f} fmt={fmt}')

for fname, fmt in footer_fmt.items():
    if not fmt or fname not in files:
        continue
    xml = files[fname].decode('utf-8')
    patched = re.sub(
        r'(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)',
        lambda m2: m2.group(1) + f' PAGE \\* {fmt} \\* MERGEFORMAT ' + m2.group(2),
        xml)
    if patched != xml:
        files[fname] = patched.encode('utf-8')
        print(f'patched {fname} -> PAGE \\* {fmt}')

files['word/document.xml'] = doc.encode('utf-8')

with zipfile.ZipFile(TMP, 'w', zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])
shutil.move(TMP, DOCX)
print('OK pagenum patched')
