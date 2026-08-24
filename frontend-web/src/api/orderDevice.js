import request from './request'

/**
 * 订单设备明细 - 接口
 * 后端: GET/POST /api/order-devices, GET/PUT/DELETE /api/order-devices/:id
 */

export function getOrderDeviceList(params) {
  return request({
    url: '/order-devices',
    method: 'get',
    params
  })
}

export function getOrderDeviceDetail(id) {
  return request({
    url: `/order-devices/${id}`,
    method: 'get'
  })
}

export function createOrderDevice(data) {
  return request({
    url: '/order-devices',
    method: 'post',
    data
  })
}

export function updateOrderDevice(id, data) {
  return request({
    url: `/order-devices/${id}`,
    method: 'put',
    data
  })
}

export function deleteOrderDevice(id) {
  return request({
    url: `/order-devices/${id}`,
    method: 'delete'
  })
}
