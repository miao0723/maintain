# -*- coding: utf-8 -*-
"""分类所有标题，输出坐标分组 JSON"""
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

d = json.load(open(r'D:/maintain/小程序2.0/软著材料/_gen/_structure.json', encoding='utf-8'))
nodes = d['nodes']

paras = []
for n in nodes:
    txt = n.get('text') or n.get('text_preview') or ''
    if isinstance(txt, list):
        txt = ''.join(x.get('text', '') if isinstance(x, dict) else str(x) for x in txt)
    paras.append({
        'pi': n.get('paragraph_index'),
        'type': n.get('type'),
        'start': n.get('start_index'),
        'end': n.get('end_index'),
        'text': txt.strip(),
    })

def rng(p):
    return {'begin': p['start'], 'end': p['end']}

title_ranges = []
subtitle_ranges = []
h1_ranges = []  # 修订记录/目录 + 正文章标题
h2_ranges = []
h3_ranges = []
h4_ranges = []

# 正则
re_chapter = re.compile(r'^第[一二三四五六七八九十百]+章\s')
re_h4 = re.compile(r'^\d+\.\d+\.\d+\.\d+\s')
re_h3 = re.compile(r'^\d+\.\d+\.\d+\s')
re_h2 = re.compile(r'^\d+\.\d+\s')

# 目录区：目录标题(节点23)之后到正文第一章(节点40)之前。用 start 范围判定。
# 目录标题 start=297, 正文第一章 start=464
TOC_START = 297
BODY_START = 464

for p in paras:
    t = p['text']
    if not t or p['type'] == 'Table':
        continue
    s = p['start']
    # 封面主/副标题
    if t == '电子维修服务管理系统':
        title_ranges.append(rng(p))
        continue
    if t == '详细设计说明书':
        subtitle_ranges.append(rng(p))
        continue
    # 修订记录标题（封面后，节点20 start=93）和 目录标题（节点23 start=297）
    if t == '修订记录' and s < TOC_START:
        h1_ranges.append(rng(p))
        continue
    if t == '目录':
        h1_ranges.append(rng(p))
        continue
    # 目录条目区跳过（TOC_START <= s < BODY_START，且是章标题文本）
    if TOC_START < s < BODY_START:
        continue
    # 正文标题
    if re_chapter.match(t):
        h1_ranges.append(rng(p))
    elif re_h4.match(t):
        h4_ranges.append(rng(p))
    elif re_h3.match(t):
        h3_ranges.append(rng(p))
    elif re_h2.match(t):
        h2_ranges.append(rng(p))

result = {
    'title': title_ranges,
    'subtitle': subtitle_ranges,
    'h1': h1_ranges,
    'h2': h2_ranges,
    'h3': h3_ranges,
    'h4': h4_ranges,
    'counts': {
        'title': len(title_ranges),
        'subtitle': len(subtitle_ranges),
        'h1': len(h1_ranges),
        'h2': len(h2_ranges),
        'h3': len(h3_ranges),
        'h4': len(h4_ranges),
    }
}

out = json.dumps(result, ensure_ascii=False, indent=2)
open(r'D:/maintain/小程序2.0/软著材料/_gen/_headings.json', 'w', encoding='utf-8').write(out)
print(out)
