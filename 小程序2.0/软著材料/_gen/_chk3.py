# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import docx
d = docx.Document(r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.NEW.docx')
# 完整打印 74 75 内容
for i in [74, 75]:
    p = d.paragraphs[i]
    print(f'=== 段[{i}] 全文 (len={len(p.text)}) ===')
    print(p.text)
    print()
