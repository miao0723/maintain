# -*- coding: utf-8 -*-
"""验证正文行距（应约 22pt）并定位新增章节"""
import pymupdf
from collections import Counter

doc = pymupdf.open(r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\manual_preview.pdf')

# 正文页（跳过封面/目录，取第 8 页附近的纯正文页）
for pno in (7, 8):
    page = doc[pno]
    ys = set()
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            ys.add(round(l['bbox'][1], 1))
    ys = sorted(ys)
    deltas = Counter(round(ys[i + 1] - ys[i]) for i in range(len(ys) - 1))
    print(f'第{pno + 1}页 行基线间距分布(pt):', dict(deltas.most_common(5)))

markers = ['2.6 关键技术设计与实现', '5.3 小程序端关键实现机制', '6.11 后台关键实现机制', '第八章']
for m in markers:
    pages = [i + 1 for i in range(len(doc)) if m in (doc[i].get_text() or '')]
    print(m, '->', pages[:3])
print('总页数:', len(doc))
