# -*- coding: utf-8 -*-
"""封面修复（仅封面节，其余零改动）：
标题两行 26pt 黑体被 WPS 压进固定22磅行高导致裁字——
改为最小行高 700tw(35pt) + 3pt 字距；软件说明书行高 620；V1.0 恢复16磅。
"""
import re
import sys
import zipfile

SRC = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\attached_copy.docx'
DST = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\_gen\manual_cover_fixed.docx'

with zipfile.ZipFile(SRC) as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

doc = files['word/document.xml'].decode('utf-8')
cover_end = doc.find('<w:sectPr')
cover = doc[:cover_end]


def set_line(frag, line, rule='atLeast'):
    return re.sub(r'(<w:spacing[^>]*w:line=")\d+("[^>]*w:lineRule=")\w+(")',
                  lambda m: m.group(1) + str(line) + m.group(2) + rule + m.group(3),
                  frag, count=1)


def set_after(frag, val, old):
    return frag.replace(f'w:after="{old}"', f'w:after="{val}"', 1)


def add_charspacing(frag):
    """运行级字距 3pt，插在首个 <w:sz 之前（仅当该段 rPr 无 w:spacing）"""
    if re.search(r'<w:rPr>(?:(?!</w:rPr>).)*?<w:spacing', frag, re.S):
        return frag
    return frag.replace('<w:sz w:val="52"/>', '<w:spacing w:val="60"/><w:sz w:val="52"/>', 1)


def set_sz(frag, old, new):
    frag = frag.replace(f'<w:sz w:val="{old}"/>', f'<w:sz w:val="{new}"/>')
    frag = frag.replace(f'<w:szCs w:val="{old}"/>', f'<w:szCs w:val="{new}"/>')
    return frag


patched = {'l1': False, 'l2': False, 'sub': False, 'dt': False}
out, pos = [], 0
for m in re.finditer(r'<w:p[ >].*?</w:p>', cover, re.S):
    frag = m.group(0)
    text = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', frag))
    if text == '众云信息科技' and not patched['l1']:
        frag = set_line(frag, 700)
        frag = set_after(frag, 220, 120)
        frag = add_charspacing(frag)
        patched['l1'] = True
    elif text == '电子产品回收综合服务平台' and not patched['l2']:
        frag = set_line(frag, 700)
        frag = set_after(frag, 420, 300)
        frag = add_charspacing(frag)
        patched['l2'] = True
    elif text == 'V1.0' and 'w:after="200"' in frag and not patched['sub']:
        frag = set_sz(frag, 24, 32)
        frag = set_line(frag, 480)
        patched['sub'] = True
    elif text == '软 件 说 明 书' and not patched['dt']:
        frag = set_line(frag, 620)
        patched['dt'] = True
    out.append(doc[pos:m.start()])
    out.append(frag)
    pos = m.end()
out.append(doc[pos:])

if not all(patched.values()):
    print('定位失败:', patched)
    sys.exit(1)

new_doc = ''.join(out)
files['word/document.xml'] = new_doc.encode('utf-8')

with zipfile.ZipFile(DST, 'w', zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])

# 校验：文本与媒体零变化
with zipfile.ZipFile(SRC) as z1, zipfile.ZipFile(DST) as z2:
    t1 = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', z1.read('word/document.xml').decode('utf-8')))
    t2 = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', z2.read('word/document.xml').decode('utf-8')))
    assert t1 == t2, '文本内容意外变化！'
    assert z1.namelist() == z2.namelist(), '文件清单变化！'
    imgs = [n for n in z1.namelist() if n.startswith('word/media/') and not n.endswith('/')]
    assert all(z1.read(n) == z2.read(n) for n in imgs), '图片变化！'
    # 正文区（封面节之后）字节级一致
    d1 = z1.read('word/document.xml').decode('utf-8')
    d2 = z2.read('word/document.xml').decode('utf-8')
    assert d1[cover_end:] == d2[d2.find('<w:sectPr'):]
    print(f'校验通过：文本一致、{len(imgs)}张截图完整、正文区字节级零改动')
print('封面修复完成 ->', DST)
