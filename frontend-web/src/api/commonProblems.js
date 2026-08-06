import request from './request'

/**
 * 获取常见问题列表
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @param {object} params - 筛选参数 { keyword, device_type_id }
 * @returns {Promise}
 */
export function getCommonProblemList(page = 1, limit = 20, params = {}) {
  return request({
    url: '/common-problems',
    method: 'get',
    params: {
      page,
      limit,
      ...params
    }
  })
}

/**
 * 获取常见问题详情
 * @param {number} id - 问题 ID
 * @returns {Promise}
 */
export function getCommonProblemDetail(id) {
  return request({
    url: `/common-problems/${id}`,
    method: 'get'
  })
}

/**
 * 创建常见问题
 * @param {object} data - 问题数据 { device_type_id, name, icon, base_price, price_range }
 * @returns {Promise}
 */
export function createCommonProblem(data) {
  return request({
    url: '/common-problems',
    method: 'post',
    data
  })
}

/**
 * 更新常见问题
 * @param {number} id - 问题 ID
 * @param {object} data - 更新数据
 * @returns {Promise}
 */
export function updateCommonProblem(id, data) {
  return request({
    url: `/common-problems/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除常见问题
 * @param {number} id - 问题 ID
 * @returns {Promise}
 */
export function deleteCommonProblem(id) {
  return request({
    url: `/common-problems/${id}`,
    method: 'delete'
  })
}

/**
 * 获取设备类型列表（用于下拉选择）
 * @returns {Promise}
 */
export function getDeviceTypes() {
  return request({
    url: '/common-problems/device-types',
    method: 'get'
  })
}

/**
 * 同步：从 common_problems 同步到本地 maintenance_items
 * @returns {Promise}
 */
export function syncToLocal() {
  return request({
    url: '/common-problems/sync/to-local',
    method: 'post'
  })
}

/**
 * 同步：从本地 maintenance_items 导入到 common_problems
 * @returns {Promise}
 */
export function syncFromLocal() {
  return request({
    url: '/common-problems/sync/from-local',
    method: 'post'
  })
}