import request from './request'

// ==================== 维修进度 ====================
/**
 * 获取维修进度列表
 */
export function getRepairProgressList(params) {
  return request({
    url: '/repair-progress',
    method: 'get',
    params
  })
}

/**
 * 获取维修进度详情
 */
export function getRepairProgressDetail(id) {
  return request({
    url: `/repair-progress/${id}`,
    method: 'get'
  })
}

/**
 * 创建维修进度
 */
export function createRepairProgress(data) {
  return request({
    url: '/repair-progress',
    method: 'post',
    data
  })
}

/**
 * 更新维修进度
 */
export function updateRepairProgress(id, data) {
  return request({
    url: `/repair-progress/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除维修进度
 */
export function deleteRepairProgress(id) {
  return request({
    url: `/repair-progress/${id}`,
    method: 'delete'
  })
}

/**
 * 获取订单的进度列表
 */
export function getOrderProgress(orderId) {
  return request({
    url: `/repair-progress/order/${orderId}`,
    method: 'get'
  })
}

// ==================== 联动维修 ====================
/**
 * 获取联动维修列表
 */
export function getExternalRepairList(params) {
  return request({
    url: '/external-repairs',
    method: 'get',
    params
  })
}

/**
 * 获取联动维修详情
 */
export function getExternalRepairDetail(id) {
  return request({
    url: `/external-repairs/${id}`,
    method: 'get'
  })
}

/**
 * 创建联动维修
 */
export function createExternalRepair(data) {
  return request({
    url: '/external-repairs',
    method: 'post',
    data
  })
}

/**
 * 更新联动维修
 */
export function updateExternalRepair(id, data) {
  return request({
    url: `/external-repairs/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除联动维修
 */
export function deleteExternalRepair(id) {
  return request({
    url: `/external-repairs/${id}`,
    method: 'delete'
  })
}

// ==================== 进度申请 ====================
/**
 * 获取进度申请列表
 */
export function getProgressApplyList(params) {
  return request({
    url: '/progress-apply',
    method: 'get',
    params
  })
}

export function getProgressApplyStatistics() {
  return request({
    url: '/progress-apply/statistics',
    method: 'get'
  })
}

/**
 * 获取进度申请详情
 */
export function getProgressApplyDetail(id) {
  return request({
    url: `/progress-apply/${id}`,
    method: 'get'
  })
}

/**
 * 创建进度申请
 */
export function createProgressApply(data) {
  return request({
    url: '/progress-apply',
    method: 'post',
    data
  })
}

/**
 * 审批通过进度申请
 */
export function approveProgressApply(id, data = {}) {
  return request({
    url: `/progress-apply/${id}/approve`,
    method: 'post',
    data
  })
}

/**
 * 拒绝进度申请
 */
export function rejectProgressApply(id, data) {
  return request({
    url: `/progress-apply/${id}/reject`,
    method: 'post',
    data
  })
}

/**
 * 删除进度申请
 */
export function deleteProgressApply(id) {
  return request({
    url: `/progress-apply/${id}`,
    method: 'delete'
  })
}

export function syncProgressApply() {
  return request({
    url: '/progress-apply/sync',
    method: 'post'
  })
}

// ==================== 小程序维修进度 ====================
export function getMiniprogramRepairProgress(params) {
  return request({
    url: '/miniprogram-repair-progress',
    method: 'get',
    params
  })
}

export function getMiniprogramRepairProgressStatistics() {
  return request({
    url: '/miniprogram-repair-progress/statistics',
    method: 'get'
  })
}

export function updateMiniprogramRepairProgress(id, data) {
  return request({
    url: `/miniprogram-repair-progress/${id}/progress`,
    method: 'put',
    data
  })
}

// ==================== 小程序进度媒体 ====================
export function getMiniprogramProgressMediaSummary(params) {
  return request({
    url: '/miniprogram-progress-media/summary',
    method: 'get',
    params
  })
}

export function getMiniprogramOrderPhotos(orderId) {
  return request({
    url: `/miniprogram-progress-media/photos/${orderId}`,
    method: 'get'
  })
}

export function getMiniprogramOrderVideos(orderId) {
  return request({
    url: `/miniprogram-progress-media/videos/${orderId}`,
    method: 'get'
  })
}

// ==================== 进度照片 ====================
/**
 * 获取进度照片列表
 */
export function getProgressPhotoList(params) {
  return request({
    url: '/progress-photo',
    method: 'get',
    params
  })
}

/**
 * 获取进度照片详情
 */
export function getProgressPhotoDetail(id) {
  return request({
    url: `/progress-photo/${id}`,
    method: 'get'
  })
}

/**
 * 创建进度照片
 */
export function createProgressPhoto(data) {
  return request({
    url: '/progress-photo',
    method: 'post',
    data
  })
}

/**
 * 更新进度照片
 */
export function updateProgressPhoto(id, data) {
  return request({
    url: `/progress-photo/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除进度照片
 */
export function deleteProgressPhoto(id) {
  return request({
    url: `/progress-photo/${id}`,
    method: 'delete'
  })
}

// ==================== 进度视频 ====================
/**
 * 获取进度视频列表
 */
export function getProgressVideoList(params) {
  return request({
    url: '/progress-video',
    method: 'get',
    params
  })
}

/**
 * 获取进度视频详情
 */
export function getProgressVideoDetail(id) {
  return request({
    url: `/progress-video/${id}`,
    method: 'get'
  })
}

/**
 * 创建进度视频
 */
export function createProgressVideo(data) {
  return request({
    url: '/progress-video',
    method: 'post',
    data
  })
}

/**
 * 更新进度视频
 */
export function updateProgressVideo(id, data) {
  return request({
    url: `/progress-video/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除进度视频
 */
export function deleteProgressVideo(id) {
  return request({
    url: `/progress-video/${id}`,
    method: 'delete'
  })
}
