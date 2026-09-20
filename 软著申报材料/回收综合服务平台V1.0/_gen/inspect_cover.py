# -*- coding: utf-8 -*-
"""检查封面区（第一个分节符之前）各段落的行距/字号状态"""
import re
import zipfile

doc = zipfile.ZipFile(r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\attached_copy.docx').read('word/document.xml').decode('utf-8')

# 第一个 sectPr 之前的内容即封面节
first_sect = doc.find('<w:sectPr')
cover = doc[:first_sect]
print('封面区长度:', len(cover))

for m in re.finditer(r'<w:p[ >].*?</w:p>', cover, re.S):
    frag = m.group(0)
    text = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', frag))
    sp = re.search(r'<w:spacing[^>]*/>', frag)
    szs = re.findall(r'<w:sz w:val="(\d+)"/>', frag)
    print(f'text={text[:26]!r:30} spacing={sp.group(0) if sp else None} sz={sorted(set(szs))}')
