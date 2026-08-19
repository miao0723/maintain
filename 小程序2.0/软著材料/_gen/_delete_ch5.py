# -*- coding: utf-8 -*-
"""从后往前删除第五章旧段落（paragraph_index 145~195）"""
import json, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

SKILL_DIR = r'D:/工具/WorkBuddy/resources/app.asar.unpacked/resources/builtin-skills/tencent-local-office-edit'
PY = r'C:/Users/Administrator/.workbuddy/binaries/python/versions/3.13.12/python.exe'
FILE_ID = 'b60bf666-f99c-4830-8d40-fc29a2ba695a'

d = json.load(open(r'D:/maintain/小程序2.0/软著材料/_gen/_structure.json', encoding='utf-8'))
nodes = d['nodes']

# 提取 paragraph_index 145~195 的 start_index，从后往前排序
targets = [(n['start_index'], n.get('paragraph_index')) for n in nodes
           if 145 <= n.get('paragraph_index', 0) <= 195]
targets.sort(reverse=True)  # 从后往前

print(f'待删除段落数：{len(targets)}')

for i, (idx, pi) in enumerate(targets, 1):
    r = subprocess.run(
        [PY, 'edsdk.py', 'call', 'doc_delete_paragraph', f'file_id={FILE_ID}', f'idx={idx}'],
        cwd=SKILL_DIR, capture_output=True, text=True, encoding='utf-8')
    out = (r.stdout or '').strip()
    err = (r.stderr or '').strip()
    ok = r.returncode == 0 and 'error' not in out.lower()
    if not ok:
        print(f'[{i}/{len(targets)}] 删除 idx={idx} (pi={pi}) 失败')
        print('  stdout:', out[:300])
        print('  stderr:', err[:300])
        # 失败则中止，避免继续破坏
        sys.exit(1)
    if i % 10 == 0 or i == len(targets):
        print(f'[{i}/{len(targets)}] 已删除 ... (最后 idx={idx}, pi={pi})')

print('全部删除完成')
