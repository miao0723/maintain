# -*- coding: utf-8 -*-
"""统计回收平台各模块源程序行数"""
import os

ROOT = r'D:\maintain'
GROUPS = [
    ('管理后台服务端（Node.js + Express）', [
        'recycle-admin/server/server.js',
        'recycle-admin/server/database.js',
        'recycle-admin/server/middleware/auth.js',
        'recycle-admin/server/utils/oplog.js',
    ] + sum([[os.path.join(dp, f).replace('\\', '/') for f in fs if f.endswith('.js')]
             for dp, _, fs in os.walk(os.path.join(ROOT, 'recycle-admin/server/routes'))], [])),
    ('管理后台前端（Vue3 + Element Plus）', None),
    ('小程序回收模块（含样式与页面结构）', None),
    ('小程序服务端回收接口（含AI估价）', ['小程序2.0/backend/routes/recycleRoutes.js']),
]
WEB = [os.path.join(dp, f).replace('\\', '/')
       for dp, _, fs in os.walk(os.path.join(ROOT, 'recycle-admin/web/src'))
       for f in fs if f.endswith(('.js', '.vue'))]
MP = [os.path.join(dp, f).replace('\\', '/')
      for dp, _, fs in os.walk(os.path.join(ROOT, '小程序2.0/pages/recycle'))
      for f in fs if not f.endswith(('.webp', '.md'))]
MP += ['小程序2.0/utils/recycleCatalog.js', '小程序2.0/utils/recycleData.js']

GROUPS[1] = ('管理后台前端（Vue3 + Element Plus）', sorted(WEB))
GROUPS[2] = ('小程序回收模块（含样式与页面结构）', sorted(MP))

total = 0
for name, files in GROUPS:
    n = files_cnt = 0
    for rel in files:
        fp = os.path.join(ROOT, rel)
        if not os.path.exists(fp):
            continue
        with open(fp, 'r', encoding='utf-8-sig', errors='replace') as f:
            lines = sum(1 for _ in f)
        n += lines
        files_cnt += 1
    total += n
    print(f'{name}\t{files_cnt}\t{n}')
print(f'合计\t\t{total}')
