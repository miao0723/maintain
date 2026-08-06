import request from './request'

/**
 * 获取小程序维修订单列表
 */
export function getMiniprogramRepairOrderList(params) {
  return request({
    url: '/miniprogram-repair-progress',
    method: 'get',
    params
  })
}

/**
 * 获取小程序维修订单详情
 */
export function getMiniprogramRepairOrderDetail(id) {
  return request({
    url: `/miniprogram-repair-progress/${id}`,
    method: 'get'
  })
}

/**
 * 更新订单进度
 */
export function updateMiniprogramRepairProgress(id, data) {
  return request({
    url: `/miniprogram-repair-progress/${id}/progress`,
    method: 'put',
    data
  })
}

/**
 * 获取订单的进度照片
 */
export function getMiniprogramRepairOrderPhotos(id) {
  return request({
    url: `/miniprogram-repair-progress/${id}/photos`,
    method: 'get'
  })
}

/**
 * 获取订单的进度视频
 */
export function getMiniprogramRepairOrderVideos(id) {
  return request({
    url: `/miniprogram-repair-progress/${id}/videos`,
    method: 'get'
  })
}

/**
 * 获取统计信息
 */
export function getMiniprogramRepairStatistics() {
  return request({
    url: '/miniprogram-repair-progress/statistics',
    method: 'get'
  })
}
