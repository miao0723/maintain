import request from './request'

/**
 * 维修提醒 API
 */

/**
 * 获取维修提醒列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {object} params - 搜索参数
 */
export function getRepairReminderList(page = 1, pageSize = 10, params = {}) {
  return request({
    url: '/repair-reminders',
    method: 'get',
    params: {
      page,
      pageSize,
      ...params
    }
  })
}

/**
 * 获取维修提醒详情
 * @param {number} id - 提醒 ID
 */
export function getRepairReminderDetail(id) {
  return request({
    url: `/repair-reminders/${id}`,
    method: 'get'
  })
}

/**
 * 创建维修提醒
 * @param {object} data - 提醒数据
 */
export function createRepairReminder(data) {
  return request({
    url: '/repair-reminders',
    method: 'post',
    data
  })
}

/**
 * 更新维修提醒
 * @param {number} id - 提醒 ID
 * @param {object} data - 提醒数据
 */
export function updateRepairReminder(id, data) {
  return request({
    url: `/repair-reminders/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除维修提醒
 * @param {number} id - 提醒 ID
 */
export function deleteRepairReminder(id) {
  return request({
    url: `/repair-reminders/${id}`,
    method: 'delete'
  })
}

/**
 * 手动触发发送提醒邮件
 * @param {number} id
 * @param {object} data - 可选参数 {to, subject, message, format}
 */
export function sendRepairReminderEmail(id, data = {}) {
  return request({
    url: `/repair-reminders/${id}/send-email`,
    method: 'post',
    data
  })
}

/**
 * 触发按提醒日期自动发送到期邮件
 */
export function sendDueRepairReminderEmails() {
  return request({
    url: '/repair-reminders/send-due-email',
    method: 'post'
  })
}

/**
 * 获取维修超时未完成订单提醒（数据源：小程序 orders）
 * 维修天数 > days 天且未完成（status 非 completed/cancelled）
 * @param {object} params - { page, pageSize, days, status }
 */
export function getOverdueRepairOrders(params = {}) {
  return request({
    url: '/repair-reminders/overdue-orders',
    method: 'get',
    params
  })
}

/**
 * 针对单个超时订单发送提醒（邮件通知管理员，基于 QQ 邮箱授权）
 * @param {number} orderId - 小程序订单主键 id
 * @param {object} payload - { to, subject, message, format }
 */
export function sendOrderRepairReminder(orderId, payload = {}) {
  return request({
    url: `/repair-reminders/${orderId}/send-order-reminder`,
    method: 'post',
    data: payload
  })
}
