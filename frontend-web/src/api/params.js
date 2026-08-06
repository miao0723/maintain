import request from './request'

/**
 * 获取系统参数列表
 */
export function getSystemParamList(params) {
  return request({
    url: '/system-params',
    method: 'get',
    params
  })
}

/**
 * 获取系统参数详情
 */
export function getSystemParamDetail(id) {
  return request({
    url: `/system-params/${id}`,
    method: 'get'
  })
}

/**
 * 创建系统参数
 */
export function createSystemParam(data) {
  return request({
    url: '/system-params',
    method: 'post',
    data
  })
}

/**
 * 更新系统参数
 */
export function updateSystemParam(id, data) {
  return request({
    url: `/system-params/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除系统参数
 */
export function deleteSystemParam(id) {
  return request({
    url: `/system-params/${id}`,
    method: 'delete'
  })
}

/**
 * 刷新参数缓存
 */
export function refreshParamCache() {
  return request({
    url: '/system-params/refresh-cache',
    method: 'post'
  })
}
