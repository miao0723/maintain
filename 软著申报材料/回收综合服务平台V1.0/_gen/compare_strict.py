# -*- coding: utf-8 -*-
"""严格校验：剔除目录页码后，附件正文是否与最新构建正文完全一致"""
import zipfile, re

def para_texts(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    paras = []
    for m in re.finditer(r'<w:p[ >].*?</w:p>', xml, re.S):
        texts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', m.group(0))
        t = ''.join(texts).strip()
        if t:
            paras.append(t)
    return paras

ATT = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\众云信息科技回收综合服务平台V1.0-说明书-新版.docx'
CUR = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\manual_build.docx'

a, c = para_texts(ATT), para_texts(CUR)
# 目录占位条目特征：以数字结尾且含章节号前缀（x. 或 第x章）
strip_page = lambda t: re.sub(r'\d+$', '', t) if re.match(r'^(\d+\.\d*|第.章)', t) and t != 'V1.0' else t
sa = [strip_page(t) for t in a]
sc = [strip_page(t) for t in c]

only_att = [t for t in sa if t not in set(sc)]
print('剔除页码后附件独有段落数（应为 0 = 用户无手改）:', len(only_att))
for t in only_att[:10]:
    print('-', t[:60])

idx = -1
ordered = True
for t in sa:
    try:
        idx = sc.index(t, idx + 1)
    except ValueError:
        ordered = False
        print('顺序中断:', t[:50])
        break
print('附件（去页码）完整按序包含于最新构建:', ordered)
