import request from './request'

/**
 * 维修报告 API
 */

/**
 * 获取维修报告列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {object} params - 搜索参数
 */
export function getRepairReportList(page = 1, pageSize = 10, params = {}) {
  return request({
    url: '/repair-reports',
    method: 'get',
    params: {
      page,
      pageSize,
      ...params
    }
  })
}

/**
 * 获取维修报告详情
 * @param {number} id - 报告 ID
 */
export function getRepairReportDetail(id) {
  return request({
    url: `/repair-reports/${id}`,
    method: 'get'
  })
}

/**
 * 创建维修报告
 * @param {object} data - 报告数据
 */
export function createRepairReport(data) {
  return request({
    url: '/repair-reports',
    method: 'post',
    data
  })
}

/**
 * 更新维修报告
 * @param {number} id - 报告 ID
 * @param {object} data - 报告数据
 */
export function updateRepairReport(id, data) {
  return request({
    url: `/repair-reports/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除维修报告
 * @param {number} id - 报告 ID
 */
export function deleteRepairReport(id) {
  return request({
    url: `/repair-reports/${id}`,
    method: 'delete'
  })
}

/**
 * 从电子维修库导入已完成订单到维修报告
 */
export function importFromRepair() {
  return request({
    url: '/repair-reports/import',
    method: 'post'
  })
}

/**
 * 获取可导入订单预览
 */
export function getImportPreview() {
  return request({
    url: '/repair-reports/import-preview',
    method: 'get'
  })
}

/**
 * 导入单个订单
 * @param {number} orderId - 电子维修库的订单ID
 */
export function importSingleOrder(orderId) {
  return request({
    url: '/repair-reports/import-single',
    method: 'post',
    data: { order_id: orderId }
  })
}
