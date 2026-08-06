import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function escapeHtml(s) {
  if (s == null || s === '') return '—'
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const resultMap = {
  qualified: '合格',
  unqualified: '不合格',
  partial: '部分合格'
}

const statusMap = {
  pending: '待检测',
  testing: '检测中',
  completed: '已完成'
}

/**
 * 构建检测报告 PDF 用 HTML（A4 宽度排版，便于打印）
 */
export function buildTestReportPdfHtml(report) {
  const r = report || {}
  const resultText = resultMap[r.test_result] || r.test_result || '—'
  const statusText = statusMap[r.status] || r.status || '—'
  return `
<div style="font-family:'Microsoft YaHei','PingFang SC',sans-serif;color:#1a1a1a;font-size:12px;line-height:1.55;width:720px;padding:24px 28px;box-sizing:border-box;background:#fff;">
  <div style="text-align:center;border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:18px;">
    <div style="font-size:20px;font-weight:700;color:#1e40af;letter-spacing:4px;">机械设备检测报告</div>
    <div style="margin-top:8px;font-size:12px;color:#64748b;">本报告供客户查阅，请妥善保管</div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:11px;color:#475569;">
    <span>报告编号：<strong style="color:#0f172a;">${escapeHtml(r.report_number)}</strong></span>
    <span>检测日期：<strong style="color:#0f172a;">${escapeHtml(r.test_date)}</strong></span>
  </div>
  <div style="font-size:13px;font-weight:600;color:#1e293b;margin:14px 0 8px;padding-left:8px;border-left:4px solid #2563eb;">一、基本信息</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
    <tr><td style="border:1px solid #cbd5e1;padding:8px 10px;width:22%;background:#f8fafc;color:#475569;">客户名称</td><td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(r.customer_name)}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;">机械名称 / 型号</td><td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(r.machine_name)} / ${escapeHtml(r.machine_model)}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;">检测员</td><td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(r.tester_name)}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;">检测状态</td><td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(statusText)}</td></tr>
  </table>
  <div style="font-size:13px;font-weight:600;color:#1e293b;margin:14px 0 8px;padding-left:8px;border-left:4px solid #2563eb;">二、检测项目与结论</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
    <tr><td style="border:1px solid #cbd5e1;padding:8px 10px;width:22%;background:#f8fafc;color:#475569;vertical-align:top;">检测项目</td><td style="border:1px solid #cbd5e1;padding:8px 10px;white-space:pre-wrap;">${escapeHtml(r.test_items)}</td></tr>
    <tr><td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;">检测结果</td><td style="border:1px solid #cbd5e1;padding:8px 10px;"><strong style="color:#0f172a;">${escapeHtml(resultText)}</strong></td></tr>
  </table>
  <div style="font-size:13px;font-weight:600;color:#1e293b;margin:14px 0 8px;padding-left:8px;border-left:4px solid #2563eb;">三、检测描述</div>
  <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;min-height:56px;white-space:pre-wrap;font-size:11px;background:#fafafa;margin-bottom:14px;">${escapeHtml(r.test_description)}</div>
  <div style="font-size:13px;font-weight:600;color:#1e293b;margin:14px 0 8px;padding-left:8px;border-left:4px solid #2563eb;">四、处理建议</div>
  <div style="border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;min-height:44px;white-space:pre-wrap;font-size:11px;background:#fafafa;margin-bottom:20px;">${escapeHtml(r.suggestion)}</div>
  <div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;">
    <span>建档时间：${escapeHtml(r.created_at || '')}</span>
    <span>导出时间：${escapeHtml(new Date().toLocaleString('zh-CN'))}</span>
  </div>
</div>`
}

/**
 * 将检测报告导出为 PDF（浏览器端生成，支持中文）
 */
export async function downloadTestReportPdf(report, fileNameBase = '检测报告') {
  const wrap = document.createElement('div')
  wrap.style.position = 'fixed'
  wrap.style.left = '-12000px'
  wrap.style.top = '0'
  wrap.style.zIndex = '-1'
  wrap.innerHTML = buildTestReportPdfHtml(report)
  document.body.appendChild(wrap)

  try {
    const canvas = await html2canvas(wrap.firstElementChild, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    })

    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const margin = 10
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = margin

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - margin

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - margin
    }

    const safeName = String(report?.report_number || fileNameBase).replace(/[\\/:*?"<>|]/g, '_')
    pdf.save(`${safeName}_检测报告.pdf`)
  } finally {
    document.body.removeChild(wrap)
  }
}
