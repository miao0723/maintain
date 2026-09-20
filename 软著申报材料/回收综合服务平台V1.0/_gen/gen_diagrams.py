# -*- coding: utf-8 -*-
"""软著说明书配图生成：架构图/流程图/状态机/ER图/鉴权链路（黑白正式风格）"""
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Polygon, FancyArrowPatch
from matplotlib.font_manager import FontProperties

FP = FontProperties(fname='C:/Windows/Fonts/simhei.ttf')

OUT = r'D:\maintain\软著申报材料\回收综合服务平台V1.0\图表'
os.makedirs(OUT, exist_ok=True)

INK = '#1A1A1A'
FILL = '#F5F5F5'
FILL_HEAD = '#E8E8E8'


def new_fig(w, h, title, ymin=0):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, 100)
    ax.set_ylim(ymin, 100)
    ax.axis('off')
    ax.text(50, 96.5, title, ha='center', va='center', fontsize=15, color=INK, fontproperties=FP)
    return fig, ax


def box(ax, cx, cy, w, h, text, fill=FILL, fs=9.5, rounded=True, dashed=False, lw=1.3,
        double=False, ec=INK):
    if rounded:
        ax.add_patch(FancyBboxPatch((cx - w / 2, cy - h / 2), w, h,
                                    boxstyle='round,pad=0.4,rounding_size=1.0',
                                    fc=fill, ec=ec, lw=lw, linestyle='--' if dashed else '-'))
    else:
        ax.add_patch(Rectangle((cx - w / 2, cy - h / 2), w, h, fc=fill, ec=ec, lw=lw,
                               linestyle='--' if dashed else '-'))
    if double:
        ax.add_patch(Rectangle((cx - w / 2 + 0.9, cy - h / 2 + 0.9), w - 1.8, h - 1.8,
                               fc='none', ec=ec, lw=0.9))
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs, color=INK,
            linespacing=1.4, fontproperties=FP)


def diamond(ax, cx, cy, w, h, text, fs=9):
    pts = [(cx, cy + h / 2), (cx + w / 2, cy), (cx, cy - h / 2), (cx - w / 2, cy)]
    ax.add_patch(Polygon(pts, closed=True, fc=FILL, ec=INK, lw=1.3))
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fs, color=INK,
            linespacing=1.35, fontproperties=FP)


def arr(ax, x1, y1, x2, y2, label=None, dashed=False, rad=0.0, fs=8.5,
        lab_xy=None, lab_ha='center', color=INK, lw=1.4):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>', mutation_scale=13,
                                 lw=lw, color=color,
                                 linestyle=(0, (5, 3)) if dashed else '-',
                                 connectionstyle=f'arc3,rad={rad}', shrinkA=1, shrinkB=1))
    if label:
        lx, ly = lab_xy if lab_xy else ((x1 + x2) / 2, (y1 + y2) / 2)
        ax.text(lx, ly, label, ha=lab_ha, va='center', fontsize=fs, color='#333333',
                fontproperties=FP, bbox=dict(fc='white', ec='none', alpha=0.9, pad=1.2))


def line(ax, x1, y1, x2, y2, dashed=False, lw=1.2, color=INK):
    ax.plot([x1, x2], [y1, y2], color=color, lw=lw,
            linestyle=(0, (5, 3)) if dashed else '-', solid_capstyle='butt')


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=200, bbox_inches='tight',
                facecolor='white', pad_inches=0.15)
    plt.close(fig)
    print('saved', name)


# ==================== 图A 系统总体架构图 ====================
fig, ax = new_fig(10.5, 12.5, '图A  系统总体架构图')

for cy, h, name in [(86.5, 9, '用户接入层'), (69.0, 9.5, '统一接入层'),
                    (50.0, 15.5, '业务服务层'), (26.5, 12.5, '数据层'),
                    (8.5, 10.5, '外部服务层')]:
    ax.add_patch(Rectangle((15, cy - h / 2), 83, h, fc='#FCFCFC', ec='#BBBBBB', lw=0.8))
    ax.text(7, cy, name, ha='center', va='center', fontsize=10.5, color='#444444',
            fontproperties=FP)

box(ax, 36, 86.5, 26, 6.5, '微信用户\n（小程序端）', fs=10)
box(ax, 76, 86.5, 26, 6.5, '管理员\n（Web 浏览器）', fs=10)

box(ax, 55, 69.0, 58, 7.5, 'Nginx 统一网关（HTTPS :443）', fill=FILL_HEAD, fs=11)

box(ax, 33, 50.0, 42, 13, '回收管理后台服务\nNode.js 20 + Express（:3005）\n\n认证 · 订单 · 配价库 · 平台 · 链接\n统计 · 估价配置 · 日志 · 设置', fs=9.5)
box(ax, 79, 50.0, 32, 13, '小程序服务端\nNode.js + Express（:3001）\n\n回收公开接口 · 订单写入\nAI 估价代理', fs=9.5)

box(ax, 55, 26.5, 54, 11, 'MySQL 8.0 业务数据库（共享）\nrecycle_* 平台专属表（配价 / 平台 / 系数 / 参数 / 日志）\norders · users · user_addresses 业务共享表', fs=9.5)

box(ax, 26, 8.5, 22, 7.5, '维修后台主系统\n（同域部署）', fs=9.5)
box(ax, 55, 8.5, 24, 7.5, '外部回收平台\n爱回收 / 转转 / 闲鱼等', fs=9.5)
box(ax, 84, 8.5, 22, 7.5, 'DeepSeek\n大模型接口', fs=9.5)
ax.text(55, 2.2, '（比价：小程序复制平台链接后由用户在浏览器自行访问）', ha='center',
        fontsize=8, color='#666666', fontproperties=FP)

arr(ax, 36, 83.0, 45, 73.0, '小程序请求', lab_xy=(31, 78.2), fs=8.5)
arr(ax, 76, 83.0, 67, 73.0, '后台访问', lab_xy=(81, 78.2), fs=8.5)
arr(ax, 43, 65.1, 36, 56.7, '/recycle-admin/', lab_xy=(34.0, 61.0), fs=8)
arr(ax, 67, 65.1, 74, 56.7, '/mp-api/', lab_xy=(78.0, 61.0), fs=8)
arr(ax, 33, 43.4, 44, 32.2, '读写（配价 / 订单）', lab_xy=(22, 38.0), fs=8)
arr(ax, 79, 43.4, 66, 32.2, '读配价 / 写订单', lab_xy=(89, 38.0), fs=8)
line(ax, 54, 50, 63, 50, dashed=True)
ax.text(58.5, 54.5, '以数据库为界\n读写分离协作', ha='center', va='center', fontsize=8,
        color='#555555', fontproperties=FP)
arr(ax, 31, 43.4, 26, 12.4, 'SSO 凭证校验\n（服务端对服务端）', dashed=True, rad=0.1,
    lab_xy=(19, 26.0), fs=8)
arr(ax, 82, 43.4, 84, 12.4, 'AI 估价调用\n（超时15s自动降级）', dashed=True, rad=-0.1,
    lab_xy=(93, 26.0), fs=8)

save(fig, '01-系统总体架构图.png')

# ==================== 图B 系统部署架构图 ====================
fig, ax = new_fig(11, 8.5, '图B  系统部署架构图（容器编排）')

box(ax, 22, 84, 26, 7, '用户浏览器\n（管理后台）', fs=9.5)
box(ax, 62, 84, 26, 7, '微信客户端\n（小程序）', fs=9.5)

ax.add_patch(Rectangle((3, 4), 94, 66, fc='#FFFFFF', ec='#888888', lw=1.2, linestyle='--'))
ax.text(5.5, 66.5, '宿主机', fontsize=10, color='#555555', fontproperties=FP, va='center')
ax.add_patch(Rectangle((6, 24), 88, 38, fc='#FBFBFB', ec='#999999', lw=1.0))
ax.text(8.5, 59.5, '容器网络 cmms-network', fontsize=9.5, color='#555555',
        fontproperties=FP, va='center')

box(ax, 46, 48, 42, 8.5, 'Nginx 统一网关容器\n监听 0.0.0.0:443（唯一对外端口）', fill=FILL_HEAD, fs=10)
box(ax, 24, 33.5, 32, 9.5, '回收管理后台容器\n127.0.0.1:3005（仅本机调试）', fs=9.5)
box(ax, 62, 33.5, 32, 9.5, '小程序服务端容器\n127.0.0.1:3001（仅本机调试）', fs=9.5)
box(ax, 90, 48, 12, 8, 'Redis 缓存\n127.0.0.1:6379\n（共用·仅本机）', fs=7.5)

box(ax, 26, 12, 34, 9, '宿主机 MySQL 8.0（:3306）\n容器内经 host.docker.internal 访问', fs=9.5)
box(ax, 70, 12, 34, 9, '维修后台主系统（php 容器 · 共享编排）\n提供 SSO 用户信息校验接口', fs=9)

arr(ax, 26, 80.2, 38, 52.8, 'HTTPS 443', lab_xy=(24, 66), fs=8.5)
arr(ax, 60, 80.2, 52, 52.8, 'HTTPS 443', lab_xy=(66, 66), fs=8.5)
arr(ax, 36, 44.2, 29, 38.6, '/recycle-admin/', lab_xy=(28, 41.5), fs=8)
arr(ax, 56, 44.2, 62, 38.6, '/mp-api/', lab_xy=(66, 41.5), fs=8)
arr(ax, 24, 28.7, 25.5, 16.8, '', fs=8)
ax.text(12.5, 22.5, '业务数据读写', fontsize=8.5, color='#333333', fontproperties=FP)
arr(ax, 62, 28.7, 31, 16.8, '', fs=8, rad=-0.06)
ax.text(48, 24.5, '配价读取 / 订单写入', fontsize=8.5, color='#333333', fontproperties=FP)
arr(ax, 36, 29.0, 61, 16.8, 'SSO 凭证校验（服务端）', dashed=True, rad=0.10,
    lab_xy=(52, 19.5), fs=8)
save(fig, '02-系统部署架构图.png')

# ==================== 图C 用户回收下单业务流程图 ====================
fig, ax = new_fig(9.5, 15.5, '图C  用户回收下单业务流程图', ymin=-28)

def cbox(cy, text, fs=9.5, w=52, fill=FILL, h=5.2):
    box(ax, 50, cy, w, h, text, fs=fs, fill=fill)

cbox(92, '进入小程序回收主页', fs=10.5, w=44, fill=FILL_HEAD)
arr(ax, 50, 89.3, 50, 87.7)
cbox(85, '① 本地内置配价首屏渲染（秒开 · 离线可用）')
arr(ax, 50, 82.3, 50, 80.7)
cbox(78, '② 异步加载云端配价（缓存10分钟 · 失败保持本地）')
box(ax, 27, 69, 32, 7, '③-A 分类浏览路径\n分类 → 品牌 → 型号卡片', fs=9)
box(ax, 73, 69, 32, 7, '③-B 搜索路径\n多关键词 AND / 无空格匹配', fs=9)
arr(ax, 42, 75.3, 33, 72.6)
arr(ax, 58, 75.3, 67, 72.6)
cbox(60, '④ 点击目标型号进入估价引导页', fs=10, w=46)
arr(ax, 27, 65.4, 40, 62.6)
arr(ax, 73, 65.4, 60, 62.6)
cbox(52, '⑤ 七步问答评估（成色/屏幕/功能/版本/配件/维修史/补充）')
arr(ax, 50, 49.3, 50, 47.7)
cbox(45, '⑥ 本地结算估价：基准价 × 六因子系数 × 二手基准系数')
arr(ax, 50, 42.3, 50, 38.7)
diamond(ax, 50, 34, 38, 8.5, '⑦ AI 大模型估价调用成功？', fs=9)
box(ax, 86, 34, 18, 8, '采用 AI 价格\n与估价说明', fs=9)
box(ax, 14, 34, 18, 8, '降级使用\n本地估价', fs=9)
line(ax, 69, 34, 86, 34)
arr(ax, 86, 34.1, 69.2, 34.1, '')
ax.text(77.5, 37.0, '是', fontsize=9, color='#333333', ha='center', fontproperties=FP)
line(ax, 31, 34, 14, 34)
arr(ax, 14, 34.1, 30.8, 34.1, '')
ax.text(22.5, 37.0, '否', fontsize=9, color='#333333', ha='center', fontproperties=FP)
line(ax, 86, 30, 86, 23.5)
line(ax, 14, 30, 14, 23.5)
arr(ax, 86, 23.6, 58, 21.2)
arr(ax, 14, 23.6, 42, 21.2)
cbox(18.5, '⑧ 展示估价与价格区间（点估价 90% ~ 105%）')
arr(ax, 50, 15.8, 50, 14.2)
cbox(12, '⑨ 选择 / 确认回收地址', fs=10, w=44)
arr(ax, 50, 9.3, 50, 7.7)
diamond(ax, 50, 2.6, 22, 8, '内部人员？', fs=9)
box(ax, 17, -6.5, 28, 8.5, '⑩-A 普通用户：金额确认\n弹窗（基准价对比）→ 确认提交', fs=8.5)
box(ax, 83, -6.5, 28, 8.5, '⑩-B 内部人员：选择设备来源\n（返修/仓库/固定资产）→ 免付款提交', fs=8.5)
arr(ax, 39.1, 2.6, 31.2, 2.6, '否', lab_xy=(35, 4.8), fs=9)
arr(ax, 60.9, 2.6, 68.8, 2.6, '是', lab_xy=(65, 4.8), fs=9)
line(ax, 17, -10.8, 17, -13.0)
line(ax, 83, -10.8, 83, -13.0)
line(ax, 17, -13.0, 83, -13.0)
arr(ax, 50, -13.0, 50, -14.6)
box(ax, 50, -17.6, 64, 5.2, '11. 创建回收订单（order_type = recycle · 状态：待确认）',
    fs=9.5, fill=FILL_HEAD)
arr(ax, 50, -20.3, 50, -21.9)
box(ax, 50, -25.0, 64, 5.2, '12. 转入管理后台处理：报价 → 确认 → 处理 → 完成', fs=9.5)
save(fig, '03-用户回收下单流程图.png')

# ==================== 图D 估价计算流程图 ====================
fig, ax = new_fig(13.5, 6.5, '图D  估价计算流程（本地估价引擎）')

box(ax, 4.5, 72, 7.5, 9, '型号\n基准价', fs=10, fill=FILL_HEAD)
chain = [(14.5, '× 成色\n系数'), (24.5, '× 屏幕\n系数'), (34.5, '× 功能\n系数'),
         (44.5, '× 版本\n系数'), (54.5, '× 配件\n系数'), (64.5, '× 维修史\n系数')]
for x, t in chain:
    box(ax, x, 72, 8.2, 9, t, fs=9)
box(ax, 76.5, 72, 10.5, 9.5, '× 二手基准系数\n（默认0.9·后台可调）', fs=8.5)
box(ax, 91, 72, 11, 9.5, '点估价\n（四舍五入取整）', fs=9.5, fill=FILL_HEAD)
for x1, x2 in [(8.3, 10.3), (18.6, 20.4), (28.6, 30.4), (38.6, 40.4), (48.6, 50.4), (58.6, 60.4)]:
    arr(ax, x1, 72, x2, 72)
arr(ax, 68.6, 72, 71.2, 72)
arr(ax, 81.8, 72, 85.4, 72)

box(ax, 66, 50, 21, 7.5, '区间下限\n= 点估价 × 0.9', fs=9.5)
box(ax, 66, 34, 21, 7.5, '区间上限\n= 点估价 × 1.05', fs=9.5)
arr(ax, 88, 67.0, 74, 54.0, '', rad=0.1)
line(ax, 91, 66.9, 91, 34)
arr(ax, 91, 34.2, 76.7, 34.2, '')

box(ax, 32, 42, 26, 10, '价格区间\n下限 ~ 上限（单位：元）\n随估价结果展示', fs=10, fill=FILL_HEAD)
arr(ax, 55.4, 50, 45.2, 46.5, '')
arr(ax, 55.4, 34, 45.2, 37.5, '')

box(ax, 50, 10, 88, 11, '说明：六因子系数与二手基准系数由回收后台「估价配置」在线维护，小程序估价前热更新拉取；\n品类系数用于后台估价模拟口径；AI 估价调用成功时以 AI 返回价格为准，本图为本地引擎与降级路径。',
    fs=8.8, fill='#FFFFFF', dashed=True)
save(fig, '04-估价计算流程图.png')

# ==================== 图E 回收订单状态机图 ====================
fig, ax = new_fig(12.5, 7, '图E  回收订单状态机')

ys, w, h = 62, 13.5, 9.5
states = [(12, '待确认\npending'), (28.5, '已报价\nquoted'), (45, '已确认\nconfirmed'),
          (61.5, '处理中\nprocessing'), (78, '待评价\nreview')]
edge_labels = ['报价提交', '用户确认报价', '开始处理', '验机/履约完成']
for x, t in states:
    box(ax, x, ys, w, h, t, fs=10)
box(ax, 94, ys, w, h, '已完成\ncompleted', fs=10, double=True, fill=FILL_HEAD)
for i in range(len(states) - 1):
    arr(ax, states[i][0] + w / 2 + 0.4, ys, states[i + 1][0] - w / 2 - 0.4, ys,
        edge_labels[i], lab_xy=(states[i][0] + w / 2 + 6.7, ys + 5.0), fs=8.5)
arr(ax, states[-1][0] + w / 2 + 0.4, ys, 94 - w / 2 - 0.4, ys, '交易完结',
    lab_xy=(86.5, ys + 5.0), fs=8.5)

arr(ax, 61.5, ys + h / 2 + 0.6, 93, ys + 16.5, '直接完结（可跳过待评价）',
    dashed=True, rad=-0.28, lab_xy=(77, ys + 17.0), fs=8)

cy_cancel = 26
box(ax, 53, cy_cancel, 16, 9.5, '已取消\ncancelled', fs=10, double=True, fill=FILL_HEAD)
collector_y = 40
for x, _ in states:
    line(ax, x, ys - h / 2, x, collector_y)
line(ax, states[0][0], collector_y, states[-1][0], collector_y, dashed=True)
arr(ax, 53, collector_y, 53, cy_cancel + h / 2 + 0.5,
    '后台取消（非完结态均可）· 记录取消原因', dashed=True, lab_xy=(53, 34.4), fs=8.5)

ax.text(50, 9, '终态（双框）：已完成 / 已取消 —— 不再接受报价与状态变更；已完成自动写完成时间并置进度 100%',
        ha='center', fontsize=9, color='#444444', fontproperties=FP)
save(fig, '05-回收订单状态机图.png')

# ==================== 图F 配价调价管理流程图 ====================
fig, ax = new_fig(10, 13, '图F  配价调价管理流程', ymin=-8)

box(ax, 50, 92, 34, 5.2, '运营人员发起配价调整', fill=FILL_HEAD, fs=10.5)
diamond(ax, 50, 84, 26, 8, '调整方式？', fs=9.5)

box(ax, 22, 73, 32, 6.5, '单型号调价\n录入新基准价与调价原因', fs=9)
diamond(ax, 22, 61.5, 34, 9.5, '幅度超上限？\n（|新-旧|/旧 > 20%）', fs=8.5)
box(ax, 8, 49, 15, 8.5, '返回二次确认\n（展示前后价\n格与幅度）', fs=8.5)
diamond(ax, 30, 49, 18, 8.5, '管理员\n强制确认？', fs=8.5)
box(ax, 22, 36, 26, 5.5, '更新型号基准价', fs=9.5)

box(ax, 78, 73, 32, 6.5, '批量调价\n勾选型号（支持筛选）', fs=9)
box(ax, 78, 63.5, 32, 6, '选择模式：百分比 / 固定值', fs=9)
box(ax, 78, 54, 34, 7, 'IN 查询选中型号现价\n逐型号计算新价（取整·非负）', fs=9)
box(ax, 78, 44.5, 30, 5.5, '逐型号更新基准价', fs=9.5)

arr(ax, 39, 84, 36, 76.5, '单型号', lab_xy=(38.5, 80.3), fs=8.5)
arr(ax, 61, 84, 64, 76.5, '批量', lab_xy=(62.5, 80.3), fs=8.5)
arr(ax, 22, 69.6, 22, 66.4, '')
arr(ax, 22, 56.7, 22, 52.0, '否', lab_xy=(25, 54.4), fs=9)
arr(ax, 5.2, 61.5, 10, 54.0, '是', lab_xy=(5.5, 58.3), fs=9)
line(ax, 15.6, 49, 21, 49)
arr(ax, 21.1, 49, 15.7, 49, '')
arr(ax, 39.1, 49, 35.2, 43.0, '是', lab_xy=(41, 46.5), fs=9)
arr(ax, 30, 44.7, 30, 41.5, '否 → 终止', lab_xy=(37, 41.5), fs=8.5)
line(ax, 22, 33.2, 22, 30.5)
line(ax, 78, 41.7, 78, 30.5)
line(ax, 22, 30.5, 78, 30.5)
arr(ax, 50, 30.5, 50, 28.9)

box(ax, 50, 25, 58, 6.5, '写入调价记录 recycle_price_logs\n（前后价格 · 原因 · 操作人）', fs=9.5)
box(ax, 50, 15.5, 46, 5.5, '写入后台操作日志', fs=10)
box(ax, 50, 6.5, 62, 6, '小程序配价缓存过期（≤10 分钟）自动拉取新目录', fs=9.5)
box(ax, 50, -3.5, 58, 5.5, '新基准价生效于小程序估价与快速报价', fill=FILL_HEAD, fs=9.5)
for y1, y2 in [(21.7, 18.3), (12.7, 9.5), (3.5, -0.7)]:
    arr(ax, 50, y1, 50, y2)
save(fig, '06-配价调价管理流程图.png')

# ==================== 图G 数据库表关系图 ====================
# 标准ER样式：表名标题栏 + PK/FK 字段列表；连线两端标 1/N；虚线=逻辑关联/多态
fig, ax = new_fig(14, 10, '图G  数据库表关系图（E-R）')

ENT_HEAD = INK
ENT_BODY = '#FCFCFC'
GRAY_TXT = '#444444'


def ent(cx, cy, w, title, fields):
    """绘制实体表：深色标题栏 + 字段列表主体。返回 (top, bottom, left, right)"""
    head_h = 5.0
    body_h = 3.0 * len(fields) + 2.0
    total = head_h + body_h
    top, bottom = cy + total / 2, cy - total / 2
    left, right = cx - w / 2, cx + w / 2
    ax.add_patch(Rectangle((left, top - head_h), w, head_h, fc=ENT_HEAD, ec=INK, lw=1.2))
    ax.add_patch(Rectangle((left, bottom), w, body_h, fc=ENT_BODY, ec=INK, lw=1.2))
    ax.text(cx, top - head_h / 2, title, ha='center', va='center', fontsize=9,
            color='white', fontproperties=FP)
    for i, f in enumerate(fields):
        ax.text(left + 1.4, top - head_h - 1.6 - 3.0 * i, f, ha='left', va='center',
                fontsize=7.8, color='#222222', fontproperties=FP)
    return top, bottom, left, right


def rel(x1, y1, x2, y2, fk, l1='1', l2='N', off1=(1.8, 1.2), off2=(1.8, -1.2), fk_xy=None):
    """主从关系连线：两端标注 1/N，线上标注外键字段"""
    line(ax, x1, y1, x2, y2)
    ax.text(x1 + off1[0], y1 + off1[1], l1, fontsize=9, color=INK, ha='center',
            va='center', fontproperties=FP)
    ax.text(x2 + off2[0], y2 + off2[1], l2, fontsize=9, color=INK, ha='center',
            va='center', fontproperties=FP)
    fx, fy = fk_xy if fk_xy else ((x1 + x2) / 2 + 4.5, (y1 + y2) / 2)
    ax.text(fx, fy, fk, fontsize=7.2, color=GRAY_TXT, ha='left', va='center',
            fontproperties=FP)


# ---- 左列：配价库目录链 ----
ent(12, 85, 21, 'recycle_categories', ['PK id', 'code 分类编码（唯一）', 'name / icon / color'])
ent(12, 61, 21, 'recycle_brands', ['PK id', 'FK category_id', 'name / logo_text'])
ent(12, 37, 21, 'recycle_models', ['PK id', 'FK brand_id', 'base_price 回收基准价'])
ent(12, 13, 21, 'recycle_price_logs', ['PK id', 'FK model_id', 'old/new_price · admin_id'])
rel(12, 77, 12, 69, 'FK category_id', fk_xy=(15.2, 73))
rel(12, 53, 12, 45, 'FK brand_id', fk_xy=(15.2, 49))
rel(12, 29, 12, 21, 'FK model_id', fk_xy=(15.2, 25))

# ---- 中列：平台与渠道 ----
ent(42, 85, 21, 'recycle_platforms', ['PK id', 'name / type（三类）', 'url / click_count'])
ent(42, 60, 21, 'recycle_procurement_links', ['PK id', 'FK platform_id（可空）', 'category_id / url / clicks'])
ent(42, 34, 21, 'recycle_click_logs', ['PK id', 'target_type + target_id', 'source（admin / mini）'])
rel(42, 77, 42, 68, 'FK platform_id（可空）', fk_xy=(45.2, 72.5))

# click_logs 多态指向：links（近）与 platforms（绕右侧）
arr(ax, 40, 42.1, 40, 51.9, dashed=True, color='#666666')
line(ax, 52.6, 34, 54.5, 34, dashed=True, color='#666666')
line(ax, 54.5, 34, 54.5, 85, dashed=True, color='#666666')
arr(ax, 54.5, 85, 52.7, 85, dashed=True, color='#666666')
ax.text(40.8, 47, '多态', fontsize=7.2, color=GRAY_TXT, ha='left', fontproperties=FP)
ax.text(55.6, 46, '多态指向\n(target_type+target_id)', fontsize=7.2, color=GRAY_TXT,
        ha='left', va='center', fontproperties=FP)

# ---- 右列：业务订单 ----
ent(76, 85, 24, 'orders（回收订单）', ['PK id / order_id', "order_type = 'recycle'", 'FK user_id · FK address_id'])
ent(64, 60, 15, 'users', ['PK id', 'nickname / phone'])
ent(90, 60, 17, 'user_addresses', ['PK id', '联系人 / 省市区详址'])
rel(72, 77, 66.5, 66.5, 'FK user_id', l1='N', l2='1', off1=(1.8, 1.2), off2=(-2.2, 1.4),
    fk_xy=(60.5, 73))
rel(80, 77, 87, 66.5, 'FK address_id', l1='N', l2='1', off1=(-1.8, 1.2), off2=(2.2, 1.4),
    fk_xy=(89.5, 72.5))

# ---- 底行：账号与配置 ----
ent(20, 12, 20, 'recycle_admins', ['PK id', 'username 唯一', 'role 三级角色'])
ent(44, 12, 20, 'recycle_settings', ['config_key 唯一', 'config_value', '（含 cat_factor_* 品类系数）'])
ent(67, 12, 20, 'recycle_condition_rates', ['factor_key 六因子', 'label / rate 系数'])
ent(90, 12, 17, 'recycle_operation_logs', ['PK id', 'admin_id / module', 'action / detail'])

# 配价链 → 管理员的逻辑关联（updated_by / admin_id）
line(ax, 22.6, 37, 31, 37, dashed=True, color='#666666')
line(ax, 31, 37, 31, 12, dashed=True, color='#666666')
arr(ax, 31, 12, 30.2, 12, dashed=True, color='#666666')
ax.text(29.4, 25, 'updated_by / admin_id（逻辑关联）', fontsize=7.2, color=GRAY_TXT,
        ha='center', va='center', rotation=90, fontproperties=FP)

ax.text(50, 1.2, '注：实线为数据库外键主从关系（1 / N 标于连线两端，FK 为外键字段）；虚线为逻辑关联或多态指向；'
                  'orders.device_model 与配价库为业务对应、无外键约束。',
        ha='center', fontsize=8.2, color='#444444', fontproperties=FP)
save(fig, '07-数据库表关系图.png')

# ==================== 图H 接口鉴权链路图 ====================
fig, ax = new_fig(11, 7.5, '图H  管理后台接口鉴权链路')

box(ax, 8, 62, 13, 9, '客户端请求\n（Bearer 令牌 /\n?token= 下载）', fs=8.5)
box(ax, 34, 62, 34, 9.5, '① authenticate 认证中间件\nJWT 验签（12h）→ 回查账号（存在 · 启用）', fs=9)
box(ax, 70, 62, 22, 9.5, '② requireWrite\n写操作校验\nviewer 只读 → 403', fs=9)
box(ax, 92, 62, 13, 9.5, '③ requireSuper\n仅超管\n非 super → 403', fs=8.5)
box(ax, 34, 32, 34, 10, '业务路由\n参数校验 → 业务 SQL → 操作日志', fs=9.5, fill=FILL_HEAD)
box(ax, 76, 32, 26, 9, '统一响应\n{ success, message, data }', fs=9.5)
box(ax, 8, 32, 13, 9, '401 / 403\n失败返回', fs=9)

arr(ax, 14.6, 62, 16.9, 62, '')
arr(ax, 51.1, 62, 58.9, 62, '写操作路由', lab_xy=(55, 65.5), fs=8)
arr(ax, 81.1, 62, 85.4, 62, '管理员管理路由', lab_xy=(87, 67.0), fs=8)
arr(ax, 34, 57.2, 34, 37.2, '通过', lab_xy=(38, 47), fs=9)
arr(ax, 22, 57.2, 10, 36.7, '验签失败 / 账号禁用', rad=0.12, lab_xy=(13, 47), fs=8)
line(ax, 92, 57.2, 92, 37)
arr(ax, 92, 37.1, 51.3, 37, '')
arr(ax, 51.1, 32, 62.9, 32, '')
ax.text(50, 12, '只读账号可执行查询与导出；文件下载接口支持 ?token= 传参以适配浏览器新窗口场景',
        ha='center', fontsize=9, color='#444444', fontproperties=FP)
save(fig, '08-接口鉴权链路图.png')

print('ALL DIAGRAMS DONE ->', OUT)
