# -*- coding: utf-8 -*-
"""docx -> PDF（Word COM，含域更新）-> PNG 页图（PyMuPDF）"""
import sys, os
import pymupdf

docx = sys.argv[1]
pdf = sys.argv[2]
outdir = sys.argv[3]
dpi = int(sys.argv[4]) if len(sys.argv) > 4 else 110

# 1) Word COM 转换（自动更新目录域）
import win32com.client  # 需要 pywin32
word = win32com.client.DispatchEx('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
try:
    d = word.Documents.Open(docx, ReadOnly=False)
    try:
        for toc in d.TablesOfContents:
            toc.Update()
    except Exception as e:
        print('toc update skip:', e)
    d.ExportAsFixedFormat(pdf, 17)  # 17 = wdExportFormatPDF
    d.Close(False)
finally:
    word.Quit()

# 2) PDF -> PNG
doc = pymupdf.open(pdf)
os.makedirs(outdir, exist_ok=True)
pages = []
for i, page in enumerate(doc, 1):
    pix = page.get_pixmap(dpi=dpi)
    out = os.path.join(outdir, f'p{i:02d}.png')
    pix.save(out)
    pages.append(out)
print(f'RENDER_OK pages={len(doc)}')
print('\n'.join(pages))
