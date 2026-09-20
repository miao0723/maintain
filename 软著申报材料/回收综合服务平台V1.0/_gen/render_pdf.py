# -*- coding: utf-8 -*-
"""PDF -> PNG 页图"""
import sys, os
import pymupdf

pdf = sys.argv[1]
outdir = sys.argv[2]
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 100

doc = pymupdf.open(pdf)
os.makedirs(outdir, exist_ok=True)
for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(dpi=dpi)
    pix.save(os.path.join(outdir, f'p{i:02d}.png'))
print(f'RENDER_OK pages={len(doc)} -> {outdir}')
