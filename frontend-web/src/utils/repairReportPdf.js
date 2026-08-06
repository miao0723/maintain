import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function escapeHtml(value) {
  if (value == null || value === '') return '—'
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return `¥${amount.toFixed(2)}`
}

function formatHours(value) {
  const hours = Number(value || 0)
  return `${hours.toFixed(1)}小时`
}

function getStatusText(status) {
  const map = {
    pending: '待处理',
    repairing: '维修中',
    completed: '已完成',
    0: '待处理',
    1: '维修中',
    2: '已完成'
  }
  return map[status] || map[String(status)] || '—'
}

function buildSummary(report) {
  const parts = []

  if (report.fault_description) {
    parts.push(`设备故障表现为：${report.fault_description}。`)
  }
  if (report.repair_content) {
    parts.push(`本次维修主要处理内容为：${report.repair_content}。`)
  }
  if (report.parts_used) {
    parts.push(`维修过程中涉及更换或使用配件：${report.parts_used}。`)
  }
  parts.push(`本次维修工时 ${formatHours(report.repair_hours)}，维修费用 ${formatMoney(report.amount)}。`)

  return parts.join('')
}

export function buildRepairReportPdfHtml(report) {
  const r = report || {}
  const exportTime = new Date().toLocaleString('zh-CN')
  const statusText = getStatusText(r.status)
  const machineName = r.machine_name || '电子设备维修工单'
  const repairSummary = buildSummary(r)

  return `
<div style="font-family:'Microsoft YaHei','PingFang SC',sans-serif;color:#0f172a;font-size:12px;line-height:1.65;width:720px;padding:28px 30px;box-sizing:border-box;background:#fff;">
  <div style="border-bottom:4px solid #0f766e;padding-bottom:16px;margin-bottom:18px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;">
      <div>
        <div style="font-size:22px;font-weight:700;letter-spacing:3px;color:#115e59;">维修服务报告</div>
        <div style="margin-top:8px;font-size:12px;color:#64748b;">用于记录维修过程、处理结论、费用构成与交付依据</div>
      </div>
      <div style="padding:8px 14px;border-radius:999px;background:#ecfdf5;color:#065f46;font-size:12px;font-weight:700;">${escapeHtml(statusText)}</div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:16px;font-size:11px;color:#475569;flex-wrap:wrap;">
    <span>报告编号：<strong style="color:#0f172a;">${escapeHtml(r.report_number)}</strong></span>
    <span>订单号：<strong style="color:#0f172a;">${escapeHtml(r.order_no)}</strong></span>
    <span>导出时间：<strong style="color:#0f172a;">${escapeHtml(exportTime)}</strong></span>
  </div>

  <div style="font-size:13px;font-weight:700;color:#0f172a;margin:16px 0 8px;padding-left:10px;border-left:4px solid #0f766e;">一、工单基本信息</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:18%;background:#f8fafc;color:#475569;">机械名称</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:32%;">${escapeHtml(machineName)}</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:18%;background:#f8fafc;color:#475569;">维修员</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(r.repairer_name)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;">完成时间</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(r.completion_date)}</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;">维修状态</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(statusText)}</td>
    </tr>
  </table>

  <div style="font-size:13px;font-weight:700;color:#0f172a;margin:16px 0 8px;padding-left:10px;border-left:4px solid #0f766e;">二、故障与维修处理</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:18%;background:#f8fafc;color:#475569;vertical-align:top;">故障描述</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;white-space:pre-wrap;">${escapeHtml(r.fault_description)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;vertical-align:top;">维修内容</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;white-space:pre-wrap;">${escapeHtml(r.repair_content)}</td>
    </tr>
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;background:#f8fafc;color:#475569;vertical-align:top;">更换配件</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;white-space:pre-wrap;">${escapeHtml(r.parts_used)}</td>
    </tr>
  </table>

  <div style="font-size:13px;font-weight:700;color:#0f172a;margin:16px 0 8px;padding-left:10px;border-left:4px solid #0f766e;">三、费用与工时</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
    <tr>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:18%;background:#f8fafc;color:#475569;">维修工时</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:32%;">${escapeHtml(formatHours(r.repair_hours))}</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;width:18%;background:#f8fafc;color:#475569;">维修费用</td>
      <td style="border:1px solid #cbd5e1;padding:8px 10px;">${escapeHtml(formatMoney(r.amount))}</td>
    </tr>
  </table>

  <div style="font-size:13px;font-weight:700;color:#0f172a;margin:16px 0 8px;padding-left:10px;border-left:4px solid #0f766e;">四、维修结论</div>
  <div style="border:1px solid #dbe4ea;border-radius:8px;padding:12px 14px;min-height:78px;background:#f8fafc;white-space:pre-wrap;font-size:11px;">${escapeHtml(repairSummary)}</div>

  <div style="margin-top:22px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;gap:16px;font-size:10px;color:#94a3b8;">
    <span>说明：本报告基于当前维修系统登记字段自动生成，可用于客户交付、内部留档与售后追溯。</span>
    <span>建档时间：${escapeHtml(r.created_at || r.completion_date || '')}</span>
  </div>
</div>`
}

export async function downloadRepairReportPdf(report, fileNameBase = '维修报告') {
  const wrap = document.createElement('div')
  wrap.style.position = 'fixed'
  wrap.style.left = '-12000px'
  wrap.style.top = '0'
  wrap.style.zIndex = '-1'
  wrap.innerHTML = buildRepairReportPdfHtml(report)
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
    pdf.save(`${safeName}_维修报告.pdf`)
  } finally {
    document.body.removeChild(wrap)
  }
}
