import request from './request'

/**
 * 获取设备列表
 */
export function getDeviceList(params) {
  return request({
    url: '/devices',
    method: 'get',
    params
  })
}

/**
 * 获取设备详情
 */
export function getDeviceDetail(id) {
  return request({
    url: `/devices/${id}`,
    method: 'get'
  })
}

/**
 * 创建设备
 */
export function createDevice(data) {
  return request({
    url: '/devices',
    method: 'post',
    data
  })
}

/**
 * 更新设备
 */
export function updateDevice(id, data) {
  return request({
    url: `/devices/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除设备
 */
export function deleteDevice(id) {
  return request({
    url: `/devices/${id}`,
    method: 'delete'
  })
}

/**
 * 获取设备分类列表
 */
export function getDeviceCategories() {
  return request({
    url: '/devices/categories',
    method: 'get'
  })
}

/**
 * 获取设备维修历史
 */
export function getDeviceHistory(id, params) {
  return request({
    url: `/devices/${id}/history`,
    method: 'get',
    params
  })
}

/**
 * 生成设备二维码
 */
export function generateDeviceQRCode(id) {
  return request({
    url: `/devices/${id}/qrcode`,
    method: 'post'
  })
}
