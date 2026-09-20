// 众云信息科技电子产品回收综合服务平台V1.0 软件说明书生成脚本（正式版）
// 版式：纯白封面（R5 学术式）、黑体标题黑色、宋体正文、黑白三线表、四级标题
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, TableOfContents, PageBreak,
  SectionType, TableLayoutType
} = require('docx');
const fs = require('fs');

// ==================== 黑白正式配色 ====================
const BLACK = '000000';
const GRAY_LINE = 'BFBFBF';
const HEADER_FILL = 'F2F2F2';
const NOTE_GRAY = '666666';

const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ==================== 封面（R5 纯白学术式） ====================
function estimateTextWidth(text, pt) {
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const isCJK = (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0x3000 && code <= 0x303F) || (code >= 0xFF00 && code <= 0xFFEF) ||
      (code >= 0x2E80 && code <= 0x2EFF);
    width += isCJK ? pt * 20 : pt * 11;
  }
  return width;
}
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([...'，。、；：！？', ...'的与和及之在于为', ...'-_—–·/', ...' \t']);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) {
      breakAt = charsPerLine;
      const prevChar = remaining[breakAt - 1], nextChar = remaining[breakAt];
      if (prevChar && nextChar && !breakAfter.has(prevChar) && !breakAfter.has(nextChar) &&
          /[\u4e00-\u9fff]/.test(prevChar) && /[\u4e00-\u9fff]/.test(nextChar)) breakAt -= 1;
    }
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}
function calcTitleLayoutMixed(title, maxWidthTwips, preferredPt = 30, minPt = 24) {
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    if (estimateTextWidth(title, titlePt) <= maxWidthTwips) { lines = [title]; break; }
    const cpl = Math.max(2, Math.floor(maxWidthTwips / (titlePt * 20)));
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines) { lines = splitTitleLines(title, Math.floor(maxWidthTwips / (minPt * 20))); titlePt = minPt; }
  return { titlePt, titleLines: lines };
}
function calcR5MetaLayout(metaEntries, fontPt = 12) {
  const maxLabelLen = Math.max(...metaEntries.map((e) => [...e.label].length));
  const labelNeedTw = (maxLabelLen + 2) * fontPt * 20;
  const valueNeedTw = 5000;
  const totalNeedTw = labelNeedTw + valueNeedTw;
  const tablePct = Math.min(75, Math.max(55, Math.ceil(totalNeedTw / 11906 * 100)));
  const rawLabelPct = Math.ceil(labelNeedTw / (tablePct / 100 * 11906) * 100);
  return { tablePct, labelPct: Math.max(25, Math.min(45, rawLabelPct)) };
}
function buildR5MetaTable(metaEntries) {
  const { tablePct, labelPct } = calcR5MetaLayout(metaEntries);
  const valuePct = 100 - labelPct;
  const bottomBorder = { style: BorderStyle.SINGLE, size: 4, color: BLACK };
  const rows = metaEntries.map((entry) => new TableRow({
    children: [
      new TableCell({
        width: { size: labelPct, type: WidthType.PERCENTAGE },
        borders: noBorders,
        margins: { top: 60, bottom: 60, left: 0, right: 0 },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 60, after: 60, line: 400 },
          children: [new TextRun({ text: entry.label + '：', size: 24, color: BLACK, font: { eastAsia: 'SimSun', ascii: 'Times New Roman' } })]
        })]
      }),
      new TableCell({
        width: { size: valuePct, type: WidthType.PERCENTAGE },
        borders: { top: NB, left: NB, right: NB, bottom: bottomBorder },
        margins: { top: 60, bottom: 60, left: 80, right: 0 },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 60, after: 60, line: 400 },
          children: [new TextRun({ text: entry.value, size: 24, color: BLACK, font: { eastAsia: 'SimSun', ascii: 'Times New Roman' } })]
        })]
      })
    ]
  }));
  return new Table({
    width: { size: tablePct, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows
  });
}
function buildCoverR5(config) {
  const PAGE_H = 16838, SAFETY = 1200;
  const safeH = PAGE_H - SAFETY;
  const simMarginLR = 1701, simMarginT = 1200;
  const contentW = 11906 - simMarginLR * 2;
  // 支持手工指定标题分行（公司名/产品名两行），未指定时自动计算
  let titlePt, titleLines;
  if (config.titleLines) {
    titleLines = config.titleLines;
    const maxW = Math.max(...titleLines.map((t) => estimateTextWidth(t, 1)));
    titlePt = Math.max(22, Math.min(30, Math.floor(contentW / maxW)));
  } else {
    ({ titlePt, titleLines } = calcTitleLayoutMixed(config.title, contentW, 30, 24));
  }
  const titleSize = titlePt * 2;
  const metaEntries = config.metaEntries || [];
  const subtitleH = config.subtitle ? (18 * 23 + 600) : 0;
  const docTypeH = config.docType ? (26 * 23 + 800) : 0;
  const titleTotalH = titleLines.length * (titlePt * 23 + 200);
  const metaTableH = metaEntries.length * 520;
  const footerH = config.footerRight ? (12 * 23 + 200) : 0;
  const spacerParas = 3 * 350;
  const fixedH = titleTotalH + subtitleH + docTypeH + metaTableH + footerH + spacerParas;
  const remaining = Math.max(safeH - fixedH, 600);
  const topSpacing = Math.min(Math.floor(remaining * 0.28) + simMarginT, 4200);
  const midSpacing = Math.min(Math.floor((remaining - simMarginT) * 0.18), 2000);
  const bottomSpacing = Math.min(remaining - topSpacing + simMarginT - midSpacing, 5500);

  const children = [];
  children.push(new Paragraph({ spacing: { before: topSpacing } }));
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: i < titleLines.length - 1 ? 120 : 300, line: Math.ceil(titlePt * 23), lineRule: 'atLeast' },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: BLACK, font: { eastAsia: 'SimHei', ascii: 'Times New Roman' } })]
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200, line: Math.ceil(18 * 23), lineRule: 'atLeast' },
      children: [new TextRun({ text: config.subtitle, size: 32, bold: true, color: BLACK, font: { eastAsia: 'SimHei', ascii: 'Times New Roman' } })]
    }));
  }
  if (config.docType) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200, line: Math.ceil(26 * 23), lineRule: 'atLeast' },
      children: [new TextRun({ text: config.docType, size: 52, bold: true, color: BLACK, font: { eastAsia: 'SimHei', ascii: 'Times New Roman' }, characterSpacing: 60 })]
    }));
  }
  children.push(new Paragraph({ spacing: { before: midSpacing } }));
  if (metaEntries.length > 0) children.push(buildR5MetaTable(metaEntries));
  children.push(new Paragraph({ spacing: { before: bottomSpacing } }));
  if (config.footerRight) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: config.footerRight, size: 24, color: '404040', font: { eastAsia: 'SimSun', ascii: 'Times New Roman' } })]
    }));
  }
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: PAGE_H, rule: 'exact' },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: 'FFFFFF' },
        borders: noBorders, verticalAlign: 'top',
        margins: { left: simMarginLR, right: simMarginLR },
        children
      })]
    })]
  })];
}

// ==================== 正文构件（黑体标题 + 宋体正文） ====================
const FONT_BODY = { ascii: 'Times New Roman', eastAsia: 'SimSun' };
const FONT_HEAD = { ascii: 'Times New Roman', eastAsia: 'SimHei' };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: BLACK, font: FONT_HEAD })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 140, line: 312 },
    children: [new TextRun({ text, bold: true, size: 30, color: BLACK, font: FONT_HEAD })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: BLACK, font: FONT_HEAD })]
  });
}
function h4(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 200, after: 80, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: BLACK, font: FONT_HEAD })]
  });
}
function p(text, opts) {
  const o = opts || {};
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: o.noIndent ? 0 : 480 },
    spacing: { line: 440, lineRule: 'exact', after: o.after != null ? o.after : 60 },
    children: [new TextRun({ text, size: 24, color: BLACK, font: FONT_BODY, bold: !!o.bold })]
  });
}
function pLead(lead, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 440, lineRule: 'exact', after: 60 },
    children: [
      new TextRun({ text: lead, size: 24, bold: true, color: BLACK, font: FONT_BODY }),
      new TextRun({ text, size: 24, color: BLACK, font: FONT_BODY })
    ]
  });
}
function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 440, lineRule: 'exact', after: 40 },
    children: [new TextRun({ text, size: 24, color: BLACK, font: FONT_BODY })]
  });
}
function bulletLead(lead, text) {
  return new Paragraph({
    bullet: { level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 440, lineRule: 'exact', after: 40 },
    children: [
      new TextRun({ text: lead, size: 24, bold: true, color: BLACK, font: FONT_BODY }),
      new TextRun({ text, size: 24, color: BLACK, font: FONT_BODY })
    ]
  });
}
function tCaption(text) {
  return new Paragraph({
    keepNext: true, alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 80, line: 312 },
    children: [new TextRun({ text, bold: true, size: 21, color: BLACK, font: FONT_BODY })]
  });
}
// 正式三线表（黑线、浅灰表头）
function tbl(headers, rows, widths) {
  const n = headers.length;
  const w = widths || headers.map(() => Math.floor(100 / n));
  const mk = (text, isHead, i) => new TableCell({
    width: { size: w[i], type: WidthType.PERCENTAGE },
    shading: isHead ? { type: ShadingType.CLEAR, fill: HEADER_FILL } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 276 },
      children: [new TextRun({ text: String(text), bold: isHead, size: 21, color: BLACK, font: FONT_BODY })]
    })]
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: GRAY_LINE },
      insideVertical: NB
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((t, i) => mk(t, true, i)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => mk(t, false, i)) }))
    ]
  });
}
// 截图占位框
function fig(caption) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 0, line: 312 },
      border: {
        top: { style: BorderStyle.DASHED, size: 4, color: '999999', space: 10 },
        bottom: { style: BorderStyle.DASHED, size: 4, color: '999999', space: 10 },
        left: { style: BorderStyle.DASHED, size: 4, color: '999999', space: 30 },
        right: { style: BorderStyle.DASHED, size: 4, color: '999999', space: 30 }
      },
      children: [new TextRun({ text: '（此处插入界面截图，图片宽度建议 14~15cm）', italics: true, size: 21, color: '8A8A8A', font: FONT_BODY })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 160, line: 312 },
      children: [new TextRun({ text: caption, bold: true, size: 21, color: BLACK, font: FONT_BODY })]
    })
  ];
}
function note(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 0 },
    spacing: { line: 312, before: 60, after: 120 },
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: GRAY_LINE, space: 10 } },
    children: [new TextRun({ text, italics: true, size: 21, color: NOTE_GRAY, font: FONT_BODY })]
  });
}

// ==================== 正文内容 ====================
const body = [];

// ---------- 第一章 概述 ----------
body.push(h1('第一章 概述'));
body.push(h2('1.1 软件简介'));
body.push(p('众云信息科技电子产品回收综合服务平台（以下简称本平台）是一套面向电子产品回收业务的全流程线上化管理系统，覆盖手机、电脑、平板、智能穿戴、显示器、影像器材、游戏机、无人机、服务器、网络设备、显卡等十余个回收品类。平台由微信小程序用户端与 Web 管理后台两部分组成：小程序端面向普通用户提供分类浏览、型号检索、问答式估价、AI 辅助估价、回收下单等自助服务；管理后台面向回收企业运营人员，提供设备配价库管理、回收订单处理、回收平台档案管理、采购链接管理、估价系数配置、经营数据统计以及操作审计等全量管理能力。'));
body.push(p('平台采用前后端分离架构。管理后台服务端基于 Node.js 与 Express 框架构建，前端基于 Vue3、Vite 与 Element Plus 组件库构建；小程序端基于微信小程序原生框架开发；数据持久化采用 MySQL 8.0 关系数据库。系统各组成部分既可独立部署、独立升级，又通过共享业务数据库实现配价、订单等核心业务数据的实时同步，形成「小程序估价下单—后台接单报价—物流完成交易」的完整业务闭环。'));
body.push(h2('1.2 开发背景与目的'));
body.push(p('随着消费电子产品的更新换代不断加速，废旧手机、电脑等电子设备的存量持续增长，二手回收行业迎来快速发展期。传统回收经营普遍存在以下痛点：一是报价依赖人工经验，缺乏统一、可随时调整的配价标准，不同人员报价口径不一致；二是回收渠道分散，企业与爱回收、转转、闲鱼等外部平台之间的比价、采购协作缺少统一入口；三是订单以电话、微信等线下方式记录，状态难追踪、数据难沉淀；四是估价过程不透明，用户对报价缺乏信任，成交转化率低。'));
body.push(p('本平台即为解决上述问题而开发。通过建立「分类—品牌—型号」三级配价库并支持在线调价与批量调价，企业可以随时统一报价口径；通过问答式估价与 AI 大模型辅助估价，用户在两分钟内即可自助获得有依据的回收报价；通过与订单系统的打通，每一笔回收业务从提交、报价、确认到完成全程留痕，并自动沉淀为经营统计数据；通过回收平台档案与采购链接管理，将外部比价与采购渠道整合到统一工作台。平台同时将环保贡献量化呈现，助力企业开展绿色回收品牌建设。'));
body.push(h2('1.3 主要特点'));
body.push(bulletLead('云端配价、离线兜底：', '小程序端内置完整本地配价目录保证秒开与离线可用，同时异步加载后台维护的最新云端配价，后台调价后小程序端十分钟缓存周期内自动生效，兼顾性能与时效。'));
body.push(bulletLead('多因子估价模型：', '回收价格由型号基准价与成色、屏幕、功能、版本、配件、维修史六大评估因子系数连乘计算，叠加二手基准系数与品类系数，估价过程可解释、可追溯。'));
body.push(bulletLead('AI 大模型辅助估价：', '集成 DeepSeek 大语言模型接口，结合产品信息与设备状况生成参考回收价与估价说明，AI 不可用时自动降级为本地模型计算，保证服务连续性。'));
body.push(bulletLead('调价安全管控：', '单型号调价幅度超过系统设定阈值（默认 20%）时强制二次确认，全部调价动作记录调价审计日志，防止误操作与恶意调价。'));
body.push(bulletLead('三级角色权限体系：', '内置超级管理员、管理员、只读账号三级角色，写操作与高危操作分级校验，所有后台写操作全程记录操作日志。'));
body.push(bulletLead('跨系统单点登录：', '与维修后台管理系统同域部署，支持以维修后台登录凭证置换回收后台会话，首次进入自动开户，实现一套账号、双系统免登切换。'));
body.push(bulletLead('环保贡献量化：', '依据累计回收完成台数，按可配置的行业换算系数自动折算减碳量、等效植树量与节省电能，在看板与大屏直观呈现绿色回收成效。'));
body.push(bulletLead('容器化统一部署：', '全栈支持 Docker 容器化编排，经 HTTPS 统一网关以子路径对外提供服务，部署、升级、回滚流程标准化。'));
body.push(h2('1.4 运行环境'));
body.push(h3('1.4.1 硬件环境'));
body.push(p('服务端建议配置：2 核及以上 CPU、4GB 及以上内存、40GB 及以上系统盘；生产环境建议 4 核 CPU、8GB 内存并配备独立数据盘。管理端与用户端对终端无特殊要求：管理后台通过现代桌面浏览器访问，小程序端在支持微信小程序运行环境的智能手机上使用。'));
body.push(h3('1.4.2 软件环境'));
body.push(tCaption('表 1-1 软件运行环境要求'));
body.push(tbl(
  ['类别', '环境项', '要求'],
  [
    ['服务端', '操作系统', 'Linux（推荐）或 Windows Server，支持 Docker 容器运行时'],
    ['服务端', 'Node.js', '20.x 及以上版本（管理后台服务、小程序服务端）'],
    ['服务端', 'MySQL', '8.0 及以上版本，字符集 utf8mb4'],
    ['服务端', '容器环境', 'Docker Engine 24+ 与 Docker Compose（容器化部署）'],
    ['服务端', '反向代理', 'Nginx 1.24 及以上版本（统一 HTTPS 网关）'],
    ['管理端', '浏览器', 'Chrome、Edge、Firefox 等现代浏览器最新版本'],
    ['用户端', '微信', '微信客户端 8.0 及以上版本，支持小程序运行环境']
  ],
  [14, 22, 64]
));
body.push(h3('1.4.3 网络环境'));
body.push(p('平台各组成部分通过内部容器网络通信：管理后台服务、小程序服务端与数据库、缓存之间均走容器内网。对外统一由 Nginx 网关以 HTTPS（443 端口）暴露，管理后台挂载于 /recycle-admin/ 子路径，小程序接口挂载于 /mp-api/ 子路径。生产环境需开放 443 端口并配置域名与 SSL 证书；内网测试环境可直接访问相应本机端口。'));
body.push(h2('1.5 术语与缩略语'));
body.push(tCaption('表 1-2 术语与缩略语定义'));
body.push(tbl(
  ['术语', '定义'],
  [
    ['配价库', '设备回收基准价格库，按「分类—品牌—型号」三级结构维护各机型的回收基准价与市场参考价'],
    ['基准价', '型号处于最佳成色时回收方可提供的最高回收价，是估价计算的起点'],
    ['二手基准系数', '即便设备全新也按该折扣回收的兜底系数，默认 0.9，用于使报价贴近真实二手行情'],
    ['估价因子', '影响回收价格的设备状况维度，包括成色、屏幕、功能、版本、配件、维修史六项'],
    ['品类系数', '按回收品类整体设定的折算系数，用于调节不同品类之间的估价水平'],
    ['回收订单', '业务订单表中订单类型为 recycle 的订单，记录用户回收申请、报价与成交信息'],
    ['SSO', 'Single Sign-On，单点登录，指以维修后台登录凭证直接换取回收后台会话的机制'],
    ['JWT', 'JSON Web Token，用于管理后台接口身份校验的令牌'],
    ['数据大屏', '面向展示场景的数据可视化页面，全屏呈现经营指标与环保贡献']
  ],
  [22, 78]
));

body.push(h2('1.6 用户角色与使用场景'));
body.push(p('平台面向五类使用者设计功能入口与权限边界，各角色的定位与典型使用场景如下表所示。', { after: 40 }));
body.push(tCaption('表 1-3 用户角色与使用场景'));
body.push(tbl(
  ['角色', '端', '典型使用场景'],
  [
    ['微信用户', '小程序端', '浏览配价、自助估价、比价、提交回收订单、跟踪订单状态'],
    ['内部人员', '小程序端', '提交免付款内部回收申请（项目返修/仓库/固定资产）'],
    ['运营管理员', '管理后台', '订单报价与流转、配价维护、平台与链接管理、估价配置'],
    ['超级管理员', '管理后台', '全部运营权限，另含管理员账号管理与高危操作'],
    ['只读账号', '管理后台', '数据查询、看板查看与报表导出，不参与写操作']
  ],
  [20, 16, 64]
));
body.push(p('典型场景举例：个人用户换机前在估价引导页完成七步评估，获得参考价并横向比价后一键下单；运营人员每日从看板的待确认指标进入订单队列，完成报价与状态流转；财务人员在月底按日期区间导出订单成交明细对账；企业管理者向前来考察的合作方投放数据大屏，展示回收规模与绿色环保成效。'));

// ---------- 第二章 系统总体结构 ----------
body.push(h1('第二章 系统总体结构'));
body.push(h2('2.1 总体架构'));
body.push(p('平台在逻辑上划分为四层：用户接入层、业务服务层、数据层与外部服务层。用户接入层包括微信小程序端与 Web 管理后台前端；业务服务层包括回收管理后台服务（默认端口 3005）、小程序服务端（默认端口 3001）与统一网关；数据层为共享的 MySQL 业务数据库，配价、订单等核心数据在两个服务之间实时共享；外部服务层包括 DeepSeek 大模型接口与各外部回收平台网站。'));
body.push(p('回收管理后台服务与小程序服务端之间不直接调用接口，而是通过共享同一 MySQL 业务库协作：后台负责写入配价库、估价系数与平台档案等管理数据；小程序服务端以只读方式将这些数据组装为公开接口供小程序拉取；回收订单由小程序端写入业务订单表，后台直接读取并处理。这种「读写分离、以库为界」的协作方式使两端完全解耦，任一端升级不影响另一端运行。'));
body.push(h2('2.2 技术架构'));
body.push(tCaption('表 2-1 平台技术栈构成'));
body.push(tbl(
  ['组成部分', '技术选型', '说明'],
  [
    ['管理后台服务端', 'Node.js 20 + Express', 'RESTful API，JWT 鉴权，单端口同时托管接口与前端静态资源'],
    ['管理后台前端', 'Vue3 + Vite + Element Plus + ECharts', '组件化开发，构建产物由服务端托管，支持子路径部署'],
    ['小程序端', '微信小程序原生框架', '分包加载、本地缓存、自定义视觉体系'],
    ['小程序服务端', 'Node.js + Express + mysql2', '业务订单处理、回收公开数据接口、AI 估价代理'],
    ['数据库', 'MySQL 8.0（mysql2 连接池）', 'utf8mb4 字符集，时区东八区，连接池默认上限 10'],
    ['AI 估价', 'DeepSeek Chat API', '温度参数 0.3，输出约束为 JSON 格式，失败自动降级'],
    ['网关', 'Nginx 1.24', 'HTTPS 终端、子路径路由、静态资源与上传目录分发']
  ],
  [22, 32, 46]
));
body.push(p('管理后台前端与管理后台服务端为同一部署单元：生产模式下，Express 服务在提供 /api 前缀接口的同时，直接托管前端构建产物目录，并回退路由支持前端 history 路由模式，因此单端口即可对外提供完整后台能力。前端构建时通过环境变量注入子路径基座与接口前缀，适配网关子路径部署场景。'));
body.push(h2('2.3 部署架构'));
body.push(p('平台采用容器化统一编排部署。全部服务注册在同一容器网络中：Nginx 网关容器对外监听 443 端口，按路径将请求转发至回收管理后台容器（/recycle-admin/）、小程序服务端容器（/mp-api/）等后端服务；数据库使用宿主机已有的 MySQL 实例，容器内通过 host.docker.internal 访问；Redis 缓存容器仅绑定本机回环地址。管理后台容器仅暴露本机端口用于调试，外部访问一律经网关进行，形成统一的入口收敛与安全边界。'));
body.push(...fig('图 2-1 系统总体部署架构图（可插入部署架构截图或示意图片）'));
body.push(h2('2.4 功能模块划分'));
body.push(p('平台功能划分为小程序端与管理后台端两大体系。小程序端包含回收主页、估价引导两个核心模块；管理后台端包含数据看板、数据大屏、回收订单管理、设备配价库、回收平台管理、采购链接管理、估价配置、操作日志、系统设置九个菜单模块，另含登录认证与权限控制基础模块，主界面框架统一提供侧边导航、面包屑、日夜主题切换与个人菜单。'));
body.push(tCaption('表 2-2 平台功能模块清单'));
body.push(tbl(
  ['端', '模块', '核心功能'],
  [
    ['小程序端', '回收主页', '分类浏览、品牌型号选择、全局搜索、平台比价、云端配价加载'],
    ['小程序端', '估价引导', '七步问答评估、实时估价、AI 估价、地址选择、订单提交、内部回收申请'],
    ['管理后台', '数据看板', '经营指标总览、订单趋势、类型分布、热门机型、环保贡献'],
    ['管理后台', '数据大屏', '全屏数据可视化展示，含实时时钟与全屏控制'],
    ['管理后台', '回收订单管理', '订单检索、详情查看、报价提交、状态流转、手动建单、CSV 导出'],
    ['管理后台', '设备配价库', '分类/品牌/型号管理、单型号调价、批量调价、调价审计、品类系数'],
    ['管理后台', '回收平台管理', '回收平台档案维护、跳转点击统计'],
    ['管理后台', '采购链接管理', '外部采购与比价链接维护、点击统计与排行'],
    ['管理后台', '估价配置', '核心参数、品类系数、因子系数维护与估价模拟'],
    ['管理后台', '操作日志', '后台全部写操作日志的多条件检索'],
    ['管理后台', '系统设置', '系统参数、管理员账号管理、密码修改'],
    ['管理后台', '认证与权限', '账号登录、单点登录、JWT 会话、三级角色控制']
  ],
  [14, 20, 66]
));
body.push(h2('2.5 业务流程设计'));
body.push(h3('2.5.1 用户回收下单流程'));
body.push(h4('2.5.1.1 浏览进入路径'));
body.push(p('用户自小程序首页进入回收主页后，按「分类→品牌→型号」逐级浏览：点击分类导航切换品类，在品牌分区中浏览型号卡片，点击目标型号卡片进入估价引导页。该路径适合对设备品类有明确认知、愿意逐级筛选的用户。'));
body.push(h4('2.5.1.2 搜索进入路径'));
body.push(p('用户点击主页顶部搜索栏唤起搜索面板，输入型号关键词（支持多词组合与无空格模糊输入），从检索结果中直接点击目标型号进入估价引导页，并自动保存搜索词至历史记录。该路径适合已知具体型号的效率型用户。'));
body.push(h4('2.5.1.3 估价与提交'));
body.push(p('进入估价引导页后，用户依次完成七项设备状况问答，系统实时刷新预估价格；作答完毕后自动执行本地结算估价并尝试 AI 估价，展示最终估价与价格区间；用户选择回收地址、确认回收金额后提交订单。普通用户经金额确认弹窗二次确认；内部人员选择设备来源后以免付款方式提交。订单提交成功后进入后台待确认队列，由运营人员接续处理。'));
body.push(...fig('图 2-2 用户回收下单业务流程图（可插入流程图截图）'));
body.push(h3('2.5.2 估价计算流程'));
body.push(p('估价计算以型号基准价为起点，依次乘以用户所选各评估因子对应的价格系数，再乘以二手基准系数与品类系数得到最终估价；价格区间按点估价的 90% 至 105% 收敛生成。计算公式为：最终估价 = 型号基准价 × 成色系数 × 屏幕系数 × 功能系数 × 版本系数 × 配件系数 × 维修史系数 × 二手基准系数 × 品类系数。其中型号基准价来自配价库，各因子系数与全局参数均由管理后台在线维护，小程序端启动估价流程时拉取最新配置并覆盖本地默认值。'));
body.push(h3('2.5.3 后台订单处理流程'));
body.push(p('回收订单遵循统一的状态机流转：待确认（pending）→ 已报价（quoted）→ 已确认（confirmed）→ 处理中（processing）→ 已完成（completed），任一非完结状态可转已取消（cancelled）。后台运营人员在订单列表检索到待确认订单后，查看订单详情中的设备信息、评估明细与用户联系方式，结合配价库行情提交回收报价，订单状态自动置为已报价；用户在小程序端确认报价后订单进入后续环节；设备验收完成后运营人员将订单置为已完成并记录成交价。已完结订单不允许再变更状态与报价，全部状态变更记录操作日志。'));
body.push(h3('2.5.4 配价管理流程'));
body.push(h4('2.5.4.1 调价发起'));
body.push(p('配价调整由运营人员在设备配价库模块发起，支持单型号调价与多型号批量调价两种方式；单型号调价需录入新基准价与调价原因，批量调价支持按百分比浮动与统一固定值两种模式，并需填写批量调价原因。'));
body.push(h4('2.5.4.2 幅度校验'));
body.push(p('单型号调价提交后，系统计算调价幅度百分比并与系统参数「单次调价幅度上限」（默认 20%）比较：超限时拒绝执行并返回二次确认提示，运营人员在确认弹窗中感知前后价格差异后可选择强制调价；批量调价按型号逐一计算新价格并向下取整至非负整数。'));
body.push(h4('2.5.4.3 生效传播'));
body.push(p('调价成功后，新价格即时写入型号配价表并同步记录一条调价审计日志（含前后价格、原因、操作人）；小程序端配价缓存过期后自动拉取新目录，估价链路随之采用新基准价，无需小程序发版。'));

body.push(h2('2.6 关键技术设计与实现'));
body.push(p('本节从工程实现角度说明平台核心机制的技术方案，覆盖管理后台前端、管理后台服务端、小程序端与 AI 估价链路四个方面，与后续各章的功能设计互为印证。'));
body.push(h3('2.6.1 管理后台前端实现'));
body.push(h4('2.6.1.1 组件与路由架构'));
body.push(p('前端采用 Vue3 组合式 API 与单文件组件组织代码，每个功能页面为独立视图组件，公共布局（侧边导航、面包屑、顶部工具栏、个人菜单、修改密码弹窗）由主布局组件统一承载。路由基于 history 模式创建，路由基座取构建时注入的 BASE_URL，使同一套代码既可根路径部署也可子路径部署。全局路由守卫在每次跳转前检查本地令牌：未登录时重定向登录页并携带原始目标路径，登录成功（含单点登录自动进入）后原路返回，避免用户登录后丢失目标页面；守卫同时按路由元信息动态设置浏览器标签标题。'));
body.push(h4('2.6.1.2 请求层封装'));
body.push(p('网络层基于 axios 封装统一请求模块：请求拦截器自动为每次调用注入 Authorization 头与本地令牌；响应拦截器统一解包 success、message、data 三段结构，业务失败时全局弹出错误提示；收到 401 未授权响应时清理本地凭证并跳转登录页。全部业务接口按认证、订单、配价、平台、链接、统计、设置等模块封装为独立函数文件，页面组件不直接接触底层请求细节，接口变更只需修改一处。'));
body.push(h4('2.6.1.3 可视化与动效实现'));
body.push(p('图表基于 ECharts 实现：组件挂载后初始化图表实例并绑定窗口尺寸变化事件自动重绘，组件卸载时销毁实例释放资源，避免内存泄漏。数字滚动动效为零依赖的组合式函数实现：以请求动画帧驱动，在约 1.2 秒内按缓动曲线从零滚动至目标值，支持指定小数位数与持续时间，看板环保指标与大屏 KPI 数字均复用该函数，保证两端动效表现一致。'));
body.push(h4('2.6.1.4 主题切换实现'));
body.push(p('日间/夜间主题通过为页面根元素切换样式类实现，样式类按主题变量组织，全部组件颜色取自主题变量而非硬编码；主题选择持久化于本地存储，变更时通过自定义窗口事件广播；回收后台与维修后台同域部署、共享同一存储键，任一系统切换主题后另一系统监听到事件即时同步，实现跨系统主题一致。'));
body.push(h3('2.6.2 管理后台服务端实现'));
body.push(h4('2.6.2.1 服务分层结构'));
body.push(p('服务端按入口、路由、中间件、数据访问四层组织：入口文件负责中间件装配（跨域、JSON 解析、请求日志、统一错误处理）与业务路由挂载；路由层按认证、订单、配价、平台、链接、统计、设置、日志八个业务域拆分为独立文件，每条路由内部自行完成参数校验、业务查询与操作日志写入；中间件层提供认证与三级角色校验；数据层以单例连接池封装全部 SQL 访问。层次清晰使新增业务域时只需增加一个路由文件并在入口挂载。'));
body.push(h4('2.6.2.2 连接池与启动自检'));
body.push(p('数据库访问基于 mysql2 连接池：默认上限十个连接、请求排队等待、连接超时十秒，字符集 utf8mb4、时区东八区、日期时间以字符串返回避免时区偏移，连接池挂载错误监听防止异常导致进程退出。服务启动时依次执行连接探活、表结构初始化与种子数据灌入，任一环节失败即输出原因并终止进程，避免服务在数据库异常时带病运行。'));
body.push(h4('2.6.2.3 动态列探测实现'));
body.push(p('针对共享业务表结构随小程序服务端演进的问题，服务端在首次查询订单与地址前读取数据库元数据中的实际列集合并进程内缓存；查询组装时仅拼接实际存在的列，缺失列以空值别名占位，保证接口响应结构在不同部署环境间完全一致。该机制将表结构差异的适配收敛到一处，业务代码无需感知环境差异，这是回收后台与小程序服务端独立迭代仍能稳定协作的基础。'));
body.push(h4('2.6.2.4 静态托管与前端路由回退'));
body.push(p('生产模式下服务端以静态目录方式托管前端构建产物，并对排除接口与健康检查路径之外的任意路径回退返回前端入口页面，支撑前端 history 路由的深链刷新场景——用户直接访问或刷新任一功能路径（如订单管理）均能正确进入对应页面而非报 404。接口与页面同端口同域，前端请求自然同源，无需跨域配置。'));
body.push(h3('2.6.3 小程序端实现'));
body.push(h4('2.6.3.1 分包加载与预下载'));
body.push(p('小程序采用主包加分包架构：四个标签页置于主包保证启动速度，回收、估价引导等四十余个功能页面按业务域拆入独立分包，并开启按需注入进一步降低首次注入耗时。通过预下载规则，用户浏览首页与维修页时即提前下载回收与估价引导分包，点击进入时分包已就绪，功能页近乎秒开；分包同时限制了单包体积，便于持续迭代。'));
body.push(h4('2.6.3.2 工具层模块化'));
body.push(p('小程序端将可复用逻辑收敛到工具层：请求模块封装统一接口地址候选、鉴权头与静默降级策略；本地数据模块内置完整配价目录、评估题目与默认系数；云端加载器模块封装配价目录、平台列表、估价配置三类云端数据的拉取、缓存与回退；运行时配置模块管理多环境接口地址。页面层只关注交互与渲染，功能逻辑集中一处维护。'));
body.push(h4('2.6.3.3 本地存储使用'));
body.push(p('小程序按数据类型分键使用本地存储：搜索历史、配价目录缓存、登录令牌与用户信息各占独立键位，配价缓存附带过期时间戳实现过期判断；全部存储读写均做异常容错，存储空间不足或读写失败不影响页面核心功能，最坏情况下回退内置数据。'));
body.push(h3('2.6.4 AI 估价链路实现'));
body.push(p('AI 估价链路跨三端协作完成：小程序端在结算阶段携带用户令牌发起估价请求；小程序服务端接收后组装两段提示词——系统提示词设定回收估价专家角色、列明七类估价考量因素并强制仅以 JSON 返回，用户提示词嵌入完整产品信息（品类、品牌、型号、基准价、规格）与逐项作答摘要——随后调用大模型对话接口（采样温度 0.3、最大回复五百 token、超时十五秒）；响应返回后以正则截取 JSON 文本段、解析并校验价格字段为数字且取整，最终返回价格、估价说明与置信度三元组。链路上任一环节失败均向小程序端返回明确错误，由前端自动切换本地估价结果，整条链路对用户表现为永不中断的估价服务。'));

// ---------- 第三章 数据库设计 ----------
body.push(h1('第三章 数据库设计'));
body.push(h2('3.1 设计概述'));
body.push(p('平台数据库采用 MySQL 8.0，字符集 utf8mb4，时区设置为东八区。数据表分为两类：一类是平台专属表，统一使用 recycle_ 前缀，由管理后台服务在首次启动时自动建表并灌入种子数据，覆盖管理员账号、配价库、平台档案、估价配置与操作审计；另一类是与小程序共享的业务表，包括订单表 orders（通过订单类型字段 order_type = recycle 标识回收订单）、用户表 users 与用户地址表 user_addresses，由小程序服务端负责建表与写入，管理后台只读访问。'));
body.push(h2('3.2 数据表清单'));
body.push(tCaption('表 3-1 平台数据表清单'));
body.push(tbl(
  ['表名', '说明', '维护方'],
  [
    ['recycle_admins', '回收后台管理员账号（含角色与状态）', '管理后台'],
    ['recycle_categories', '回收设备分类', '管理后台'],
    ['recycle_brands', '回收设备品牌（隶属分类）', '管理后台'],
    ['recycle_models', '回收设备型号配价（核心表）', '管理后台'],
    ['recycle_price_logs', '配价调整记录（调价审计）', '管理后台'],
    ['recycle_platforms', '回收/采购/比价平台档案', '管理后台'],
    ['recycle_procurement_links', '采购网站平台链接', '管理后台'],
    ['recycle_click_logs', '平台/链接跳转点击日志', '双端写入'],
    ['recycle_condition_rates', '估价因子系数配置', '管理后台'],
    ['recycle_settings', '系统参数（键值对）', '管理后台'],
    ['recycle_operation_logs', '后台操作日志', '管理后台'],
    ['orders', '业务订单表（order_type=recycle 为回收订单）', '小程序服务端'],
    ['users / user_addresses', '用户与收货地址', '小程序服务端']
  ],
  [30, 46, 24]
));
body.push(h2('3.3 核心表结构说明'));
body.push(h3('3.3.1 管理员表 recycle_admins'));
body.push(p('存储回收后台的独立账号体系，与维修后台账号逻辑隔离。密码以 bcrypt 哈希存储；角色分为 super（超级管理员）、admin（管理员）、viewer（只读）三级；账号可禁用而保留历史日志关联。', { after: 40 }));
body.push(tCaption('表 3-2 recycle_admins 主要字段'));
body.push(tbl(
  ['字段', '类型', '说明'],
  [
    ['id', 'INT 自增主键', '管理员标识'],
    ['username', 'VARCHAR(64) 唯一', '登录账号'],
    ['password_hash', 'VARCHAR(128)', 'bcrypt 密码哈希'],
    ['name', 'VARCHAR(64)', '姓名'],
    ['role', 'ENUM(super/admin/viewer)', '角色，默认 admin'],
    ['status', 'TINYINT(1)', '1 启用，0 禁用'],
    ['last_login_at', 'DATETIME', '最近登录时间']
  ],
  [24, 30, 46]
));
body.push(h3('3.3.2 设备分类表 recycle_categories 与品牌表 recycle_brands'));
body.push(p('分类表维护回收品类的基础信息，编码唯一，支持图标与主题色定制及上架/下架状态；品牌表通过分类外键隶属分类，支持品牌字标与品牌色。删除分类时校验其下是否仍有品牌，删除品牌时校验其下是否仍有型号，从应用层保证目录树完整性；数据库层同时设置级联删除外键作为兜底。', { after: 40 }));
body.push(tCaption('表 3-3 recycle_categories 主要字段'));
body.push(tbl(
  ['字段', '类型', '说明'],
  [
    ['id', 'INT 自增主键', '分类标识'],
    ['code', 'VARCHAR(32) 唯一', '分类编码（如 phone、computer）'],
    ['name / icon / color', 'VARCHAR', '分类名称、图标、主题色'],
    ['sort_order', 'INT', '排序权重'],
    ['status', 'TINYINT(1)', '1 上架，0 下架']
  ],
  [26, 28, 46]
));
body.push(h3('3.3.3 型号配价表 recycle_models'));
body.push(p('配价核心表，每个型号记录回收基准价（最高回收价）与二手市场参考价，支持热门机型标记、上架/下架与排序；updated_by 记录最后调价的管理员，配合调价记录表实现价格责任可追溯。', { after: 40 }));
body.push(tCaption('表 3-4 recycle_models 主要字段'));
body.push(tbl(
  ['字段', '类型', '说明'],
  [
    ['id', 'INT 自增主键', '型号标识'],
    ['brand_id', 'INT 外键', '所属品牌'],
    ['name / specs', 'VARCHAR', '型号名称、规格说明'],
    ['base_price', 'DECIMAL(10,2)', '回收基准价'],
    ['market_price', 'DECIMAL(10,2) 可空', '二手市场参考价'],
    ['hot', 'TINYINT(1)', '是否热门机型'],
    ['status', 'TINYINT(1)', '1 上架，0 下架'],
    ['updated_by', 'INT', '最后调价管理员']
  ],
  [26, 28, 46]
));
body.push(h3('3.3.4 调价记录表 recycle_price_logs'));
body.push(p('记录每一次配价变动，包括新增型号的初始定价与批量调价中的每个型号，字段涵盖调价前后价格、调价原因、操作管理员与时间，按型号与时间建立索引，支撑价格走势查询与审计。'));
body.push(h3('3.3.5 平台档案表 recycle_platforms 与采购链接表 recycle_procurement_links'));
body.push(p('平台档案表存储外部回收平台信息，类型分为回收平台、采购渠道、比价参考三类，字段覆盖平台网址、服务方式（上门/邮寄/到店）、结算方式、佣金说明与联系方式，并累计跳转点击量。采购链接表存储按设备分类或机型关键词归类的采购与比价链接，可关联平台档案，记录参考价格区间、备注与点击统计。两张表配合跳转日志表 recycle_click_logs（记录来源为后台或小程序）形成渠道引流数据闭环。'));
body.push(h3('3.3.6 估价系数表 recycle_condition_rates'));
body.push(p('按估价因子分组存储各选项的价格系数，每条记录包含因子键（condition/screen/function/version/accessories/repair-history）、选项文案、选项匹配值与系数值，同一因子下按排序字段决定小程序端展示顺序。管理后台对系数的增删改即时生效，小程序端估价前拉取最新配置。'));
body.push(h3('3.3.7 系统参数表 recycle_settings'));
body.push(p('以键值对方式存储平台运行参数，键唯一。预置参数包括二手回收基准系数、AI 估价开关、配价有效期、回收服务电话、回收须知、单次调价幅度上限、环保换算系数等；品类估价系数亦以 cat_factor_ 前缀键存于本表。参数支持在线修改并记录更新人。', { after: 40 }));
body.push(tCaption('表 3-5 预置系统参数'));
body.push(tbl(
  ['参数键', '默认值', '说明'],
  [
    ['base_factor', '0.9', '二手回收基准系数'],
    ['ai_evaluate_enabled', '1', '小程序端 AI 估价开关（1 开 0 关）'],
    ['price_valid_days', '3', '配价有效期（天）'],
    ['service_phone', '400-888-8888', '回收服务电话'],
    ['recycle_notice', '回收前请备份数据并退出账号', '回收须知文案'],
    ['max_price_adjust_percent', '20', '单次调价幅度上限（%）'],
    ['eco_co2_per_device', '25', '每台设备回收减少碳排放（kg CO2e）'],
    ['eco_tree_co2_year', '18', '一棵树年吸收二氧化碳（kg）'],
    ['eco_energy_per_device', '8.7', '每台设备回收节省电能（kWh）']
  ],
  [30, 26, 44]
));
body.push(h3('3.3.8 操作日志表 recycle_operation_logs'));
body.push(p('记录后台全部写操作，字段包括操作管理员、模块（order/catalog/platform/link/setting/auth）、动作、明细、来源 IP 与时间，按模块与时间索引。日志写入与业务操作同事务提交，明细内容超长时自动截断至一千字符。'));
body.push(h3('3.3.9 业务订单表 orders（共享）'));
body.push(p('回收订单复用业务订单表，以 order_type 字段区分业务类型。回收订单使用的主要字段包括：订单号 order_id、用户 user_id、设备型号 device_model、设备成色 device_condition、预估价 estimated_price、成交价 actual_price、报价说明 quote_description、订单状态 status、进度 progress、图片 images、取消原因 cancel_reason 以及支付状态 payment_status 等；内部回收申请另以设备来源 device_source 与免付款标记区分。管理后台查询时按订单类型过滤并联查用户昵称、真实姓名与手机号，订单详情额外联查收货地址。'));
body.push(h2('3.4 数据一致性设计'));
body.push(h3('3.4.1 幂等初始化'));
body.push(p('建表语句全部采用 CREATE TABLE IF NOT EXISTS 形式；种子数据写入前先判断目标表是否为空，系统参数采用 INSERT IGNORE 忽略重复键。服务可安全重复启动与升级重启，不会产生重复数据或覆盖已有业务配置。'));
body.push(h3('3.4.2 引用完整性校验'));
body.push(p('配价目录删除操作在应用层前置引用校验：分类下存在品牌时禁止删除分类，品牌下存在型号时禁止删除品牌；数据库层另设外键级联删除作为兜底约束。订单详情联查的用户与地址数据均使用左连接，用户数据异常时不影响订单主信息展示。'));
body.push(h3('3.4.3 业务保护规则'));
body.push(p('系统在多处实施数据保护：估价系数每个因子至少保留两个选项，删除时校验剩余数量；管理员删除时校验系统至少保留一个超级管理员，且不允许删除或禁用自己的账号；调价幅度超限需强制确认；订单完结后拒绝报价与状态变更。上述规则与操作日志配合，保证数据变化始终处于受控状态。'));

body.push(h3('3.5 索引与查询性能设计'));
body.push(h4('3.5.1 索引设计'));
body.push(p('平台按实际查询模式建立索引：分类表对分类编码建唯一索引，支撑编码查重与小程序端按编码合并视觉资源；品牌表按分类外键、型号表按品牌外键建索引，支撑目录树组装与联表查询；型号表另对状态与热门标记建复合索引，支撑上架热门机型的快速筛选；调价记录表按型号与时间、跳转日志表按目标与时间分别建索引，支撑价格走势与点击趋势统计；系统参数表按键唯一索引、操作日志表按模块与时间索引，加速点查与范围检索。全部索引随建表语句一并创建，无需人工维护。'));
body.push(h4('3.5.2 查询优化策略'));
body.push(p('高频列表接口统一采用条件数组参数化拼装加并行查询：数据列表与计数统计两条 SQL 同时发出，一次往返同时拿到结果与汇总；配价目录树接口不做递归联表，而是将分类、品牌、型号三表全量取出后在内存中按主键映射组装树结构，避免深层级联查询的开销；统计接口以条件聚合将多指标合并进单条 SQL，减少往返次数。分页参数在服务端钳制、导出接口设置上限，防止大结果集拖垮服务。'));
body.push(h4('3.5.3 数据量控制'));
body.push(p('系统在各环节内置数据量控制：操作日志明细自动截断至一千字符、单次导出上限五千条、用户下拉检索最多返回三十条、小程序比价平台最多展示二十个、搜索结果最多展示五十条。控制策略既保证长期运行下的响应稳定，也约束了日志与缓存数据的存储增长。'));

// ---------- 第四章 接口设计 ----------
body.push(h1('第四章 接口设计'));
body.push(h2('4.1 接口规范'));
body.push(h3('4.1.1 请求规范'));
body.push(p('管理后台接口统一以 /api 为前缀，采用 JSON 报文，请求体上限 5MB。列表类接口统一接受 page 与 pageSize 分页参数，pageSize 在服务端强制收敛（订单、日志类上限 100 条），防止大结果集拖垮服务。查询类接口通过查询参数传递筛选条件，写操作通过 JSON 请求体传递业务字段。'));
body.push(h3('4.1.2 响应规范'));
body.push(p('响应统一为 success（布尔，标识业务成败）、message（人类可读提示）与 data（业务数据）三段结构；列表类接口的 data 内含 list、total、page、pageSize 分页结构。错误响应携带对应 HTTP 状态码（400 参数错误、401 未登录或登录过期、403 无权限或账号禁用、404 资源不存在、500 服务器错误），前端据此统一弹提示与跳转登录。'));
body.push(h3('4.1.3 鉴权机制'));
body.push(p('除登录、单点登录与健康检查外，全部接口要求携带 Authorization: Bearer 令牌；令牌经服务端校验签名、有效期并回查账号状态与角色。文件下载类接口（订单导出、配价导出）另支持以查询参数 token 传递令牌，适配浏览器新窗口直接下载场景。写操作接口在认证之外叠加角色校验：只读账号被拒绝执行，管理员管理接口仅超级管理员可调用。'));
body.push(h3('4.1.4 通用错误响应'));
body.push(p('接口错误以标准 HTTP 状态码标识类别、响应体携业务提示信息，两类信号的组合覆盖平台的全部错误场景。', { after: 40 }));
body.push(tCaption('表 4-1 HTTP 状态码与业务含义'));
body.push(tbl(
  ['状态码', '含义', '典型场景'],
  [
    ['200', '请求成功', '正常返回数据；业务性失败时仍返回 200，由 success=false 与 message 表达'],
    ['400', '参数错误', '缺少必填字段、金额无效、目标状态非法、编码重复等'],
    ['401', '未认证', '未携带令牌、令牌过期、账号不存在'],
    ['403', '无权限', '账号已禁用、只读账号执行写操作、非超管访问管理员接口'],
    ['404', '资源不存在', '订单、型号、平台等目标不存在'],
    ['500', '服务器错误', '内部异常，统一提示，不向客户端暴露堆栈细节']
  ],
  [12, 16, 72]
));
body.push(p('前端按状态码统一分流处理：401 时清理本地凭证并跳转登录页；400、403、404 时弹出服务端返回的提示信息；500 时提示服务器错误。服务端统一错误处理中间件捕获全部未处理异常，生产环境仅返回通用提示。'));
body.push(h2('4.2 认证与账号接口'));
body.push(tCaption('表 4-2 认证接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['POST /api/auth/login', '账号密码登录，校验 bcrypt 哈希与账号状态，签发 12 小时 JWT'],
    ['POST /api/auth/sso', '以维修后台令牌置换回收后台会话，无账号时自动开通'],
    ['GET /api/auth/me', '获取当前登录管理员信息'],
    ['POST /api/auth/change-password', '修改自身密码，新密码不少于 6 位']
  ],
  [38, 62]
));
body.push(h2('4.3 回收订单接口'));
body.push(tCaption('表 4-3 回收订单接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['GET /api/orders', '分页查询回收订单，支持关键词、状态、成色、日期区间筛选，返回列表与成交额汇总'],
    ['GET /api/orders/:id', '订单详情，含用户联系信息与收货地址拼接'],
    ['POST /api/orders/:id/quote', '提交回收报价，校验金额有效性并写操作日志'],
    ['POST /api/orders/:id/status', '订单状态流转，完结态校验与取消原因记录'],
    ['POST /api/orders', '手动创建线下回收订单，生成 REC 前缀订单号'],
    ['GET /api/orders/export/list', '按当前筛选条件导出 CSV（带 BOM，Excel 直接打开）'],
    ['GET /api/orders/meta/options', '用户搜索下拉（按昵称/姓名/手机号检索）']
  ],
  [38, 62]
));
body.push(h2('4.4 配价库接口'));
body.push(tCaption('表 4-4 配价库接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['GET /api/catalog/tree', '完整目录树（分类—品牌—型号，含配价）'],
    ['GET /api/catalog/models', '型号分页查询，支持分类/品牌/关键词/状态/热门筛选'],
    ['GET /api/catalog/export/models', '配价库全量 CSV 导出'],
    ['POST/PUT/DELETE /api/catalog/categories', '分类增删改（删除前置品牌引用校验）'],
    ['POST/PUT/DELETE /api/catalog/brands', '品牌增删改（删除前置型号引用校验）'],
    ['POST/PUT/DELETE /api/catalog/models', '型号增删改，新增即记初始定价'],
    ['PUT /api/catalog/models/:id/price', '单型号调价，幅度超限需 force 二次确认'],
    ['POST /api/catalog/models/batch-price', '批量调价（百分比/固定值两种模式）'],
    ['GET/PUT /api/catalog/category-factors', '品类估价系数查询与修改（0.1~2）'],
    ['GET /api/catalog/price-logs', '调价记录分页查询，支持按型号过滤查看走势']
  ],
  [42, 58]
));
body.push(h2('4.5 平台与链接接口'));
body.push(tCaption('表 4-5 平台与链接接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['GET/POST/PUT/DELETE /api/platforms', '回收平台档案增删改查，网址格式校验'],
    ['POST /api/platforms/:id/click', '记录平台跳转点击并返回目标地址'],
    ['GET/POST/PUT/DELETE /api/links', '采购链接增删改查，支持分类/关键词/状态筛选'],
    ['POST /api/links/:id/click', '记录链接跳转点击并返回目标地址'],
    ['GET /api/links/click-stats', '近 30 天跳转趋势与点击 TOP10 统计']
  ],
  [42, 58]
));
body.push(h2('4.6 统计接口'));
body.push(tCaption('表 4-6 统计接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['GET /api/stats/dashboard', '看板概览：订单与成交额汇总、30 天趋势、机型排行、类型分布、最新订单、配价与跳转概况、环保贡献折算'],
    ['GET /api/stats/orders', '自定义区间统计：按日/月粒度趋势、状态分布、成色分布、价格段分布、机型 TOP15']
  ],
  [38, 62]
));
body.push(h2('4.7 系统设置与日志接口'));
body.push(tCaption('表 4-7 系统设置与日志接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['GET/PUT /api/system/settings', '系统参数查询与批量保存'],
    ['GET/POST/PUT/DELETE /api/system/condition-rates', '估价因子系数的分组查询、修改、增删（每因子至少保留两项）'],
    ['GET/POST/PUT/DELETE /api/system/admins', '管理员管理，仅超级管理员可操作'],
    ['GET /api/system/operation-logs', '操作日志分页查询（按模块过滤）'],
    ['GET /api/logs', '操作日志多条件检索（模块/关键词/日期）']
  ],
  [46, 54]
));
body.push(h2('4.8 小程序端公开接口'));
body.push(p('以下接口由小程序服务端提供，不要求管理后台令牌，供小程序回收模块拉取后台维护的公共数据。当配价表尚未初始化时返回 managed=false 标记，小程序端自动回退本地内置数据，保证离线与冷启动可用。', { after: 40 }));
body.push(tCaption('表 4-8 小程序回收公开接口清单'));
body.push(tbl(
  ['方法与路径', '功能说明'],
  [
    ['GET /api/recycle/catalog', '上架配价目录（分类—品牌—型号），结构与小程序本地数据一致'],
    ['GET /api/recycle/platforms', '启用中的回收平台列表（比价区数据源）'],
    ['POST /api/recycle/click', '上报平台/链接跳转点击（来源标记 mini）'],
    ['GET /api/recycle/config', '估价配置（系统参数与因子系数），供小程序热更新'],
    ['POST /api/recycle/evaluate', 'AI 回收估价（DeepSeek），失败返回降级提示']
  ],
  [38, 62]
));

// ---------- 第五章 小程序端功能设计 ----------
body.push(h1('第五章 小程序端功能设计与说明'));
body.push(h2('5.1 回收主页'));
body.push(h3('5.1.1 页面布局与视觉设计'));
body.push(h4('5.1.1.1 页面信息架构'));
body.push(p('回收主页自上而下分为四个功能区域：顶部搜索区（常驻搜索栏，点击唤起全屏搜索面板）、分类导航区（横滑分类条，每项含图标与分类名）、品牌型号区（按品牌分组的型号卡片瀑布，为主体区域）与平台比价区（页面底部的回收平台卡片列表）。页面首次进入即以本地数据完成首屏渲染，随后静默更新云端配价，用户无感知。小程序整体开启深色模式适配，页面配色跟随系统外观自动切换，夜间环境下浏览体验一致。'));
body.push(h4('5.1.1.2 分类视觉体系'));
body.push(p('平台为十二个回收分类建立统一视觉档案，每个分类绑定图标、场景化文案与身份徽标三要素：例如手机分类对应图标 📱、场景文案「双摄旗舰」、徽标「手机」；显卡分类对应场景文案「图形算力」等。场景文案概括该品类最具回收价值的特征，在分类主图上叠加展示，强化用户对品类价值的感知。'));
body.push(tCaption('表 5-1 回收分类视觉体系'));
body.push(tbl(
  ['分类', '场景文案', '徽标', '分类', '场景文案', '徽标'],
  [
    ['手机', '双摄旗舰', '手机', '相机', '影像器材', '相机'],
    ['电脑', '轻薄性能', '电脑', '游戏机', '娱乐主机', '游戏'],
    ['平板', '大屏便携', '平板', '无人机', '航拍飞行', '无人机'],
    ['智能穿戴', '腕上智能', '穿戴', '服务器', '企业算力', '服务器'],
    ['显示器', '高清大屏', '显示器', '网络设备', '网络互联', '网络设备'],
    ['生活数码', '生活设备', '数码', '显卡', '图形算力', '显卡']
  ],
  [15, 19, 12, 18, 20, 16]
));
body.push(h4('5.1.1.3 色彩继承与降级'));
body.push(p('型号卡片主题色优先取云端型号自带颜色；云端未携带颜色时，自动沿用同品牌本地目录第一个型号的颜色，保证同品牌卡片观感一致；品牌整体无色时回退分类主题色。分类主图加载失败时清空图片地址并以图标兜底显示，避免出现破图。'));
body.push(h3('5.1.2 分类浏览'));
body.push(h4('5.1.2.1 分类导航交互'));
body.push(p('分类导航条支持横向滑动，点击任一分类后，主体区域立即切换为该分类的品牌型号列表，同时重置品牌选中态与滚动锚点。当前分类高亮显示，切换过程无网络等待（数据已在本地/缓存就绪）。'));
body.push(h4('5.1.2.2 品牌分区定位'));
body.push(p('每个分类下按品牌分区展示，分区头部含品牌字标、品牌名与该品牌型号数量；点击分区头部时，页面平滑滚动定位至对应品牌区块（锚点滚动后三百毫秒自动复位锚点状态，保证重复点击仍可定位），方便在型号较多的分类中快速跳转。'));
body.push(h3('5.1.3 型号选择与估价入口'));
body.push(h4('5.1.3.1 型号卡片信息结构'));
body.push(p('型号卡片展示四类信息：型号名称（截取前两个语义词作为家族标签，如「iPhone 17」）、规格要点（按分隔符拆分为标签数组，如「A19 Pro芯片」「6.9英寸」）、回收基准价（醒目大字）与品类视觉元素（图标/主图/场景文案）。基准价即该型号最佳成色的最高回收价，为用户建立价格锚点。'));
body.push(h4('5.1.3.2 跳转参数传递'));
body.push(p('点击型号卡片跳转估价引导页时，以查询参数完整传递估价所需上下文：分类标识与名称、品牌标识/名称/字标/品牌色、型号标识/名称/基准价/规格/主题色、品类视觉元素及内部人员标记，全部参数经 URI 编码，估价页解码后即可独立运行，支持从搜索结果等多种入口进入。'));
body.push(h3('5.1.4 全局型号搜索'));
body.push(h4('5.1.4.1 搜索入口与面板'));
body.push(p('点击主页顶部搜索栏唤起全屏搜索面板，面板自上而下包含输入框（带清空按钮）、搜索结果列表与搜索历史三区。输入过程按三百毫秒防抖触发检索，避免高频计算；软键盘确认搜索时保存搜索词；点击面板空白区或取消按钮关闭面板并清空输入。'));
body.push(h4('5.1.4.2 全局搜索索引'));
body.push(p('目录数据加载完成后，页面将全部型号扁平化为全局搜索索引，每条索引记录型号标识、型号名、规格、基准价、主题色、品牌信息、分类信息与品类视觉元素。索引构建一次、内存复用，检索时不产生额外网络请求，搜索结果可直接携带完整上下文跳转估价页。'));
body.push(h4('5.1.4.3 多关键词模糊匹配'));
body.push(p('检索策略第一通道为多关键词 AND 匹配：将输入按空格拆分为多个搜索词，要求每个搜索词都出现在由型号名、品牌名、规格、分类名拼接的组合文本中。例如输入「苹果 15」可同时命中品牌「苹果」与型号包含「15」的机型，多条件组合逐步收敛结果。匹配全程忽略大小写。'));
body.push(h4('5.1.4.4 无空格模糊匹配'));
body.push(p('第二通道为无空格模糊匹配：将输入与组合文本分别去除全部空格后整体包含匹配，弥补用户连拼输入的习惯差异——输入「iphone17」即可命中「iPhone 17」。两通道任一命中即保留，合并结果最多展示五十条，兼顾召回率与页面性能。'));
body.push(h4('5.1.4.5 搜索历史管理'));
body.push(p('搜索词经确认或点击结果后保存至本地存储：按最近使用排序、自动去重、最多保留十条。点击历史词立即以该词执行检索；长按或点击清空按钮（带确认弹窗）可整体清除。历史数据存于设备本地，不上传服务器。'));
body.push(...fig('图 5-1 型号搜索面板（可插入截图）'));
body.push(h3('5.1.5 平台比价'));
body.push(h4('5.1.5.1 比价区数据来源'));
body.push(p('主页底部比价区展示后台「回收平台管理」中处于启用状态的平台档案，每张卡片呈现平台字标（品牌色圆形底）、平台名称、类型标签（回收平台/采购渠道/比价参考）、平台说明、服务方式与结算方式，帮助用户横向了解各平台回收条件。数据加载失败时比价区整体隐藏，不占页面空间。'));
body.push(h4('5.1.5.2 跳转与剪贴板交互'));
body.push(p('受小程序运行环境限制，无法直接跳转外部网址。点击平台卡片时弹出说明弹窗，展示平台名称与完整网址，用户点击「复制链接」后网址写入剪贴板并可粘贴到浏览器打开，弹窗文案明确引导操作路径，降低使用门槛。'));
body.push(h4('5.1.5.3 点击上报'));
body.push(p('平台卡片被点击时，无论用户最终是否复制链接，小程序均异步上报一次跳转点击（来源标记为小程序端）。点击数据汇入后台跳转统计，与后台发起的跳转点击共同构成平台引流效果分析的数据基础。'));
body.push(h3('5.1.6 云端配价加载机制'));
body.push(h4('5.1.6.1 三步加载时序'));
body.push(p('主页启动按固定时序执行三步加载：第一步，同步应用本地内置配价目录渲染页面，保证冷启动秒开与完全离线可用；第二步，异步请求云端配价接口，云端返回有效目录时重新渲染并标记为后台托管状态；第三步，异步加载平台比价数据。三步之间互不阻塞，任何一步失败均不影响已渲染内容。'));
body.push(h4('5.1.6.2 本地缓存策略'));
body.push(p('云端目录拉取成功后连同过期时间戳写入本地缓存，缓存有效期十分钟。有效期内再次进入主页直接使用缓存目录，不发网络请求；缓存过期或不存在时才重新拉取。该策略在配价时效性与接口压力之间取得平衡——后台调价后最迟十分钟内在用户端生效。'));
body.push(h4('5.1.6.3 视觉资源合并'));
body.push(p('云端目录仅承载业务数据（分类、品牌、型号、价格），不含图片等视觉资源。拉取成功后，页面按分类编码将本地视觉档案（场景主图、图标、场景文案、徽标）与云端目录合并：分类层合并场景图与图标，品牌层合并品牌字标，型号层在云端未带颜色时回填本地同品牌颜色，保证云端数据驱动的界面与本地渲染观感完全一致。'));
body.push(h4('5.1.6.4 请求去重'));
body.push(p('目录加载采用进行中请求去重：同一时刻若已有未完成的目录请求，后续调用直接复用该请求的结果，避免并发进入页面时重复拉取与重复渲染。请求结束后（无论成败）自动清去重标记，下次进入重新发起。'));
body.push(h2('5.2 估价引导'));
body.push(h3('5.2.1 评估流程设计'));
body.push(h4('5.2.1.1 题目结构'));
body.push(p('估价引导共七题：前六题为设备状况单选题（成色、屏幕、功能、版本、配件、维修史），每题选项附系数与说明文案；第七题为可选文本补充题（如进水、摔过、电池鼓包等特殊情况），支持填写说明或跳过，不参与系数计算。每屏一题，顶部显示步骤进度，整体流程通常一分钟内完成。'));
body.push(h4('5.2.1.2 动画与状态管理'));
body.push(p('题目切换采用三态动画（进入/可见/离场）：用户点选选项后当前题目卡片执行离场动画，三百五十毫秒后切入下一题并播放进入动画；动画期间锁定交互（防连点），避免快速点击导致的漏答或跳题。估价进行中与提交中同样设置状态锁。'));
body.push(h4('5.2.1.3 中途退出保护'));
body.push(p('用户在作答中途点击返回时弹出确认弹窗，提示已填写信息将丢失；仅在估价已完成或尚未作答时允许直接返回，防止误触退出导致重复作答。'));
body.push(...fig('图 5-2 估价问答界面（可插入截图）'));
body.push(h3('5.2.2 评估因子设计'));
body.push(p('六项选择题因子及其选项系数如下表所示（系数可由后台在线调整，下表为默认值）。因子设计覆盖二手设备价值评估的完整维度：成色与屏幕决定外观折价，功能决定可用性折价，版本影响流通价，配件与维修史影响收货后的整备成本。', { after: 40 }));
body.push(tCaption('表 5-2 估价评估因子与默认系数'));
body.push(tbl(
  ['因子', '问题', '选项与默认系数'],
  [
    ['设备成色', '您的设备成色如何', '全新未使用 1.0；九成新 0.9；八成新 0.8；七成新 0.7；六成新及以下 0.55'],
    ['屏幕状况', '屏幕状况如何', '完好无损 1.0；轻微划痕 0.9；明显划痕 0.75；碎裂/坏点 0.4；完全损坏 0.15'],
    ['功能状况', '设备功能是否正常', '全部正常 1.0；部分小问题 0.7；较大故障 0.4；无法使用 0.15'],
    ['设备版本', '设备是什么版本', '国行 1.0；港版/澳版 0.95；国际版 0.85；不确定 0.9'],
    ['配件状况', '配件是否齐全', '原装全配 1.0；有充电器数据线 0.98；仅裸机 0.93'],
    ['维修史', '设备是否有维修史', '从未维修 1.0；官方维修 0.92；第三方维修 0.75；不确定 0.85'],
    ['补充说明', '其他需要说明的问题', '文本输入，可选，不参与系数计算']
  ],
  [14, 22, 64]
));
body.push(h3('5.2.3 本地估价算法'));
body.push(h4('5.2.3.1 实时估价'));
body.push(p('用户每作答一题，页面即时重算当前预估价：以型号基准价为基础，将已作答因子的系数依次连乘，再乘以二手基准系数（默认 0.9，后台可调），结果四舍五入显示。实时估价让用户在作答过程中即可感知各项状况对价格的影响，形成合理预期。'));
body.push(h4('5.2.3.2 结算估价与价格区间'));
body.push(p('全部问题作答完成后执行结算计算，算法与实时估价一致，逐项乘以成色、屏幕、功能、版本、配件、维修史六因子系数后叠加二手基准系数。在点估价基础上生成价格区间：下限为点估价的 90%，上限为 105%。区间围绕点估价小幅浮动而非放宽下限，避免低区间误导用户，符合回收报价「验机后按实际状况定价」的业务惯例。'));
body.push(h4('5.2.3.3 估价说明生成'));
body.push(p('系统自动生成结构化估价说明文字，概述品牌型号与成色、屏幕、功能、版本四项关键状况，并给出估价金额与区间。该说明在 AI 估价不可用时直接展示，保证任何情况下用户都能获得有依据的报价解释。'));
body.push(h3('5.2.4 AI 大模型辅助估价'));
body.push(h4('5.2.4.1 请求设计'));
body.push(p('结算时页面将产品信息（分类、品牌、型号、基准价、规格）与全部作答摘要（因子名+选项文案）提交至小程序服务端的 AI 估价接口，请求携带用户登录令牌，超时时间与网络异常均有兜底处理，不会阻塞估价流程。'));
body.push(h4('5.2.4.2 提示词设计'));
body.push(p('服务端以系统提示词约束大模型扮演电子产品回收估价专家，要求综合型号市场二手行情、成色使用痕迹、屏幕状况、功能完好度、配件齐全度、维修史与设备版本七类因素估价；采样温度设为 0.3 以稳定输出；用户提示词中嵌入完整产品信息与逐项设备状况，并强制要求仅返回 JSON。'));
body.push(h4('5.2.4.3 结果解析'));
body.push(p('大模型返回文本经正则提取 JSON 对象后解析为三个字段：price（预估回收价，整数元，校验必须为数字后取整）、reason（估价说明，两百字以内，缺省时自动补默认文案）与 confidence（置信度 high/medium/low）。解析失败或价格无效即视为本次 AI 估价失败。'));
body.push(h4('5.2.4.4 降级策略'));
body.push(p('降级按三层设计：接口未配置 AI 密钥时直接抛出异常；调用失败、返回异常或超时（十五秒）时返回错误；前端收到任一失败信号即自动改用本地多因子模型估价结果与本地估价说明，估价流程不中断。后台另提供 AI 估价总开关，关闭后小程序端跳过 AI 调用直接本地估价。'));
body.push(...fig('图 5-3 估价结果展示（可插入截图）'));
body.push(h3('5.2.5 估价配置热更新'));
body.push(p('估价引导页启动时异步拉取后台估价配置接口：后台已初始化时，以返回的二手基准系数覆盖本地默认值，并按选项匹配值将后台维护的因子系数逐项覆盖本地题目选项（后台新增的选项档位同步生效）；未初始化或拉取失败时保持本地默认。该机制使后台调参后小程序端无需发版即可生效，估价口径始终与后台一致。'));
body.push(h3('5.2.6 回收地址选择'));
body.push(h4('5.2.6.1 地址加载与格式化'));
body.push(p('页面展示时自动拉取当前登录用户的地址簿并做字段归一化格式化（兼容多端字段命名差异），默认选中标记为默认的地址；无默认地址时选中第一条；地址为空时引导用户新增。地址加载失败时清空选择并提示，不阻塞估价流程。'));
body.push(h4('5.2.6.2 地址选择与新增'));
body.push(p('点击地址区打开地址选择弹层，列表展示联系人、电话与省市区详址，点选即切换；弹层内提供「新增地址」入口跳转地址编辑页，新增完成返回后自动刷新地址列表并保持弹层状态。提交订单前未选择地址时给予明确提示。'));
body.push(h4('5.2.6.3 联系客服入口'));
body.push(p('估价与提交环节设有联系客服入口：用户对估价结果有疑问或需人工确认特殊机型时，点击后跳转客服页继续沟通。实现上注意小程序标签页必须以切换标签接口打开——普通页面跳转接口对标签页会静默失败，该平台特性已在实现中显式处理，保证入口在任何状态下均可正常到达客服会话。'));
body.push(h3('5.2.7 订单提交与确认'));
body.push(h4('5.2.7.1 订单数据组装'));
body.push(p('提交时系统组装完整回收订单：订单类型 recycle、型号与分类标识、设备成色、估价金额、逐题评估明细（拼装为结构化描述文本）、回收服务方式、收货地址（联系人+电话+省市区+详址）、支付状态与内部标记。评估明细同时以人读格式写入订单描述，便于后台运营直接阅读用户作答内容。'));
body.push(h4('5.2.7.2 普通用户金额确认'));
body.push(p('普通用户点击提交后弹出金额确认弹窗，逐项展示市场基准价（全新）、设备成色、本次回收估价，以及估价相对基准价的百分比并注明属合理区间，帮助用户在提交前复核报价逻辑；确认后订单提交，成功提示并自动返回，失败给出具体原因。'));
body.push(...fig('图 5-4 回收金额确认弹窗（可插入截图）'));
body.push(h4('5.2.7.3 内部人员免付款回收'));
body.push(p('登录用户为公司内部人员（角色标记 internal）时，估价流程自动切换为内部回收模式：提交前必须选择设备来源（项目返修/仓库/固定资产），确认弹窗改为内部回收申请说明，订单以免付款状态提交，由管理员确认后安排回收。内部申请与普通订单共用同一订单表，通过免付款标记与设备来源字段区分，后台统一处理。'));
body.push(h4('5.2.7.4 防重复提交'));
body.push(p('提交全程设置提交中状态锁：锁定期内按钮点击、重复请求均被拦截；订单提交完成（成功或失败）后释放锁。配合按钮加载态提示，杜绝网络延迟导致的重复建单。'));

body.push(h2('5.3 小程序端关键实现机制'));
body.push(p('本节进一步说明回收主页与估价引导两个模块背后的核心实现机制，包括目录渲染管线、搜索匹配算法、估价引擎、云端加载与订单提交链路五个部分。'));
body.push(h3('5.3.1 目录渲染管线实现'));
body.push(p('目录数据无论来自本地内置还是云端，均经同一条渲染管线加工：单次遍历将配价数据构建为两份结构——渲染结构按分类、品牌、型号三级组织，逐层合并视觉资源（分类场景图与图标、品牌字标、型号颜色回退），并将规格文本按分隔符拆分为标签数组、截取型号名前两个语义词生成家族标签；搜索索引则将全部型号扁平化，每条记录附带品牌信息、分类信息与视觉上下文，供检索结果直接跳转使用。两份结构构建完成后一次性提交渲染框架，避免逐条更新带来的多次通信开销——这是回收主页在数百型号规模下仍能首屏秒开的关键。'));
body.push(h3('5.3.2 搜索匹配算法实现'));
body.push(p('检索函数首先将输入统一转为小写并按空白拆分为词数组，同时生成去除全部空格的紧凑串；对每条索引以型号名、品牌名、规格、分类名四字段拼接组合文本，并生成对应的紧凑版本。命中条件为双通道之一：其一，全部搜索词都在组合文本中出现（多关键词 AND 匹配）；其二，紧凑串被紧凑组合文本包含（无空格整体匹配，使连拼输入命中带空格词）。命中结果截取前五十条渲染。输入侧以三百毫秒定时器防抖，仅最后一次输入触发检索；索引构建一次后内存复用，整个搜索过程零网络请求、计算量可控。'));
body.push(h3('5.3.3 估价引擎实现'));
body.push(p('估价引擎以作答表为核心数据结构：用户每答一题，即以题目标识为键写入选项值、选项文案与系数三元组。实时估价在每次作答后遍历作答表，将已答因子系数连乘后叠加二手基准系数刷新显示；结算计算按成色、屏幕、功能、版本、配件、维修史六因子显式连乘，保证任一因子缺答时不参与折算；价格区间以点估价分别乘以 0.9 与 1.05 后取整生成。后台估价配置到达后，引擎按选项匹配值逐项覆盖本地系数——题目文案不变、仅系数热替换，实现估价口径的在线更新而无需小程序发版。'));
body.push(h3('5.3.4 云端目录加载实现'));
body.push(p('加载器以模块级进行中请求变量实现并发去重：请求发起期间后续调用直接复用同一承诺对象，结束后自动清空；请求成功且云端目录非空时，先按分类编码与品牌名两级映射将本地视觉档案合并进云端目录（场景图、图标、字标、颜色回退），再连同十分钟过期时间戳写入本地缓存；有效期内读取缓存直接返回，过期或云端未初始化时返回本地目录并标记非托管状态。加载器同时封装平台列表、估价配置与点击上报三类接口，失败一律静默降级，不向用户抛出错误提示。'));
body.push(h3('5.3.5 订单提交链路实现'));
body.push(p('提交链路依次完成五步：先做前置校验（未选地址、内部人员未选设备来源时中断并提示）；随后将逐题作答拼装为结构化评估描述（题面加作答文案以分号连接），组装完整订单数据（订单类型、设备标识、成色、估价金额、地址、支付状态与内部标记）；再以确认弹窗的承诺化封装等待用户确认——普通用户展示市场基准价对比与成色折算百分比，内部人员展示设备来源确认；确认后调用建单接口并按返回结果分别提示成功或具体失败原因；异常路径统一释放提交锁。全程以提交状态锁拦截重复点击，杜绝延迟重试造成的重复建单。'));

// ---------- 第六章 管理后台功能设计 ----------
body.push(h1('第六章 管理后台功能设计与说明'));
body.push(h2('6.1 登录与认证'));
body.push(h3('6.1.1 账号密码登录'));
body.push(h4('6.1.1.1 校验流程'));
body.push(p('管理员在登录页输入账号与密码提交后，服务端依次校验：账号存在性（不存在时统一返回账号或密码错误）、账号状态（禁用账号返回禁用提示）、bcrypt 哈希匹配（不匹配同样返回账号或密码错误）。校验通过后更新最近登录时间、记录登录操作日志并签发令牌，前端保存令牌与账号信息后按登录前目标路径跳转。'));
body.push(h4('6.1.1.2 登录安全设计'));
body.push(p('登录失败不区分具体原因，防止账号枚举探测；密码全程仅以哈希比对，日志中不落密码字段；令牌有效期为十二小时，到期后前端统一提示重新登录并携当前路径回跳，避免登录后丢失操作上下文。'));
body.push(...fig('图 6-1 管理后台登录页（可插入截图）'));
body.push(h3('6.1.2 单点登录'));
body.push(h4('6.1.2.1 令牌置换流程'));
body.push(p('管理后台与维修后台管理系统同域部署。用户已在维修后台登录时，回收后台前端读取维修后台令牌并调用单点登录接口：服务端携带该令牌向维修后台用户信息接口发起服务端对服务端校验（不走前端、不可伪造），主系统校验通过后才认可该凭证，随后为对应用户签发回收后台自己的会话令牌。'));
body.push(h4('6.1.2.2 自动开户'));
body.push(p('以维修后台用户名匹配回收账号：账号已存在且启用时直接发放会话；账号不存在时自动开通（默认管理员角色、随机高强度密码，仅可经单点登录进入，无需知晓密码），实现维修后台用户首次进入即用；账号被禁用时拒绝并提示联系超级管理员。单点登录成功同样记录操作日志。'));
body.push(h3('6.1.3 角色权限体系'));
body.push(h4('6.1.3.1 角色定义'));
body.push(tCaption('表 6-1 后台角色权限矩阵'));
body.push(tbl(
  ['角色', '查询与导出', '业务写操作', '管理员管理', '说明'],
  [
    ['super 超级管理员', '允许', '允许', '允许', '系统全部权限，含账号管理'],
    ['admin 管理员', '允许', '允许', '拒绝', '全部业务操作权限'],
    ['viewer 只读账号', '允许', '拒绝', '拒绝', '仅查询、查看与导出']
  ],
  [24, 18, 18, 16, 24]
));
body.push(h4('6.1.3.2 服务端实施'));
body.push(p('权限在服务端三级中间件实施：认证中间件校验令牌并实时回查账号最新状态与角色（账号禁用即刻生效）；写操作中间件拦截 viewer 角色的一切写请求；超管中间件保护管理员管理接口。即使绕过前端直接调用接口，越权请求也会被服务端拒绝并返回明确错误。'));
body.push(h4('6.1.3.3 前端配合'));
body.push(p('前端按角色控制界面呈现：只读账号隐藏或禁用写操作按钮，普通管理员不显示管理员管理入口；个人菜单展示当前角色标签。前端控制仅作为体验优化，安全边界始终在服务端。'));
body.push(h3('6.1.4 修改密码'));
body.push(p('任意管理员可在右上角个人菜单发起密码修改：需验证原密码，新密码不少于六位且需二次确认输入，修改成功后记录操作日志。密码修改即时生效，下次登录使用新密码。'));
body.push(h2('6.2 数据看板'));
body.push(p('数据看板为后台默认首页，面向运营人员的日常经营监控场景，自上而下分为环保贡献区、经营指标卡区、图表区与最新订单区四个部分，全部数据由统计概览接口一次返回，页面加载时整页loading、加载完成后各区块同时呈现。'));
body.push(h3('6.2.1 环保贡献区'));
body.push(h4('6.2.1.1 指标定义'));
body.push(p('环保贡献区以四张主题卡片横排展示绿色回收成效：累计回收设备（台）、减少碳排放（kg CO2e）、等效一年植树量（棵）与节省电能（kWh）。每张卡片含主题图标、大数字与辅助说明文案（如减碳卡片附「相当于少开车绕城 N 公里」的生活化换算），将抽象环保数据转译为可感知的表达。'));
body.push(h4('6.2.1.2 换算模型'));
body.push(p('环保指标以累计回收完成台数为唯一基数，按系统设置中的三个行业换算系数折算：每台设备减少碳排放默认 25kg CO2e、一棵树年吸收二氧化碳默认 18kg、每台设备节省电能默认 8.7kWh。等效植树量 = 完成台数 × 单台减碳量 ÷ 单树年吸碳量。系数可在系统设置中按企业实际口径调整，看板与大屏同步生效。'));
body.push(h4('6.2.1.3 数字滚动动效'));
body.push(p('四项环保数字采用零依赖的数字滚动动画呈现：接口返回后数值在约 1.2 秒内从零平滑滚动至目标值（带小数位的指标保留一位小数），强化数据「实时生长」的观感，同时避免大数字突变造成的阅读跳跃。'));
body.push(h3('6.2.2 经营指标卡区'));
body.push(h4('6.2.2.1 指标清单'));
body.push(tCaption('表 6-2 数据看板经营指标'));
body.push(tbl(
  ['指标', '口径说明'],
  [
    ['回收订单总量', '全部回收订单累计数量'],
    ['待确认订单', '当前处于待确认状态、需要运营跟进的订单数'],
    ['本月订单数', '自然月内创建的回收订单数量'],
    ['累计回收成交额', '已完成订单的成交价合计（元）'],
    ['在售配价机型', '配价库中处于上架状态的型号数量'],
    ['平台/链接跳转次数', '回收平台与采购链接的累计跳转点击总量']
  ],
  [28, 72]
));
body.push(h4('6.2.2.2 指标联动说明'));
body.push(p('待确认订单指标直接对应订单管理的处理队列，点击最新订单表格任一行可直达订单列表并自动打开该订单详情；成交额指标与订单筛选结果的成交额汇总口径一致，看板与明细数据同源，避免两套口径造成的管理困扰。'));
body.push(h3('6.2.3 订单趋势图'));
body.push(p('图表区左侧为近三十天回收订单趋势折线图：横轴按日展示，双纵轴分别绘制每日订单量与每日已完成订单成交额。趋势图帮助运营识别获客波动与回收旺季，例如新机型发布后的旧机回收高峰、节假日促销带来的订单增长等。'));
body.push(p('趋势数据由统计接口按日分组聚合一次性生成：仅统计回收类型订单，订单量按创建时间计数，成交额仅累加已完成订单，与列表汇总口径一致；连续日期缺口在图表中自然呈现为零值点，便于识别空档期。'));
body.push(h3('6.2.4 设备类型分布'));
body.push(p('图表区右侧为近一百八十天设备类型分布饼图：订单中的设备类型编号映射为可读名称（手机、电脑、平板、手表/穿戴、耳机音频、相机、游戏机、无人机、其他等），按订单量占比呈现。分布数据用于指导配价库建设重点与回收渠道选型，例如手机类占比高则优先维护手机配价的时效性。'));
body.push(p('类型映射在服务端完成：编号与名称的对照表内置于统计接口，未识别的编号统一归入「其他」类，保证饼图各扇区语义明确、不出现裸编号。'));
body.push(h3('6.2.5 最新订单与配价概况'));
body.push(p('看板下部为最新回收订单表格，列出最近八笔订单的订单号、设备型号、状态、预估价、成交价与创建时间，点击行直达订单处理；同期统计接口还返回配价库概况（上架分类数、机型数、平台数、链接数）与近三十天跳转点击趋势，作为运营巡检的辅助信息。'));
body.push(h3('6.2.6 数据组织与刷新'));
body.push(p('看板全部指标、图表与列表数据由单一统计接口聚合返回，避免多次请求的加载时序问题；页面进入时整体加载并显示加载态。订单与配价数据变化后，重新进入看板即刷新，保证运营看到的经营快照始终基于最新数据。'));
body.push(...fig('图 6-2 数据看板（可插入截图）'));
body.push(h2('6.3 数据大屏'));
body.push(p('数据大屏面向展厅、门店大电视等公开展示场景，与看板共用统计接口但采用完全独立的深色视觉体系，支持全屏投放与自动轮播刷新。'));
body.push(h3('6.3.1 布局与视觉设计'));
body.push(p('大屏采用深色科技风底色，叠加网格背景与两组彩色光晕装饰，顶部标题栏下方设扫描线动效，营造数据监控氛围。整体版面自上而下依次为标题栏、KPI 数字带、近三十天回收趋势面板、设备类型分布与热门机型双栏面板、绿色环保贡献面板；内容超出一屏时支持滚动浏览，各面板边框采用统一的面板样式语言。'));
body.push(h3('6.3.2 顶部标题栏与时钟'));
body.push(p('标题栏居中展示「电子产品回收综合服务平台 · 数据大屏」主标题与装饰圆点，左侧展示带呼吸圆点的「实时监控」状态标签，右侧展示实时时钟（时间、日期与星期）与全屏控制按钮。时钟逐秒刷新，为展厅场景提供常显时间信息。'));
body.push(h3('6.3.3 KPI 数字带'));
body.push(p('KPI 数字带以图标卡形式横排展示核心经营指标（订单总量、待确认、本月订单、成交额、机型数、跳转量等），每卡含彩色主题图标、大号数字与指标名称，数字采用与看板一致的滚动动效，加载完成后依次呈现，适合远距离观看。'));
body.push(h3('6.3.4 趋势与排行面板'));
body.push(p('趋势面板以面积折线图展示近三十天回收订单量与成交额走势；双栏面板左侧为设备类型分布玫瑰图（近一百八十天），右侧为热门回收机型 TOP6 条形排行。三个图表共用 ECharts 渲染，配色与深色主题统一，直观呈现业务结构与热点机型。'));
body.push(h3('6.3.5 绿色环保贡献面板'));
body.push(p('环保面板将看板同源的环保折算数据以四行图标列表呈现：回收设备台数（台设备重获新生）、减碳量（kg 减碳排放）、等效植树（棵）与节省电能（kWh），每行配语义图标与副文案。环保数据置于大屏底部压轴，契合绿色回收的品牌主张。'));
body.push(h3('6.3.6 全屏与投放'));
body.push(p('大屏右上角提供一键全屏按钮，适配 1080P 及以上大屏投放；页面支持浏览器原生全屏协议，退出全屏即回到普通页面模式。大屏可长时间挂机运行，数据随刷新周期更新。'));
body.push(...fig('图 6-3 数据大屏（可插入截图）'));
body.push(h2('6.4 回收订单管理'));
body.push(h3('6.4.1 订单列表与筛选'));
body.push(h4('6.4.1.1 筛选条件'));
body.push(p('列表顶部提供四类筛选条件的自由组合：关键词（同时匹配订单号、设备型号、用户昵称、真实姓名与手机号）、订单状态（待确认/已报价/已确认/处理中/已完成/待评价/已取消）、设备成色（优+/优/良/中/差/全新）与创建日期区间（起止日期）。筛选条件变更后即时刷新列表。'));
body.push(h4('6.4.1.2 列表字段'));
body.push(p('列表以表格展示订单号、设备型号、成色（转中文标签）、预估价、成交价、状态（彩色标签）、用户信息（昵称/姓名/电话）与创建时间等字段；订单图片字段解析为数组供预览。支持从看板等入口携带订单标识进入时自动打开对应订单详情（定位联动）。'));
body.push(h4('6.4.1.3 汇总信息与分页'));
body.push(p('列表上方实时展示两项汇总：当前筛选条件命中的订单总数与其中已完成订单的成交额合计，方便运营在筛选后直接掌握处理量与业绩规模。分页组件支持调整每页条数（服务端上限一百条），大结果集下性能稳定。'));
body.push(...fig('图 6-4 回收订单列表（可插入截图）'));
body.push(h3('6.4.2 订单详情'));
body.push(h4('6.4.2.1 信息分区'));
body.push(p('订单详情完整聚合五类信息：基础信息（订单号、状态、创建/更新/完成时间）、设备信息（分类、品牌、型号、成色、规格）、价格信息（预估价、成交价、报价说明）、评估明细（用户在小程序端的逐题作答，以人读文本呈现）与用户信息（昵称、真实姓名、手机号、收货地址）。'));
body.push(h4('6.4.2.2 动态列适配'));
body.push(p('回收订单与小程序共用业务订单表，表结构随小程序服务端迭代。后台在查询前读取数据库元数据获取实际存在的列集合，可选列按需拼接、缺失列以空值占位，不同部署环境间结构差异被透明屏蔽，详情接口响应结构保持稳定。'));
body.push(h4('6.4.2.3 地址拼接'));
body.push(p('收货地址联查用户地址表，将省市区与详细地址拼接为完整地址串并附联系人与电话；用户未填地址时该字段为空但不影响其他信息展示。地址表同样做动态列适配。'));
body.push(h3('6.4.3 报价处理'));
body.push(h4('6.4.3.1 输入校验'));
body.push(p('报价提交前执行双重校验：金额必须为有效数字且不小于零；订单必须存在且未处于已完成或已取消状态。已完结订单提交报价返回明确错误提示，防止对历史订单误操作。'));
body.push(h4('6.4.3.2 数据落库与联动'));
body.push(p('报价通过后，系统同时更新成交价、报价金额、报价说明与报价状态，记录报价创建时间及报价人（表结构支持时），订单状态自动流转为已报价，用户端随即可见最新报价。报价动作写入操作日志，包含订单号与报价金额，形成报价责任链。'));
body.push(h3('6.4.4 状态流转'));
body.push(h4('6.4.4.1 状态机定义'));
body.push(tCaption('表 6-3 回收订单状态定义'));
body.push(tbl(
  ['状态', '标识', '含义与允许流转'],
  [
    ['待确认', 'pending', '新订单初始状态，可报价或流转至任意后续状态'],
    ['已报价', 'quoted', '后台已提交报价，等待用户确认'],
    ['已确认', 'confirmed', '用户确认报价，进入履约准备'],
    ['处理中', 'processing', '回收物流/验机进行中'],
    ['已完成', 'completed', '交易完结，写完成时间与进度满格，不可再变更'],
    ['待评价', 'review', '履约完成待用户评价的过渡状态'],
    ['已取消', 'cancelled', '任一非完结状态可取消，记录取消原因，不可再变更']
  ],
  [12, 16, 72]
));
body.push(h4('6.4.4.2 流转校验'));
body.push(p('状态变更接口执行三重校验：目标状态必须是合法状态枚举、订单当前不能处于完结态（已完成/已取消）、目标状态不能与当前状态相同。校验通过后更新状态与更新时间，并记录包含前后状态中文标签的操作日志，取消时另记录取消来源与原因说明。'));
body.push(h4('6.4.4.3 完成与取消处理'));
body.push(p('流转至已完成时系统自动写入完成时间并将订单进度置为 100%；流转至已取消时写入取消时间、取消原因标记（后台取消）与原因描述。完结态订单的报价与状态接口均被拒绝，保证历史数据的最终一致性。'));
body.push(h3('6.4.5 手动创建订单'));
body.push(h4('6.4.5.1 用户检索与选择'));
body.push(p('登记线下回收业务时，运营人员通过用户下拉检索目标用户（按昵称、姓名或手机号模糊匹配，最多返回三十条），选择用户后填写设备型号、成色、预估价与服务方式（默认到店），设备型号为必填项。'));
body.push(h4('6.4.5.2 订单号生成规则'));
body.push(p('系统为手动订单生成 REC 前缀的唯一订单号：REC + 毫秒级时间戳 + 两位随机数，保证海量订单下不重号且可通过前缀快速识别订单来源为线下登记。订单创建后进入待确认状态，走标准报价与流转流程。'));
body.push(h3('6.4.6 订单导出'));
body.push(h4('6.4.6.1 导出范围与字段'));
body.push(p('导出遵循「所见即所得」原则：按列表当前筛选条件（关键词、状态、日期区间）导出命中订单，上限五千条。导出字段包括订单号、设备型号、成色、预估价、成交价、状态、客户、联系电话、创建时间与完成时间，满足对账与报表需要。'));
body.push(h4('6.4.6.2 文件编码规范'));
body.push(p('导出文件为 CSV 格式，以 UTF-8 编码写出并附带 BOM 头，保证 Excel 直接双击打开中文不乱码；字段值中的引号与换行按 CSV 标准转义。导出动作记录操作日志（含导出条数），导出链接支持新窗口直接下载。'));
body.push(h2('6.5 设备配价库'));
body.push(h3('6.5.1 目录结构管理'));
body.push(h4('6.5.1.1 分类管理'));
body.push(p('分类是配价目录的第一级，维护字段包括分类编码（全局唯一，创建后不可重复）、分类名称、图标、主题色、排序权重与上架状态。编码与小程序本地视觉档案按分类编码对应，是云端目录与本地视觉资源合并的关联键。删除分类前系统校验其下品牌数量，非空时拒绝删除。'));
body.push(h4('6.5.1.2 品牌管理'));
body.push(p('品牌隶属分类，维护品牌名称、字标（未填时取名称首字）、品牌色与排序。品牌色作为该品牌下型号卡片的默认主题色，影响小程序端的视觉呈现。删除品牌前校验其下型号数量，非空时拒绝删除。'));
body.push(h4('6.5.1.3 型号管理'));
body.push(p('型号是配价目录的末级与核心，维护型号名称、规格说明、回收基准价、二手市场参考价（可选）、热门标记、上架状态与排序；型号记录最后调价人便于追责。新增型号即写入一条「新增型号」初始定价记录；修改与删除均记录操作日志。'));
body.push(...fig('图 6-5 设备配价库（可插入截图）'));
body.push(h3('6.5.2 型号查询与导出'));
body.push(p('调价工作台支持按分类、品牌、关键词（型号名/规格模糊匹配）、上架状态与热门标记组合筛选型号，分页浏览；配价库另提供全量 CSV 导出，输出分类、品牌、型号、规格、基准价、市场参考价、热门、状态与更新时间列，同样带 BOM 头保证 Excel 兼容。'));
body.push(h3('6.5.3 目录树加载实现'));
body.push(p('配价库完整目录以树接口一次返回：服务端并行查询分类、品牌、型号三张表的全量行，随后在内存中以品牌标识、分类标识两级映射组装出树结构，型号仅返回配价相关列以压缩响应体。相比逐级请求或递归联表，内存组装一次成型，前端整树渲染、级联筛选与目录维护界面即取即用；在分类十余个、品牌数百个、型号数千条的规模下响应仍保持轻量。树接口同时是小程序端公开目录接口的数据基础——后台维护的配价经同一份表结构输出到两端，保证管理端与用户端看到的价格完全一致。'));
body.push(h3('6.5.4 调价管理'));
body.push(h4('6.5.4.1 单型号调价'));
body.push(p('运营人员在型号行内直接录入新基准价与调价原因提交。系统优先读取最新基准价计算调价幅度，调价成功后更新配价并写入调价记录，前端即时刷新价格展示。调价原因是审计链的重要组成部分，建议填写市场行情变化等依据。'));
body.push(h4('6.5.4.2 调价幅度保护'));
body.push(p('调价请求先与现价比较计算幅度百分比，超过系统参数设定的上限（默认 20%）时拒绝执行并返回需二次确认标记，前端弹窗展示调价前后金额与幅度；运营人员确认后方可强制调价。该机制防住两类风险：误输入（如多打一个零导致十倍调价）与异常操作（超出授权范围的大幅调价）。'));
body.push(h4('6.5.4.3 批量调价'));
body.push(p('勾选多个型号后发起批量调价，支持两种模式：百分比模式在现价基础上按指定百分比上浮或下调（支持负值，结果四舍五入取整且不低于零）；固定值模式将所选型号统一设置为指定价格。批量调价对每个型号独立计算新价、独立写入调价记录（原因自动标注批量模式与参数），并汇总记录一条批量操作日志。'));
body.push(h4('6.5.4.4 调价审计'));
body.push(p('调价记录页分页展示全部调价历史，字段含型号名称、调价前后价格、调价原因、操作人与时间。支持按型号过滤并按时间正序查看，形成单一型号的完整价格走势曲线，为争议订单复核、行情复盘与责任审计提供依据。调价记录不可删除与修改。'));
body.push(...fig('图 6-6 调价与调价记录（可插入截图）'));
body.push(h2('6.6 回收平台管理'));
body.push(h3('6.6.1 平台档案字段'));
body.push(p('每个平台档案维护十一类信息：平台名称、平台网址（强制 http/https 协议）、平台类型、字标与品牌色、平台说明、服务方式（上门/邮寄/到店）、结算方式（如验机后打款）、佣金/费率说明、联系方式、排序与启用状态。字段设计覆盖运营比价决策所需的全部要素。'));
body.push(h3('6.6.2 平台类型体系'));
body.push(tCaption('表 6-4 回收平台类型定义'));
body.push(tbl(
  ['类型', '标识', '用途'],
  [
    ['回收平台', 'recycle', '可直接交售的官方回收渠道（如爱回收、回收宝）'],
    ['采购渠道', 'procurement', '企业采购二手设备的出货渠道'],
    ['比价参考', 'compare', '自主定价出售的比价参考（如闲鱼）']
  ],
  [18, 20, 62]
));
body.push(p('平台列表支持按类型与关键词筛选，档案字段修改与删除实时生效；系统预置爱回收、转转回收、闲鱼、回收宝四个示例平台（含完整服务方式与结算说明），部署后可直接编辑复用。小程序比价区仅展示启用状态的平台。'));
body.push(h3('6.6.3 跳转与点击统计'));
body.push(p('后台点击「前往」访问平台时，服务端先累计该平台点击量、写入一条来源为后台的跳转日志，再返回平台真实地址由前端新窗口打开。跳转日志与小程序端上报的点击共同汇入点击统计，后台可按天查看近三十天跳转趋势与点击量排行，评估各平台的使用价值。'));
body.push(...fig('图 6-7 回收平台管理（可插入截图）'));
body.push(h2('6.7 采购链接管理'));
body.push(h3('6.7.1 链接字段与关联'));
body.push(p('每条采购链接维护名称、地址（强制 http/https）、适用设备分类（可选，留空表示通用）、关联平台（可选）、适用型号关键词、参考价格区间与备注。链接可挂接到具体品类或平台，形成「分类→链接」「平台→链接」两级检索视角，帮助运营在采购决策时快速调出对应渠道。'));
body.push(h3('6.7.2 筛选查询'));
body.push(p('链接列表联表展示所属分类名与平台名，支持按分类、关键词（名称/地址/型号关键词/备注）与状态组合筛选；启用/停用状态控制链接是否对运营可见。链接地址与平台地址同样经协议校验，防止录入非法地址。'));
body.push(h3('6.7.3 点击统计与排行'));
body.push(p('点击链接时累计点击量、刷新最近点击时间并写入跳转日志（与平台跳转共用日志表，以目标类型区分）。统计视图提供两组数据：近三十天逐日跳转趋势曲线与点击量前十的目标排行（平台与链接混合排名），运营据此优化链接库的收录与排序。'));
body.push(...fig('图 6-8 采购链接管理（可插入截图）'));
body.push(h2('6.8 估价配置'));
body.push(h3('6.8.1 核心参数'));
body.push(p('配置页顶部以参数卡片维护三个全局开关：二手基准系数（取值 0.1~1、步进 0.05，是全部估价的兜底折扣，页面注明「即便全新设备也按此折扣回收」）、配价有效期（1~30 天，超期后小程序端需重新询价）与小程序 AI 估价开关（开启后问答式估价由 AI 辅助判档）。参数保存即时生效并写操作日志。'));
body.push(h3('6.8.2 品类估价系数'));
body.push(p('为每个回收品类单独设定整体折算系数（取值 0.1~2），卡片同时展示该品类型号数量与基准价均价，帮助运营判断系数调整的影响面。品类系数参与估价公式：最终价 = 基准价 × 二手基准系数 × 品类系数 × 各因子系数，用于按品类的保值差异整体调节（如服务器类流通慢可整体调低、热门手机类可微调上调）。'));
body.push(h3('6.8.3 因子系数维护'));
body.push(p('按六大评估因子分组维护选项与系数：可修改既有选项的文案与系数（0~2），可新增自定义档位（系统自动生成与小程序匹配的唯一编码），可删除冗余档位（每因子至少保留两项）。全部修改即时下发小程序端，估价口径实时统一。'));
body.push(h3('6.8.4 估价模拟器'));
body.push(p('配置页内置实时估价模拟器：选择品类与型号基准价、调节二手基准系数、品类系数与各因子系数后，即时演算最终回收价。模拟器让运营在调参前先预判报价变化幅度，配合调价幅度保护使用，避免盲目调参引发报价波动。'));
body.push(...fig('图 6-9 估价配置与模拟器（可插入截图）'));
body.push(h2('6.9 操作日志'));
body.push(h3('6.9.1 日志覆盖范围'));
body.push(p('操作日志由各业务接口自动写入，覆盖后台全部写操作与登录行为：认证类（登录、单点登录、修改密码）、订单类（报价、状态流转、创建、导出）、配价类（分类/品牌/型号增删改、调价、批量调价、品类系数）、平台与链接类（增删改）、设置类（参数保存、系数调整、管理员管理）。日志写入失败不影响业务主流程。'));
body.push(h3('6.9.2 日志检索'));
body.push(p('日志页支持三类条件组合检索：模块（订单/配价/平台/链接/设置/认证）、关键词（匹配操作人、动作与明细内容）与日期区间，结果按时间倒序分页展示。运营可快速回答「谁在什么时候对哪笔订单做了什么」的审计问题。'));
body.push(h3('6.9.3 日志字段'));
body.push(p('每条日志记录操作管理员标识与姓名、所属模块、动作类型、操作明细（含订单号、金额、前后状态等关键信息，超长自动截断至一千字符）、来源 IP 与操作时间。日志表按模块与时间建立索引，长期积累下检索性能稳定。'));
body.push(...fig('图 6-10 操作日志（可插入截图）'));
body.push(h2('6.10 系统设置'));
body.push(h3('6.10.1 系统参数'));
body.push(p('以列表形式展示并编辑全部系统参数，包括各预置参数（基准系数、AI 开关、配价有效期、服务电话、回收须知、调价上限）与环保换算系数；每项参数附用途说明与最近更新时间，支持批量保存，保存记录更新人。参数值以字符串存储，业务代码按需转换为数值使用。'));
body.push(h3('6.10.2 管理员管理'));
body.push(p('超级管理员专属功能，提供管理员的增删改查：新增管理员需指定账号（全局唯一）、密码（不少于六位）与三级角色之一；编辑支持调整姓名、角色、启用状态与重置密码；全部操作仅超级管理员可见与可执行。'));
body.push(h3('6.10.3 管理员保护规则'));
body.push(p('账号管理内置四重保护：新账号重名拒绝创建；不可禁用自己的账号；不可删除自己的账号；删除最后一个超级管理员被拒绝。保护规则在服务端强制执行，避免误操作导致系统失去管理入口。'));
body.push(h3('6.10.4 界面框架与主题'));
body.push(p('后台主界面采用左侧导航加顶部工具栏的经典布局：侧边栏展示平台标识与九个功能菜单、支持折叠；顶部展示面包屑导航、日间/夜间主题切换滑块（与维修后台共享主题偏好、双系统同步）、返回维修系统入口与个人菜单（修改密码、退出登录）。主题切换基于全局样式事件广播实现，刷新与跨系统后保持选择。'));
body.push(...fig('图 6-11 系统设置与主界面（可插入截图）'));

body.push(h2('6.11 后台关键实现机制'));
body.push(p('本节说明管理后台各功能模块背后的核心实现机制，包括看板聚合、大屏呈现、订单查询、调价保护、导出、鉴权链路与单点登录七个部分。'));
body.push(h3('6.11.1 看板数据聚合实现'));
body.push(p('看板接口以单条统计 SQL 配合条件聚合完成全维度汇总：对订单总数、各状态计数、今日与本月订单、累计及本月成交额分别以条件表达式在同一次表扫描中得出，避免多次往返；趋势、机型排行、类型分布、最新订单、配价概况与点击趋势六组数据再以并行查询同时发出，接口总耗时接近最慢一条查询。环保换算在服务端完成（保留一位小数）后随响应返回；前端拿到数据后由数字滚动函数驱动动画呈现，大数据量下看板仍可秒级加载。'));
body.push(h3('6.11.2 数据大屏实现'));
body.push(p('大屏视觉层完全由层叠样式实现：网格背景以线性渐变平铺、两组彩色光晕以模糊径向渐变绝对定位、扫描线以关键帧动画往复移动，均为纯样式绘制不引入图片资源；时钟以秒级定时器刷新时间、日期与星期显示；全屏按钮调用浏览器全屏接口进入与退出。图表面板复用 ECharts 并按深色主题重设配色与文字颜色；数据接口与看板同源，大屏与看板数字永远一致。'));
body.push(h3('6.11.3 订单查询实现'));
body.push(p('订单列表查询以字段清单函数按表结构动态组装查询列；筛选条件以条件数组加参数数组的方式拼装——每个条件独立入数组、用户输入全部经参数占位传入，从结构上杜绝注入；列表查询与计数统计两条 SQL 并行执行，计数 SQL 同时累加已完成订单成交额供列表顶部汇总展示；分页参数在服务端钳制（页码不小于一、每页上限一百条）。订单图片字段做三态容错解析：兼容 JSON 数组字符串、已解析数组与脏数据，异常时返回空数组保证列表不因个别脏数据报错。'));
body.push(h3('6.11.4 调价保护与批量实现'));
body.push(p('单型号调价先读取现价计算幅度百分比，与系统参数上限比较：超限时本次请求终止并返回需二次确认标记，前端弹窗展示前后价格与幅度，用户确认后携带强制标记重发方才执行——保护逻辑在服务端实施，绕过前端亦无法直接大幅调价。批量调价先以占位符 IN 查询取回全部目标型号现价，再逐型号计算新价（百分比模式四舍五入取整、固定值模式钳制非负）并同步写入调价记录，原因自动标注批量模式与参数。两条路径最终均写入操作日志，形成型号表、调价记录、操作日志三层可追溯记录。'));
body.push(h3('6.11.5 导出实现'));
body.push(p('CSV 导出在服务端流式拼接：字段值内的双引号按 CSV 标准翻倍转义、每字段整体以引号包裹，行以回车换行分隔；文件体首部写入 BOM 字符，保证 Excel 双击打开即按 UTF-8 识别中文；以附件下载响应头返回文件流，文件名附带时间戳避免同名冲突。订单导出与配价导出共用同一套拼接逻辑，导出动作记录操作日志并包含导出条数。'));
body.push(h3('6.11.6 鉴权中间件链实现'));
body.push(p('鉴权以三层中间件实现并绑定于路由挂载点：认证层解析请求头或查询参数中的令牌并验签，随后回查数据库确认账号存在且处于启用状态，将账号信息挂载至请求上下文供后续使用；写操作层校验角色非只读账号；超管层校验角色为超级管理员。业务路由在注册时即声明所需层级，新增接口天然纳入权限体系，避免逐接口遗漏校验；认证层对令牌过期的响应统一为登录已过期，前端据此清理凭证并引导重新登录。'));
body.push(h3('6.11.7 单点登录实现'));
body.push(p('单点登录由服务端代为校验主系统凭证：以 HTTPS 请求携带维修后台令牌访问其用户信息接口，请求中指定服务器名以匹配网关证书域名，八秒超时防止主系统异常拖垮登录；主系统校验通过方认可该凭证，前端传入的任何身份信息不参与信任判断。随后按用户名匹配回收账号：存在且启用即发放会话；不存在则以随机高熵密码的哈希建号（默认管理员角色，仅可经单点登录进入）；账号被禁用时拒绝放行。整个流程不持有主系统密钥，凭证校验与自动开户均在服务端完成。'));

// ---------- 第七章 安全设计 ----------
body.push(h1('第七章 安全设计'));
body.push(h2('7.1 身份认证安全'));
body.push(h3('7.1.1 密码存储'));
body.push(p('管理员密码以 bcrypt 算法加盐哈希存储，强度因子为十轮；数据库泄露不暴露明文，彩虹表与暴力破解成本高。密码仅在创建、重置与修改时经服务端加密落库，任何接口不回显密码字段。'));
body.push(h3('7.1.2 令牌机制'));
body.push(p('会话采用 JWT 无状态令牌，默认十二小时过期，签名密钥经环境变量注入并支持轮换；令牌载荷仅含管理员标识、账号与角色等非敏感声明。登录失败统一返回模糊提示，防止账号枚举。'));
body.push(h3('7.1.3 会话即时失效'));
body.push(p('每次请求鉴权时服务端实时回查账号：账号被删除或禁用后，已签发令牌即刻失效（返回未授权），无需等待自然过期。单点登录同样在服务端对主系统凭证实名校验，不信任任何前端传入的身份信息。'));
body.push(h2('7.2 权限控制'));
body.push(h3('7.2.1 角色定义'));
body.push(p('权限模型遵循最小授权原则，内置超级管理员、管理员、只读账号三级角色：只读账号仅开放查询与导出；管理员开放全部业务操作；管理员管理等高危操作仅超级管理员可用（角色权限矩阵见 6.1.3.1 节）。'));
body.push(h3('7.2.2 服务端实施'));
body.push(p('权限校验在服务端认证、写操作、超管三级中间件统一实施，所有业务路由在注册时即绑定对应校验层；直接调用受保护接口的越权请求被拦截并返回 403。中间件顺序保证先认证后授权，未登录请求不进入权限判断。'));
body.push(h3('7.2.3 前端配合'));
body.push(p('前端按角色隐藏无权入口与操作按钮（如只读账号不显示报价与调价按钮），降低误操作概率；前端控制仅是体验层，安全边界完全由服务端中间件保证，两层设计相互独立。'));
body.push(h2('7.3 数据安全'));
body.push(h3('7.3.1 参数化查询'));
body.push(p('全部 SQL 使用参数化查询（占位符传参），用户输入不参与 SQL 字符串拼接，从根本上杜绝注入攻击；动态拼接仅限服务端白名单字段（如可选列名来自数据库元数据探测，不接受外部输入）。'));
body.push(h3('7.3.2 输入校验与限流'));
body.push(p('写接口对业务字段逐项校验（金额非负、枚举合法、长度截断），列表与导出接口在服务端强制收敛分页与导出上限，防止恶意拉取全量数据；请求体大小限制为 5MB，异常请求快速失败。'));
body.push(h3('7.3.3 敏感配置管理'));
body.push(p('数据库口令、JWT 密钥、AI 接口密钥等敏感配置一律经环境变量注入运行时，不写入代码仓库与镜像；构建产物不含任何 .env 文件，配置与代码分离，遵循十二要素应用配置规范。'));
body.push(h2('7.4 操作审计'));
body.push(p('后台全部写操作（含登录行为）统一写入操作日志表，记录操作人、模块、动作、明细与来源 IP；配价变动另记专用调价记录，日志不可篡改删除。审计数据同时服务三方面：安全事件溯源、业务争议复核与管理责任界定。'));
body.push(h2('7.5 传输与部署安全'));
body.push(h3('7.5.1 传输安全'));
body.push(p('生产环境全部外部流量经 HTTPS 网关进出，SSL 证书配置于网关层统一管理；网关到后端服务的容器内网通信不出宿主机，降低窃听与中间人风险。'));
body.push(h3('7.5.2 端口收敛'));
body.push(p('各业务容器端口仅绑定本机回环地址（管理后台、小程序服务端、缓存与 AI 服务），不直接暴露公网；数据库运行于宿主机并由业务容器经内部地址访问。对外攻击面收敛为网关单点。'));
body.push(h3('7.5.3 容器隔离'));
body.push(p('平台以容器化编排交付，服务间通过网络命名空间隔离；升级与回滚以镜像为单元，环境差异通过环境变量注入，避免人工改动造成的安全漂移；容器重启策略保证服务自愈。'));
body.push(h2('7.6 安全威胁与对策'));
body.push(p('下表汇总平台针对常见安全威胁采取的对策及其所在章节，各层对策相互独立、纵深部署，单点失效不致整体失守。', { after: 40 }));
body.push(tCaption('表 7-1 安全威胁与对策'));
body.push(tbl(
  ['威胁', '对策', '对应设计'],
  [
    ['SQL 注入', '全量参数化查询，用户输入不参与 SQL 拼接，动态列名来自库内元数据', '7.3.1 参数化查询'],
    ['越权访问', '三级角色中间件绑定路由挂载点；禁用账号令牌即时失效', '7.2 权限控制'],
    ['暴力破解', 'bcrypt 加盐哈希存储；登录失败统一模糊提示，防止账号枚举', '7.1.1 密码存储'],
    ['令牌泄露', '十二小时短时效令牌；服务端可随时禁用账号使令牌失效', '7.1.2 令牌机制'],
    ['数据爬取', '分页与导出上限钳制，无全量拉取路径；请求体大小限制', '7.3.2 输入校验与限流'],
    ['跨站脚本', '前端框架默认转义输出，无富文本与动态脚本注入面', '7.3 数据安全'],
    ['配置泄露', '密钥与口令经环境变量注入，不入代码库、不进镜像', '7.3.3 敏感配置管理'],
    ['内部误操作', '调价幅度二次确认、管理员保护规则、全程操作审计', '7.4 操作审计']
  ],
  [16, 48, 36]
));

// ---------- 第八章 运行与维护 ----------
body.push(h1('第八章 运行与维护'));
body.push(h2('8.1 部署方式'));
body.push(h3('8.1.1 容器编排'));
body.push(p('平台随统一容器编排部署：回收管理后台以独立容器运行（默认端口 3005），小程序服务端容器化运行（默认端口 3001），网关、缓存等基础服务同编交付。容器间通过内部网络互访，外部流量统一经网关 443 端口按子路径转发，管理后台对外路径为 /recycle-admin/。'));
body.push(h3('8.1.2 前端子路径构建'));
body.push(p('管理后台前端在镜像构建阶段注入子路径基座与接口前缀参数，构建产物由服务端托管并支持前端路由回退，因此同一镜像可同时适配子路径部署与本机独立部署两种形态，无需维护两套配置。'));
body.push(h3('8.1.3 端口规划'));
body.push(tCaption('表 8-1 平台端口规划'));
body.push(tbl(
  ['服务', '默认端口', '暴露范围'],
  [
    ['统一网关（HTTPS）', '443', '公网/局域网'],
    ['回收管理后台', '3005', '仅本机（调试用），生产走网关'],
    ['小程序服务端', '3001', '仅本机（调试用），生产走网关'],
    ['MySQL 数据库', '3306', '宿主机，容器经内部地址访问'],
    ['Redis 缓存', '6379', '仅本机']
  ],
  [30, 20, 50]
));
body.push(h2('8.2 初始化与种子数据'));
body.push(p('首次部署时系统自动完成建表与种子数据初始化：管理员表为空时创建默认超级管理员（账号 admin，初始密码经环境变量可覆盖，首次登录后应立即修改）；配价分类为空时导入内置配价目录；估价系数为空时按内置题目选项灌入；系统参数以忽略重复方式写入默认值；平台表为空时写入示例平台。全部初始化语句幂等，二次启动不会产生重复数据。'));
body.push(h2('8.3 健康检查与监控'));
body.push(p('管理后台服务提供 /health 健康检查接口，对数据库执行连通性探测并返回服务状态与时间戳；容器编排层以此为依据进行健康监测与自动重启。服务端同时输出简要请求日志与统一错误处理日志，AI 服务、网关亦各有健康检查端点，便于运行期问题定位。'));
body.push(h2('8.4 常见问题与处理'));
body.push(tCaption('表 8-2 常见问题与处理方式'));
body.push(tbl(
  ['现象', '原因与处理'],
  [
    ['小程序配价与后台不一致', '配价缓存有效期为十分钟，等待过期后重进页面；确认相关型号处于上架状态'],
    ['登录提示登录已过期', '令牌超过十二小时有效期，重新登录即可；若持续出现检查服务器时间'],
    ['报价提交被拒绝', '确认订单未处于已完成或已取消状态；金额需为非负数字'],
    ['调价被提示幅度超限', '系统默认单次调价幅度上限 20%，确认后在二次确认弹窗中选择强制调价'],
    ['导出 CSV 中文乱码', '导出文件自带 BOM 头，请使用 Excel 或支持 UTF-8 的工具打开'],
    ['单点登录失败', '先登录维修后台获取有效会话；仍失败时联系管理员检查回收账号是否被禁用'],
    ['AI 估价未生效', '检查系统设置中 AI 估价开关与密钥配置；AI 不可用时小程序自动使用本地估价，不影响下单']
  ],
  [30, 70]
));
body.push(h2('8.5 备份恢复与升级'));
body.push(h3('8.5.1 备份策略'));
body.push(p('平台业务数据集中于共享 MySQL 实例，备份以数据库为单位执行：建议每日全量备份配合增量日志，配价库、估价配置、操作日志与回收订单随库一并保护；管理配置（环境变量文件）与前端构建所依赖的镜像版本随部署仓库留存；数据库口令与密钥的备份单独加密保管，不与代码同库。恢复时以备份集重建数据库后重启服务，幂等建表与种子逻辑会在启动时自动对齐表结构，无需人工修表。'));
body.push(h3('8.5.2 升级流程'));
body.push(p('升级按构建、替换、验证三步执行：拉取代码构建新镜像（前端子路径参数随构建注入）；编排仅更新回收后台相关容器，其余服务不受影响；升级完成后访问健康检查确认数据库连通、抽测核心接口。数据层升级依赖幂等建表——新增表与新增参数在服务启动时自动补齐，不依赖手工迁移脚本；升级异常时回滚至上一镜像版本即可恢复服务，历史数据向后兼容。配价与订单数据在升级全程不参与变更，业务零中断。'));
body.push(p(' ', { after: 0 }));
body.push(p('本说明书所述功能与实现以众云信息科技电子产品回收综合服务平台 V1.0 实际软件为准。', { after: 0 }));

// ==================== 页眉页脚（黑白正式） ====================
function pageHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK, space: 4 } },
      spacing: { after: 0, line: 240 },
      children: [new TextRun({ text: '众云信息科技电子产品回收综合服务平台V1.0 软件说明书', size: 18, color: '444444', font: FONT_BODY })]
    })]
  });
}
function pageFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240 },
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '444444', font: FONT_BODY })]
    })]
  });
}

// ==================== 组装文档 ====================
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  creator: '众云信息科技',
  title: '众云信息科技电子产品回收综合服务平台V1.0 软件说明书',
  styles: {
    default: {
      document: {
        run: { font: FONT_BODY, size: 24, color: BLACK },
        paragraph: { spacing: { line: 312 } }
      },
      heading1: {
        run: { font: FONT_HEAD, size: 32, bold: true, color: BLACK },
        paragraph: { spacing: { before: 240, after: 240, line: 312 }, outlineLevel: 0 }
      },
      heading2: {
        run: { font: FONT_HEAD, size: 30, bold: true, color: BLACK },
        paragraph: { spacing: { before: 300, after: 140, line: 312 }, outlineLevel: 1 }
      },
      heading3: {
        run: { font: FONT_HEAD, size: 28, bold: true, color: BLACK },
        paragraph: { spacing: { before: 240, after: 100, line: 312 }, outlineLevel: 2 }
      },
      heading4: {
        run: { font: FONT_HEAD, size: 24, bold: true, color: BLACK },
        paragraph: { spacing: { before: 200, after: 80, line: 312 }, outlineLevel: 3 }
      }
    }
  },
  sections: [
    // 第 1 节：封面（纯白，无页码）
    {
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR5({
        title: '众云信息科技电子产品回收综合服务平台',
        titleLines: ['众云信息科技', '电子产品回收综合服务平台'],
        subtitle: 'V1.0',
        docType: '软 件 说 明 书',
        metaEntries: [
          { label: '软件名称', value: '众云信息科技电子产品回收综合服务平台' },
          { label: '版本号', value: 'V1.0' },
          { label: '编制单位', value: '【填写编制单位全称】' },
          { label: '编制日期', value: '2026 年 9 月' }
        ],
        footerRight: '软件著作权登记申请材料'
      })
    },
    // 第 2 节：目录（罗马页码）
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } }
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: '目  录', bold: true, size: 32, font: FONT_HEAD, color: BLACK })]
        }),
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: '注：本目录由域代码生成。文档编辑后如需刷新页码，请在目录上点击右键并选择「更新域」。',
            italics: true, size: 18, color: '888888', font: FONT_BODY
          })]
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },
    // 第 3 节：正文（阿拉伯页码从 1 起）
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: body
    }
  ]
});

const OUT = process.env.OUT_DOCX || 'D:/maintain/软著申报材料/回收综合服务平台V1.0/众云信息科技电子产品回收综合服务平台V1.0-说明书.docx';
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('DOCX generated:', OUT, buf.length, 'bytes');
});
