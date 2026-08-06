import request from './request'

/**
 * 获取小程序订单列表
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @param {object} params - 筛选参数
 * @returns {Promise}
 */
export function getRepairOrderList(page = 1, limit = 20, params = {}) {
  return request({
    url: '/repair-orders',
    method: 'get',
    params: {
      page,
      limit,
      ...params
    }
  })
}

/**
 * 获取订单详情
 * @param {number} id - 订单 ID
 * @returns {Promise}
 */
export function getRepairOrderDetail(id) {
  return request({
    url: `/repair-orders/${id}`,
    method: 'get'
  })
}

/**
 * 接单（分配维修人员）
 * @param {number} id - 订单 ID
 * @param {number} userId - 维修人员 ID
 * @returns {Promise}
 */
export function acceptRepairOrder(id, userId) {
  return request({
    url: `/repair-orders/${id}/accept`,
    method: 'post',
    data: { user_id: userId }
  })
}

/**
 * 更新订单状态
 * @param {number} id - 订单 ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
export function updateRepairOrderStatus(id, data) {
  return request({
    url: `/repair-orders/${id}/status`,
    method: 'post',
    data
  })
}

/**
 * 获取待处理订单列表
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {Promise}
 */
export function getPendingOrders(page = 1, limit = 20) {
  return request({
    url: '/repair-orders/pending',
    method: 'get',
    params: { page, limit }
  })
}

/**
 * 获取维修中订单列表
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {Promise}
 */
export function getProcessingOrders(page = 1, limit = 20) {
  return request({
    url: '/repair-orders/processing',
    method: 'get',
    params: { page, limit }
  })
}

/**
 * 获取订单统计信息
 * @returns {Promise}
 */
export function getRepairOrderStats() {
  return request({
    url: '/repair-orders/statistics',
    method: 'get'
  })
}
