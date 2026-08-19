import sys
sys.stdout.reconfigure(encoding='utf-8')
import docx
d = docx.Document(r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.NEW.docx')
paras = d.paragraphs
# 定位第五章和第六章
in5 = False
start = end = None
for i, p in enumerate(paras):
    t = p.text.strip()
    if t.startswith('第五章') and p.style.name == 'Heading 1':
        in5 = True; start = i
    elif t.startswith('第六章') and p.style.name == 'Heading 1':
        in5 = False; end = i
print(f'第五章范围: [{start}] ~ [{end}]')
# 打印第五章所有标题
print('=== 第五章标题结构 ===')
for i in range(start, end):
    p = paras[i]
    sn = p.style.name
    if sn.startswith('Heading'):
        t = p.text.strip()
        lvl = sn.replace('Heading ','')
        print(f'  H{lvl} [{i}] {t}')
# 检查每个H4标题下方的正文内容量
print()
print('=== H4下正文内容抽样 ===')
for i in range(start+1, end):
    p = paras[i]
    if p.style.name == 'Heading 4':
        # 统计其后正文段落数直到下一个标题
        body_count = 0; body_chars = 0
        for j in range(i+1, end):
            if paras[j].style.name.startswith('Heading'):
                break
            body_count += 1
            body_chars += len(paras[j].text.strip())
        print(f'  {p.text.strip()[:30]} | 正文段数={body_count}, 字符={body_chars}')
