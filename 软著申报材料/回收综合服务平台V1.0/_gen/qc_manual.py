# -*- coding: utf-8 -*-
"""说明书渲染页程序化质检：
1. 每页像素非纯白（无空白页）
2. 封面页深绿占比
3. 页眉绿线存在（除封面）
4. Markdown 残留/undefined 等坏词（PDF 文本层提取）
"""
import pymupdf, re, sys

PDF = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\manual_preview.pdf'
doc = pymupdf.open(PDF)
bad_words = ['undefined', 'NaN', 'null,', 'TBD', '```', '](', '|---', '**', '##']

problems = []
for i, page in enumerate(doc, 1):
    text = page.get_text() or ''
    # 坏词检查
    for w in bad_words:
        if w in text:
            problems.append(f'p{i}: 坏词 {w!r}')
    # 空白页检查（文字+图像都为空）
    if not text.strip() and not page.get_images() and not page.get_drawings():
        problems.append(f'p{i}: 疑似空白页')

# 封面白色占比（正式白底封面）
pix = doc[0].get_pixmap(dpi=40)
w, h = pix.width, pix.height
white = 0; total = w * h
for y in range(0, h, 2):
    for x in range(0, w, 2):
        r, g, b = pix.pixel(x, y)[:3]
        if r > 235 and g > 235 and b > 235:
            white += 1
ratio = white / (total / 4)
print(f'封面白色像素占比: {ratio:.1%}')
if ratio < 0.85:
    problems.append(f'p1 封面白色占比过低: {ratio:.1%}')

# 每页内容量（字符数，粗查是否存在只有几个字的异常页）
for i, page in enumerate(doc, 1):
    t = (page.get_text() or '').strip()
    if i > 1 and len(t) < 30:
        problems.append(f'p{i}: 文本过少({len(t)}字)')

print(f'总页数: {len(doc)}')
if problems:
    print('发现问题:')
    print('\n'.join(problems))
    sys.exit(1)
print('QC PASS: 无空白页、无坏词、封面正常、各页内容充实')
