import request from './request'

/**
 * 维修合同 API
 */

/**
 * 获取维修合同列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {object} params - 搜索参数
 */
export function getRepairContractList(page = 1, pageSize = 10, params = {}) {
  return request({
    url: '/repair-contracts',
    method: 'get',
    params: {
      page,
      pageSize,
      ...params
    }
  })
}

/**
 * 获取维修合同详情
 * @param {number} id - 合同 ID
 */
export function getRepairContractDetail(id) {
  return request({
    url: `/repair-contracts/${id}`,
    method: 'get'
  })
}

/**
 * 创建维修合同
 * @param {object} data - 合同数据
 */
export function createRepairContract(data) {
  return request({
    url: '/repair-contracts',
    method: 'post',
    data
  })
}

/**
 * 更新维修合同
 * @param {number} id - 合同 ID
 * @param {object} data - 合同数据
 */
export function updateRepairContract(id, data) {
  return request({
    url: `/repair-contracts/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除维修合同
 * @param {number} id - 合同 ID
 */
export function deleteRepairContract(id) {
  return request({
    url: `/repair-contracts/${id}`,
    method: 'delete'
  })
}
