# -*- coding: utf-8 -*-
"""对比附件(-新版, 用户基线)与当前正式文件(58页)的段落文本差异：
1. 找出正式文件相对附件新增的段落（预期=三个新章节+补强段落）
2. 找出附件中存在但正式文件没有的段落（若非空 => 用户手改过，需合并）
"""
import zipfile, re, sys
from difflib import unified_diff

def para_texts(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    # 提取每个 <w:p> 的拼接文本
    paras = []
    for m in re.finditer(r'<w:p[ >].*?</w:p>', xml, re.S):
        pxml = m.group(0)
        texts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', pxml)
        t = ''.join(texts).strip()
        if t:
            paras.append(t)
    return paras

ATT = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\众云信息科技回收综合服务平台V1.0-说明书-新版.docx'
CUR = r'D:\\maintain\\软著申报材料\\回收综合服务平台V1.0\\_gen\\manual_build.docx'

a = para_texts(ATT)
c = para_texts(CUR)
print(f'附件段落数: {len(a)}  正式文件段落数: {len(c)}')

sa, sc = set(a), set(c)
only_cur = [t for t in c if t not in sa]     # 正式文件新增
only_att = [t for t in a if t not in sc]     # 附件独有（用户改动 or 版本差异）

print(f'\n=== 正式文件相对附件新增的段落（前12条，预期为新章节内容） ===')
for t in only_cur[:12]:
    print('+', t[:60])
print(f'(共 {len(only_cur)} 条)')

print(f'\n=== 附件有而正式文件没有的段落（若非空=用户手动改过，需合并） ===')
for t in only_att:
    print('-', t[:80])
print(f'(共 {len(only_att)} 条)')

# 顺序性检查：附件段落是否按原顺序出现在正式文件中（证明是同源追加）
idx = -1
ordered = True
for t in a:
    try:
        j = c.index(t, idx + 1)
        idx = j
    except ValueError:
        ordered = False
        print('顺序中断于:', t[:50])
        break
print('附件内容是否完整按序包含于正式文件:', ordered)
