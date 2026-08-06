import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 格式化键名
 * @param {string} key
 * @returns {string}
 */
function formatKey(key) {
  const keyMap = {
    total_income: '总收入',
    online_income: '在线支付收入',
    transfer_income: '转账收入',
    avg_amount: '平均订单金额',
    growth_rate: '增长率',
    total_expense: '总支出',
    purchase_expense: '采购支出',
    salary_expense: '人员工资',
    operation_expense: '运营费用',
    other_expense: '其他支出',
    total_orders: '总订单数',
    completed_orders: '已完成订单',
    processing_orders: '处理中订单',
    pending_orders: '待处理订单',
    cancelled_orders: '已取消订单',
    completion_rate: '完成率',
    date: '日期',
    order_count: '订单数量',
    online_payment: '在线支付',
    transfer: '转账',
    count: '数量'
  }
  return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * 格式化数值
 * @param {string} key
 * @param {number} value
 * @returns {string}
 */
function formatValue(key, value) {
  if (typeof value !== 'number') {
    return String(value)
  }

  if (key.includes('income') || key.includes('expense') || key.includes('amount')) {
    return `¥${value.toFixed(2)}`
  }

  if (key.includes('rate')) {
    return `${value.toFixed(1)}%`
  }

  return String(value)
}

/**
 * 清理 Markdown 中的不必要符号
 * @param {string} markdown
 * @returns {string}
 */
function cleanMarkdown(markdown) {
  if (!markdown) return ''
  return markdown
    // 移除行首行尾的 * 和 |
    .replace(/^[\s*\|]+|[\s*\|]+$/gm, '')
    // 移除单独一行的 ***
    .replace(/^\*{3,}\s*$/gm, '')
    // 移除单独一行的 ---
    .replace(/^\-{3,}\s*$/gm, '')
    // 移除行内的多余 | （保留表格分隔符）
    .replace(/\|+/g, ' ')
    // 移除行内的 ** （Markdown 粗体标记）
    .replace(/\*\*/g, '')
    // 移除行内的 * （Markdown 斜体标记）
    .replace(/(?<!\*)\*(?!\*)/g, '')
}

/**
 * 解析 Markdown 为 HTML
 * @param {string} markdown
 * @returns {string}
 */
function markdownToHtml(markdown) {
  if (!markdown) return ''
  // 先清理不必要符号
  const cleaned = cleanMarkdown(markdown)
  return cleaned
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\n/gim, '<br>')
    .replace(/<li>(.*?)<br>/gim, '<ul><li>$1</li></ul>')
}

/**
 * 导出统计报表为 PDF
 * @param {string} title 报表标题
 * @param {object} data 统计数据
 * @param {string} summary AI 生成的总结内容（Markdown 格式）
 * @param {string} fileName 文件名
 * @param {Function} onProgress 进度回调
 */
export async function exportStatisticsToPdf(title, data, summary, fileName, onProgress) {
  if (onProgress) onProgress(10, '正在准备生成...')

  try {
    // 创建一个隐藏的容器来渲染 HTML
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 794px;
      padding: 20px;
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: white;
    `

    // 智能采样函数：根据数据量返回合适的采样数据
    const sampleData = (data, maxSize = 20) => {
      if (data.length <= maxSize) return data
      const step = Math.ceil(data.length / maxSize)
      return data.filter((_, index) => index % step === 0)
    }

    // 构建表格 HTML
    const buildTable = (headers, rows, title) => `
      <h3 style="margin: 20px 0 10px 0; color: #303133; font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px;">${title}</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
        <thead>
          <tr style="background: #f5f5f5;">
            ${headers.map(h => `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr style="background: white;">
              ${row.map((cell, i) => `
                <td style="border: 1px solid #ddd; padding: 8px; text-align: ${i === row.length - 1 ? 'right' : 'left'};">${cell}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    // 构建趋势图表（使用简单的 CSS 柱状图）
    const buildTrendChart = (timeline) => {
      if (!timeline || timeline.length === 0) return ''

      try {
        // 安全获取数值，确保返回有效数字
        const safeValue = (val) => {
          const num = parseFloat(val)
          return isFinite(num) && !isNaN(num) ? num : 0
        }

        // 计算最大值，确保是有效数值
        const values = timeline.map(item => {
          const incomeKey = Object.keys(item).find(k => k.includes('total_income') || k.includes('total_expense') || k.includes('count'))
          return safeValue(item[incomeKey] || 0)
        })
       .filter(v => isFinite(v) && !isNaN(v))

        const maxValue = values.length > 0 ? Math.max(...values) : 1

        const height = 150
        const barWidth = Math.max(15, Math.floor(700 / timeline.length))
        const gap = Math.min(10, Math.floor(100 / timeline.length))

        let bars = ''
        timeline.forEach((item, index) => {
          const incomeKey = Object.keys(item).find(k => k.includes('total_income') || k.includes('total_expense') || k.includes('count'))
          const value = safeValue(item[incomeKey] || 0)

          // 计算柱子高度，确保是有限数值
          const barHeight = isFinite(maxValue) && maxValue > 0
            ? (value / maxValue) * (height - 20)
            : 0

          // 确保位置数值是有效的
          const x = isFinite(index) && isFinite(barWidth) && isFinite(gap)
            ? 50 + index * (barWidth + gap)
            : 50

          const barWidthSafe = isFinite(barWidth) ? barWidth : 15
          const barHeightSafe = isFinite(barHeight) ? Math.max(0, barHeight) : 0
          const xSafe = isFinite(x) ? x : 50
          const centerX = isFinite(xSafe) && isFinite(barWidthSafe) ? xSafe + barWidthSafe / 2 : 50
          const labelBottom = isFinite(barHeightSafe) ? barHeightSafe + 30 : 30

          const dateStr = item.date && typeof item.date === 'string' ? item.date : ''
          const dateShort = dateStr.length >= 5 ? dateStr.slice(-5) : dateStr
          const valueDisplay = isFinite(value) ? value.toFixed(0) : '0'

          bars += `
            <div style="position: absolute; left: ${xSafe}px; bottom: 25px; width: ${barWidthSafe}px; height: ${barHeightSafe}px; background: #409EFF; border-radius: 2px;"></div>
            <div style="position: absolute; left: ${centerX}px; bottom: 5px; width: ${barWidthSafe}px; text-align: center; font-size: 9px; color: #909399; transform: translateX(-50%); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${dateShort}</div>
            ${value > 0 ? `<div style="position: absolute; left: ${centerX}px; bottom: ${labelBottom}px; width: ${barWidthSafe}px; text-align: center; font-size: 8px; color: #606266; transform: translateX(-50%); white-space: nowrap;">${valueDisplay}</div>` : ''}
          `
        })

        return `
          <div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 4px; position: relative; height: ${height + 40}px; border: 1px solid #eee;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #303133;">趋势可视化</h4>
            <div style="position: absolute; left: 5px; top: 50%; transform: translateY(-50%); font-size: 9px; color: #909399;">数值</div>
            ${bars}
          </div>
        `
      } catch (error) {
        console.error('构建趋势图表时出错:', error)
        return ''
      }
    }

    // 统计概览表格
    let statisticsHtml = ''
    if (data.statistics) {
      const statsData = Object.entries(data.statistics).map(([key, value]) => [formatKey(key), formatValue(key, value)])
      statisticsHtml = buildTable(['统计项目', '数值'], statsData, '统计概览')
    }

    // 趋势数据表格（智能采样）
    let timelineHtml = ''
    let trendChartHtml = ''
    if (data.timeline && data.timeline.length > 0) {
      const sampledTimeline = sampleData(data.timeline, 15)
      const firstItem = sampledTimeline[0]
      const timelineHeaders = Object.keys(firstItem).map(k => formatKey(k))
      const timelineBody = sampledTimeline.map(item =>
        Object.entries(item).map(([key, value]) => {
          if (typeof value === 'number' && (key.includes('income') || key.includes('expense'))) {
            return isFinite(value) ? value.toFixed(2) : '0.00'
          }
          return String(value)
        })
      )
      timelineHtml = buildTable(timelineHeaders, timelineBody, `趋势数据${data.timeline.length > 15 ? ' (已采样显示' + sampledTimeline.length + '条，共' + data.timeline.length + '条)' : ''}`)
      trendChartHtml = buildTrendChart(sampledTimeline)
    }

    // 订单状态分布表格
    let statusHtml = ''
    if (data.status_stats && data.status_stats.length > 0) {
      const statusMap = { pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }
      const statusData = data.status_stats.map(item => [statusMap[item.status] || item.status, String(item.count)])
      statusHtml = buildTable(['状态', '数量'], statusData, '订单状态分布')
    }

    // AI 总结 HTML（增强可视化）
    let summaryHtml = ''
    if (summary) {
      const enhancedSummary = markdownToHtml(summary)
      summaryHtml = `
        <div style="margin-top: 30px; padding: 20px; border-top: 2px solid #409EFF; background: #f0f9ff; border-radius: 0 8px 8px 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 32px; height: 32px; background: #409EFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);">
              <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 style="margin: 0; color: #303133; font-size: 18px; font-weight: bold;">AI 智能分析总结</h3>
          </div>
          <div style="font-size: 12px; color: #606266; line-height: 1.8; padding-left: 10px; border-left: 3px solid #409EFF;">${enhancedSummary}</div>
        </div>
      `
    }

    // 组装完整的 HTML
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h1 style="margin: 0 0 10px 0; color: #303133; font-size: 24px; font-weight: bold;">${title}</h1>
        <p style="margin: 0; color: #909399; font-size: 11px;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
      </div>
      ${statisticsHtml}
      ${trendChartHtml}
      ${timelineHtml}
      ${statusHtml}
      ${summaryHtml}
    `

    document.body.appendChild(container)

    if (onProgress) onProgress(30, '正在渲染内容...')

    // 使用 html2canvas 将 HTML 转换为 canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    document.body.removeChild(container)

    if (onProgress) onProgress(70, '正在生成PDF...')

    // 创建 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let position = 0
    const pageHeight = 297

    // 处理多页
    while (position < imgHeight) {
      if (position > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        imgData,
        'PNG',
        0,
        -position,
        imgWidth,
        imgHeight
      )

      position += pageHeight
    }

    if (onProgress) onProgress(100, '正在保存文件...')

    // 下载 PDF
    pdf.save(fileName)

    if (onProgress) onProgress(100, '完成!')
  } catch (error) {
    console.error('PDF导出失败:', error)
    throw error
  }
}
