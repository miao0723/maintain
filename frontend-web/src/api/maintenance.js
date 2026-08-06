import request from './request'

/**
 * 获取维修内容列表
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @param {object} params - 筛选参数
 * @returns {Promise}
 */
export function getMaintenanceItemList(page = 1, limit = 20, params = {}) {
  return request({
    url: '/maintenance-items',
    method: 'get',
    params: {
      page,
      limit,
      ...params
    }
  })
}

/**
 * 获取维修内容详情
 * @param {number} id - 维修项目 ID
 * @returns {Promise}
 */
export function getMaintenanceItemDetail(id) {
  return request({
    url: `/maintenance-items/${id}`,
    method: 'get'
  })
}

/**
 * 创建维修项目
 * @param {object} data - 维修项目数据
 * @returns {Promise}
 */
export function createMaintenanceItem(data) {
  return request({
    url: '/maintenance-items',
    method: 'post',
    data
  })
}

/**
 * 更新维修项目
 * @param {number} id - 维修项目 ID
 * @param {object} data - 维修项目数据
 * @returns {Promise}
 */
export function updateMaintenanceItem(id, data) {
  return request({
    url: `/maintenance-items/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除维修项目
 * @param {number} id - 维修项目 ID
 * @returns {Promise}
 */
export function deleteMaintenanceItem(id) {
  return request({
    url: `/maintenance-items/${id}`,
    method: 'delete'
  })
}

/**
 * 获取分类列表
 * @returns {Promise}
 */
export function getMaintenanceCategories() {
  return request({
    url: '/maintenance-items/categories',
    method: 'get'
  })
}
