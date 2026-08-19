# -*- coding: utf-8 -*-
"""
Part3：配套章节更新
1. 重写 2.1 软件概述（段74/75）为三端描述
2. 在 7.4 之后插入 7.5 cmms_db 小节
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')
import docx
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = r'D:/maintain/小程序2.0/软著材料/电子维修服务管理系统-详细设计说明书.NEW.docx'
doc = docx.Document(SRC)
paras = doc.paragraphs

STYLE_ID = {'Heading 2':'4','Heading 3':'5','Heading 4':'6','Heading 1':'3'}

def clear_runs_rPr(p):
    for r in p.findall(qn('w:r')):
        rPr = r.find(qn('w:rPr'))
        if rPr is not None:
            r.remove(rPr)

def set_body_text(p, text):
    """清空段落并写入宋体10.5正文"""
    # 删除现有所有 run
    for r in list(p.findall(qn('w:r'))):
        p.remove(r)
    r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rf = OxmlElement('w:rFonts'); rf.set(qn('w:ascii'),'宋体'); rf.set(qn('w:hAnsi'),'宋体'); rf.set(qn('w:eastAsia'),'宋体'); rPr.append(rf)
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'),'21'); rPr.append(sz)
    szCs = OxmlElement('w:szCs'); szCs.set(qn('w:val'),'21'); rPr.append(szCs)
    r.append(rPr)
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve'); t.text = text
    r.append(t); p.append(r)

def new_heading_para(hstyle, text):
    p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    pStyle = OxmlElement('w:pStyle'); pStyle.set(qn('w:val'), STYLE_ID[hstyle]); pPr.append(pStyle)
    sp = OxmlElement('w:spacing'); sp.set(qn('w:before'),'120'); sp.set(qn('w:after'),'60'); sp.set(qn('w:line'),'276'); sp.set(qn('w:lineRule'),'auto'); pPr.append(sp)
    p.append(pPr)
    r = OxmlElement('w:r'); t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve'); t.text = text
    r.append(t); p.append(r)
    return p

def new_bullet_para(text, bullet_style='List Bullet'):
    p = OxmlElement('w:p')
    pPr = OxmlElement('w:pPr')
    pStyle = OxmlElement('w:pStyle'); pStyle.set(qn('w:val'), bullet_style); pPr.append(pStyle)
    p.append(pPr)
    r = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rf = OxmlElement('w:rFonts'); rf.set(qn('w:ascii'),'宋体'); rf.set(qn('w:hAnsi'),'宋体'); rf.set(qn('w:eastAsia'),'宋体'); rPr.append(rf)
    sz = OxmlElement('w:sz'); sz.set(qn('w:val'),'21'); rPr.append(sz)
    r.append(rPr)
    t = OxmlElement('w:t'); t.set(qn('xml:space'),'preserve'); t.text = text
    r.append(t); p.append(r)
    return p

# ---------- 1. 重写段[74][75] ----------
text74 = ('《电子维修服务管理系统》是一款面向电子设备维修与回收场景的 O2O 运营服务软件，'
          '覆盖“消费电子维修服务 + 企业设备资产管理 + 智能客服诊断”三大业务域，技术架构由四部分协同构成：'
          '微信小程序客户端（原生 WXML/WXSS/JS）、Node.js（Express）服务端、PHP（ThinkPHP 8.1）Web 管理后台与 Python（FastAPI + LangGraph）智能客服 Agent，'
          '数据统一存储于 MySQL 与向量库（Milvus），并内嵌基于角色的后台管理系统。'
          '软件集成大模型多智能体客服与 AI 故障自检能力，支持在线下单、透明报价确认、维修进度实时反馈、微信支付、评价售后、'
          '设备台账与工单全生命周期管理及完整的系统运营管理。')
text75 = ('软件整体能力可归纳为“一端自助、两端管理、一智能脑、��套数据”：'
          '微信小程序端面向客户与内部人员，提供下单、咨询、跟踪与评价等自助服务；'
          '管理端（内嵌于小程序的管理员/超级管理员界面）面向运营团队，提供工单处理、报价、进度上报、用户/设备/价格/配送/统计等管理能力；'
          'Web 管理后台（PHP）面向企业设备资产管理，提供设备台账、工单、维修人员排班、巡检保养、进销存、统计报表、知识库与营销引流等能力；'
          '智能客服 Agent（Python）提供多智能体意图路由与 RAG 知识库问答。'
          '各端共享同一套服务端核心接口与数据库，通过 JWT 鉴权与 RBAC 权限控制实现数据一致与权限隔离。')

p74 = paras[74]._element
p75 = paras[75]._element
# 确认
assert '由微信小程序前端' in paras[74].text, '段74内容不符'
assert '一端服务' in paras[75].text, '段75内容不符'
set_body_text(p74, text74)
set_body_text(p75, text75)
print('2.1 软件概述已重写为三端描述')

# ---------- 2. 插入 7.5 ----------
# 定位 7.4 标题后的内容总末尾（空行[558]之后，第八章之前）
# 找到段[558]空行元素，在它之后插入 7.5 内容
seventh_tail = None
for i, p in enumerate(paras):
    if p.text.strip() == '第七章  数据库设计':
        # 找该章最后的段落元素（7.4内容后的空行）
        pass
# 直接在第八章标题前插入。先定位第八章标题 H1
ch8_el = None
for p_el in doc.element.body.findall(qn('w:p')):
    pPr = p_el.find(qn('w:pPr'))
    if pPr is not None:
        pStyle = pPr.find(qn('w:pStyle'))
        if pStyle is not None and pStyle.get(qn('w:val')) in ('3','Heading 1','Heading1') and \
           ''.join(t.text or '' for t in p_el.iter(qn('w:t'))).strip().startswith('第八章'):
            ch8_el = p_el
            break
assert ch8_el is not None, '未找到第八章标题'

# 构建 7.5 内容
ch75_items = [
    new_heading_para('Heading 2', '7.5 cmms_db 库主要表'),
    # 正文段
]
# 正文简介
intro = OxmlElement('w:p')
iPr = OxmlElement('w:pPr')
iind = OxmlElement('w:ind'); iind.set(qn('w:firstLineChars'),'200'); iind.set(qn('w:firstLine'),'420'); iPr.append(iind)
isp = OxmlElement('w:spacing'); isp.set(qn('w:after'),'0'); isp.set(qn('w:line'),'276'); isp.set(qn('w:lineRule'),'auto'); iPr.append(isp)
iNxt = OxmlElement('w:p')
intro.append(iPr)
ir = OxmlElement('w:r'); irPr = OxmlElement('w:rPr')
irf = OxmlElement('w:rFonts'); irf.set(qn('w:ascii'),'宋体'); irf.set(qn('w:hAnsi'),'宋体'); irf.set(qn('w:eastAsia'),'宋体'); irPr.append(irf)
isz = OxmlElement('w:sz'); isz.set(qn('w:val'),'21'); irPr.append(isz); ir.append(irPr)
it = OxmlElement('w:t'); it.set(qn('xml:space'),'preserve')
it.text = 'Web 管理后台（PHP）采用独立的 cmms_db 数据库，主要数据表按业务域划分如下：'
ir.append(it); intro.append(ir)

bullets = [
    '权限与组织类：users、roles、permissions、role_permissions、user_roles、departments、personnel、organizations',
    '设备工单类：devices、device_categories、work_orders、work_order_logs、engineers、schedules',
    '巡检保养类：inspection_tasks、maintenance_plans、maintenance_records、maintenance_categories',
    '维修业务类：repair_orders、repair_categories、repair_machines、quotation_orders、quotation_items、repair_progress、progress_apply、repair_reports、test_reports、repair_contracts、contract_templates',
    '支付进销存类：cmms_transfer_payments、cmms_online_payments、cmms_invoices、spare_parts、suppliers、stock_records',
    '知识库与营销类：knowledge_base、kb_collections、kb_files、kb_chunks、marketing_cases、marketing_partners',
    '统计类：statistics_income_records、statistics_expense_records、statistics_order_records、statistics_timeout_records',
]

# 依序在 ch8_el 前插入 (addprevious 保持顺序)
seq = [new_heading_para('Heading 2', '7.5 cmms_db 库主要表'), intro] + [new_bullet_para(b) for b in bullets]
for el in seq:
    ch8_el.addprevious(el)
print('已插入 7.5 cmms_db 小节')

doc.save(SRC)
print('Part3 保存完成')
