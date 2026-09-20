# -*- coding: utf-8 -*-
"""逐段对比附件副本与构建产物，定位实质差异"""
import zipfile, re

def para_texts(path):
    xml = zipfile.ZipFile(path).read('word/document.xml').decode('utf-8')
    paras = []
    for m in re.finditer(r'<w:p[ >].*?</w:p>', xml, re.S):
        t = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0)))
        if t.strip():
            paras.append(t.strip())
    return paras

A = para_texts(r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\attached_copy.docx')
B = para_texts(r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\manual_build.docx')
print(f'附件段落数 {len(A)}  构建段落数 {len(B)}')

sa, sb = set(A), set(B)
only_a = [t for t in A if t not in sb]
only_b = [t for t in B if t not in sa]
print(f'\n仅附件有 {len(only_a)} 段（前12条）:')
for t in only_a[:12]:
    print('  +', t[:70])
print(f'\n仅构建有 {len(only_b)} 段（前12条）:')
for t in only_b[:12]:
    print('  -', t[:70])

# 顺序包含检查
idx = -1
ordered = True
for t in B:
    try:
        idx = A.index(t, idx + 1)
    except ValueError:
        ordered = False
        print('\n顺序中断于:', t[:50])
        break
print('构建内容完整按序包含于附件:', ordered)

# 媒体文件检查（用户是否插了图）
za = zipfile.ZipFile(r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\attached_copy.docx')
zb = zipfile.ZipFile(r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\manual_build.docx')
ma = [n for n in za.namelist() if n.startswith('word/media/')]
mb = [n for n in zb.namelist() if n.startswith('word/media/')]
print('附件 media:', ma)
print('构建 media:', mb)
