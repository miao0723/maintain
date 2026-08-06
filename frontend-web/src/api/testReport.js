import request from './request'

/**
 * 检测报告 API
 */

/**
 * 获取检测报告列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {object} params - 搜索参数
 */
export function getTestReportList(page = 1, pageSize = 10, params = {}) {
  return request({
    url: '/test-reports',
    method: 'get',
    params: {
      page,
      pageSize,
      ...params
    }
  })
}

/**
 * 获取检测报告详情
 * @param {number} id - 报告 ID
 */
export function getTestReportDetail(id) {
  return request({
    url: `/test-reports/${id}`,
    method: 'get'
  })
}

/**
 * 创建检测报告
 * @param {object} data - 报告数据
 */
export function createTestReport(data) {
  return request({
    url: '/test-reports',
    method: 'post',
    data
  })
}

/**
 * 更新检测报告
 * @param {number} id - 报告 ID
 * @param {object} data - 报告数据
 */
export function updateTestReport(id, data) {
  return request({
    url: `/test-reports/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除检测报告
 * @param {number} id - 报告 ID
 */
export function deleteTestReport(id) {
  return request({
    url: `/test-reports/${id}`,
    method: 'delete'
  })
}
