# -*- coding: utf-8 -*-
"""批量设置标题样式：title/subtitle/h1/h2/h3"""
import json, subprocess, sys, os
sys.stdout.reconfigure(encoding='utf-8')

SKILL_DIR = r'D:/工具/WorkBuddy/resources/app.asar.unpacked/resources/builtin-skills/tencent-local-office-edit'
PY = r'C:/Users/Administrator/.workbuddy/binaries/python/versions/3.13.12/python.exe'
FILE_ID = 'b60bf666-f99c-4830-8d40-fc29a2ba695a'

final = json.load(open(r'D:/maintain/小程序2.0/软著材料/_gen/_final_ranges.json', encoding='utf-8'))

mapping = [
    ('title', 11),
    ('subtitle', 12),
    ('h1', 1),
    ('h2', 2),
    ('h3', 3),
]

for key, lvl in mapping:
    ranges = final[key]
    if not ranges:
        print(f'[{key}] 无条目，跳过')
        continue
    payload = json.dumps({'ranges': ranges, 'heading_lvl': lvl}, ensure_ascii=False)
    cmd = [PY, 'edsdk.py', 'call', 'doc_modify_paragraph',
           f'file_id={FILE_ID}', '--json', payload]
    r = subprocess.run(cmd, cwd=SKILL_DIR, capture_output=True, text=True, encoding='utf-8')
    out = (r.stdout or '').strip()
    err = (r.stderr or '').strip()
    ok = 'error' not in out.lower() and 'fail' not in out.lower() and r.returncode == 0
    print(f'[{key}] heading_lvl={lvl} 条目数={len(ranges)} -> {"OK" if ok else "FAIL"}')
    if not ok:
        print('  stdout:', out[:500])
        print('  stderr:', err[:500])
    else:
        # 打印简要结果
        print('  ', out[:200])
