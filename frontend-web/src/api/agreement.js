import request from './request'

/**
 * 获取免责协议
 */
export function getAgreement() {
  return request({
    url: '/agreement',
    method: 'get'
  })
}

/**
 * 获取协议详情
 */
export function getAgreementDetail(id) {
  return request({
    url: `/agreement/${id}`,
    method: 'get'
  })
}

/**
 * 保存协议
 */
export function saveAgreement(data) {
  return request({
    url: '/agreement',
    method: 'post',
    data
  })
}

/**
 * 更新协议
 */
export function updateAgreement(id, data) {
  return request({
    url: `/agreement/${id}`,
    method: 'put',
    data
  })
}

/**
 * 预览协议
 */
export function previewAgreement(id) {
  return request({
    url: `/agreement/${id}/preview`,
    method: 'get'
  })
}
