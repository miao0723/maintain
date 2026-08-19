# -*- coding: utf-8 -*-
"""生成最终标题样式化 ranges（排除第五章旧内容 5.1~5.15）"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

h = json.load(open(r'D:/maintain/小程序2.0/软著材料/_gen/_headings.json', encoding='utf-8'))

# 第五章旧内容范围（5.1 标题 begin=7566 到 第六章标题 begin=10932）
CH5_OLD_START = 7566
CH5_OLD_END = 10932

def in_ch5_old(r):
    return CH5_OLD_START <= r['begin'] < CH5_OLD_END

# 过滤 h2（排除第五章旧节标题）
h2_filtered = [r for r in h['h2'] if not in_ch5_old(r)]

final = {
    'title': h['title'],
    'subtitle': h['subtitle'],
    'h1': h['h1'],
    'h2': h2_filtered,
    'h3': h['h3'],
}
open(r'D:/maintain/小程序2.0/软著材料/_gen/_final_ranges.json', 'w', encoding='utf-8').write(
    json.dumps(final, ensure_ascii=False))
print("title:", len(final['title']))
print("subtitle:", len(final['subtitle']))
print("h1:", len(final['h1']))
print("h2 (过滤后):", len(final['h2']))
print("h3:", len(final['h3']))
print("--- 各组的 JSON（供调用）---")
for k in ['title','subtitle','h1','h2','h3']:
    print(f"{k}=" + json.dumps(final[k], ensure_ascii=False))
