# -*- coding: utf-8 -*-
"""分析说明书结构，分类标题，输出标题坐标分组"""
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')

d = json.load(open(r'D:/maintain/小程序2.0/软著材料/_gen/_structure.json', encoding='utf-8'))
nodes = d['nodes']

# 提取节点信息
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

# 打印全文标题候选（含坐标），方便核对
print("=== 全部非空段落（type 非 Table） ===")
for p in paras:
    if p['type'] == 'Table':
        print(f"[{p['pi']}] TABLE start={p['start']} end={p['end']}")
        continue
    t = p['text']
    if t:
        print(f"[{p['pi']}] start={p['start']} end={p['end']} | {t[:50]}")
