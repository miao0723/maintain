import request from './request'

/**
 * 获取报价单列表
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @param {object} params - 筛选参数
 * @returns {Promise}
 */
export function getQuotationList(page = 1, limit = 20, params = {}) {
  return request({
    url: '/quotation-orders',
    method: 'get',
    params: {
      page,
      limit,
      ...params
    }
  })
}

/**
 * 获取报价单详情
 * @param {number} id - 报价单 ID
 * @returns {Promise}
 */
export function getQuotationDetail(id) {
  return request({
    url: `/quotation-orders/${id}`,
    method: 'get'
  })
}

/**
 * 根据订单号获取报价单
 * @param {string} orderNo - 订单号
 * @returns {Promise}
 */
export function getQuotationByOrderNo(orderNo) {
  return request({
    url: `/quotation-orders/order/${orderNo}`,
    method: 'get'
  })
}

/**
 * 创建报价单
 * @param {object} data - 报价单数据
 * @returns {Promise}
 */
export function createQuotation(data) {
  return request({
    url: '/quotation-orders',
    method: 'post',
    data
  })
}

/**
 * 更新报价单
 * @param {number} id - 报价单 ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
export function updateQuotation(id, data) {
  return request({
    url: `/quotation-orders/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除报价单
 * @param {number} id - 报价单 ID
 * @returns {Promise}
 */
export function deleteQuotation(id) {
  return request({
    url: `/quotation-orders/${id}`,
    method: 'delete'
  })
}

/**
 * 提交报价单
 * @param {number} id - 报价单 ID
 * @returns {Promise}
 */
export function submitQuotation(id) {
  return request({
    url: `/quotation-orders/${id}/submit`,
    method: 'post'
  })
}

/**
 * 接受报价单
 * @param {number} id - 报价单 ID
 * @returns {Promise}
 */
export function acceptQuotation(id) {
  return request({
    url: `/quotation-orders/${id}/accept`,
    method: 'post'
  })
}

/**
 * 拒绝报价单
 * @param {number} id - 报价单 ID
 * @param {string} reason - 拒绝原因
 * @returns {Promise}
 */
export function rejectQuotation(id, reason) {
  return request({
    url: `/quotation-orders/${id}/reject`,
    method: 'post',
    data: { reason }
  })
}
