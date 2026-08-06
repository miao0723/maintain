/**
 * 发送邮件封装模块
 * 使用时：
 * import sendEmail from '@/utils/emailSender'
 * await sendEmail({ to, subject, message, format })
 * 返回解析后的 JSON（后端返回的对象）或抛出错误
 */

export default async function sendEmail({ to, subject = '通知', message = '', format = 'text', apiPath = '/api/mail/send' } = {}) {
  if (!to) throw new Error('missing to')
  if (!message) throw new Error('missing message')

  // 使用表单编码，兼容性更好（PHP 在部分环境下对 JSON body 解析不一致）
  const params = new URLSearchParams()
  params.append('to', to)
  params.append('subject', subject)
  params.append('message', message)
  params.append('format', format)

  const resp = await fetch(apiPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  // 尝试解析 JSON，若解析失败返回文本
  const text = await resp.text()
  try {
    const json = JSON.parse(text)
    if (!resp.ok) throw new Error(json.error || JSON.stringify(json))
    return json
  } catch (e) {
    if (!resp.ok) throw new Error(text || resp.statusText)
    // 成功但非 JSON 响应，返回文本包装
    return { success: true, data: text }
  }
}
