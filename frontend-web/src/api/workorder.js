import request from './request'

/**
 * 获取工单列表
 */
export function getWorkOrderList(params) {
  return request({
    url: '/workorders',
    method: 'get',
    params
  })
}

/**
 * 获取工单详情
 */
export function getWorkOrderDetail(id) {
  return request({
    url: `/workorders/${id}`,
    method: 'get'
  })
}

/**
 * 创建工单
 */
export function createWorkOrder(data) {
  return request({
    url: '/workorders',
    method: 'post',
    data
  })
}

/**
 * 更新工单
 */
export function updateWorkOrder(id, data) {
  return request({
    url: `/workorders/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除工单
 */
export function deleteWorkOrder(id) {
  return request({
    url: `/workorders/${id}`,
    method: 'delete'
  })
}

/**
 * 指派维修人
 */
export function assignWorkOrder(id, data) {
  return request({
    url: `/workorders/${id}/assign`,
    method: 'post',
    data
  })
}

/**
 * 接单
 */
export function acceptWorkOrder(id) {
  return request({
    url: `/workorders/${id}/accept`,
    method: 'post'
  })
}

/**
 * 开始维修
 */
export function startWorkOrder(id) {
  return request({
    url: `/workorders/${id}/start`,
    method: 'post'
  })
}

/**
 * 完成维修
 */
export function completeWorkOrder(id, data) {
  return request({
    url: `/workorders/${id}/complete`,
    method: 'post',
    data
  })
}

/**
 * 验收工单
 */
export function verifyWorkOrder(id, data) {
  return request({
    url: `/workorders/${id}/verify`,
    method: 'post',
    data
  })
}

/**
 * 关闭工单
 */
export function closeWorkOrder(id) {
  return request({
    url: `/workorders/${id}/close`,
    method: 'post'
  })
}

/**
 * 我的工单
 */
export function getMyWorkOrders(params) {
  return request({
    url: '/workorders/my',
    method: 'get',
    params
  })
}

/**
 * 工单统计
 */
export async function getWorkOrderStatistics(params) {
  try {
    const res = await request({
      url: '/workorders/statistics',
      method: 'get',
      params
    })
    // 返回完整响应，让调用方处理
    return res.data || res
  } catch (error) {
    // 返回默认值而不是抛出错误
    return {
      total_orders: 0,
      pending_orders: 0,
      completed_orders: 0,
      in_progress_orders: 0,
      by_status: {},
      by_priority: {}
    }
  }
}
