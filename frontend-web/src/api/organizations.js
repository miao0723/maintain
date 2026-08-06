import request from './request'

/**
 * 获取单位列表
 */
export function getOrganizationList(params) {
  return request({
    url: '/organizations',
    method: 'get',
    params
  })
}

/**
 * 获取单位详情
 */
export function getOrganizationDetail(id) {
  return request({
    url: `/organizations/${id}`,
    method: 'get'
  })
}

/**
 * 创建单位
 */
export function createOrganization(data) {
  return request({
    url: '/organizations',
    method: 'post',
    data
  })
}

/**
 * 更新单位
 */
export function updateOrganization(id, data) {
  return request({
    url: `/organizations/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除单位
 */
export function deleteOrganization(id) {
  return request({
    url: `/organizations/${id}`,
    method: 'delete'
  })
}
