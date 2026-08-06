import request from './request'

export function getCaseList(params) {
  return request({ url: '/marketing/cases', method: 'get', params })
}

export function getCaseDetail(id) {
  return request({ url: `/marketing/cases/${id}`, method: 'get' })
}

export function createCase(data) {
  return request({ url: '/marketing/cases', method: 'post', data })
}

export function updateCase(id, data) {
  return request({ url: `/marketing/cases/${id}`, method: 'put', data })
}

export function deleteCase(id) {
  return request({ url: `/marketing/cases/${id}`, method: 'delete' })
}

export function getServiceConfig() {
  return request({ url: '/marketing/service-config', method: 'get' })
}

export function updateServiceConfig(data) {
  return request({ url: '/marketing/service-config', method: 'put', data })
}

export function getDouyinList(params) {
  return request({ url: '/marketing/douyin', method: 'get', params })
}

export function getDouyinDetail(id) {
  return request({ url: `/marketing/douyin/${id}`, method: 'get' })
}

export function generateDouyinVideo(data) {
  return request({
    url: '/marketing/douyin/generate',
    method: 'post',
    data,
    timeout: 180000
  })
}

export function createDouyin(data) {
  return request({ url: '/marketing/douyin', method: 'post', data })
}

export function updateDouyin(id, data) {
  return request({ url: `/marketing/douyin/${id}`, method: 'put', data })
}

export function deleteDouyin(id) {
  return request({ url: `/marketing/douyin/${id}`, method: 'delete' })
}

export function publishDouyin(id, data = {}) {
  return request({ url: `/marketing/douyin/${id}/publish`, method: 'post', data })
}

export function getPublishStatus(id) {
  return request({ url: `/marketing/douyin/${id}/publish/status`, method: 'get' })
}

export function optimizeDouyinVideo(id, data) {
  return request({ url: `/marketing/douyin/${id}/optimize`, method: 'post', data, timeout: 180000 })
}

// 小红书API
export function getXiaohongshuList(params) {
  return request({ url: '/marketing/xiaohongshu', method: 'get', params })
}

export function getXiaohongshuDetail(id) {
  return request({ url: `/marketing/xiaohongshu/${id}`, method: 'get' })
}

export function createXiaohongshu(data) {
  return request({ url: '/marketing/xiaohongshu', method: 'post', data })
}

export function updateXiaohongshu(id, data) {
  return request({ url: `/marketing/xiaohongshu/${id}`, method: 'put', data })
}

export function deleteXiaohongshu(id) {
  return request({ url: `/marketing/xiaohongshu/${id}`, method: 'delete' })
}

export function publishXiaohongshu(id, data = {}) {
  return request({ url: `/marketing/xiaohongshu/${id}/publish`, method: 'post', data })
}

export function getXiaohongshuPublishStatus(id) {
  return request({ url: `/marketing/xiaohongshu/${id}/publish/status`, method: 'get' })
}

export function downloadXiaohongshu(id) {
  return request({ url: `/marketing/xiaohongshu/${id}/download`, method: 'post' })
}

export function downloadDouyin(id) {
  return request({ url: `/marketing/douyin/${id}/download`, method: 'post' })
}

export function downloadDouyinFile(id) {
  return request({
    url: `/marketing/douyin/${id}/download`,
    method: 'get',
    params: { direct: 1 },
    responseType: 'blob'
  })
}

// B站API
export function getBilibiliList(params) {
  return request({ url: '/marketing/bilibili', method: 'get', params })
}

export function getBilibiliDetail(id) {
  return request({ url: `/marketing/bilibili/${id}`, method: 'get' })
}

export function createBilibili(data) {
  return request({ url: '/marketing/bilibili', method: 'post', data })
}

export function updateBilibili(id, data) {
  return request({ url: `/marketing/bilibili/${id}`, method: 'put', data })
}

export function deleteBilibili(id) {
  return request({ url: `/marketing/bilibili/${id}`, method: 'delete' })
}

export function publishBilibili(id, data = {}) {
  return request({ url: `/marketing/bilibili/${id}/publish`, method: 'post', data })
}

export function getBilibiliPublishStatus(id) {
  return request({ url: `/marketing/bilibili/${id}/publish/status`, method: 'get' })
}

export function downloadBilibili(id) {
  return request({ url: `/marketing/bilibili/${id}/download`, method: 'post' })
}

// 快手API
export function getKuaishouList(params) {
  return request({ url: '/marketing/kuaishou', method: 'get', params })
}

export function getKuaishouDetail(id) {
  return request({ url: `/marketing/kuaishou/${id}`, method: 'get' })
}

export function createKuaishou(data) {
  return request({ url: '/marketing/kuaishou', method: 'post', data })
}

export function updateKuaishou(id, data) {
  return request({ url: `/marketing/kuaishou/${id}`, method: 'put', data })
}

export function deleteKuaishou(id) {
  return request({ url: `/marketing/kuaishou/${id}`, method: 'delete' })
}

export function publishKuaishou(id, data = {}) {
  return request({ url: `/marketing/kuaishou/${id}/publish`, method: 'post', data })
}

export function getKuaishouPublishStatus(id) {
  return request({ url: `/marketing/kuaishou/${id}/publish/status`, method: 'get' })
}

export function downloadKuaishou(id) {
  return request({ url: `/marketing/kuaishou/${id}/download`, method: 'post' })
}

export function getPartnerList(params) {
  return request({ url: '/marketing/partners', method: 'get', params })
}

export function getPartnerDetail(id) {
  return request({ url: `/marketing/partners/${id}`, method: 'get' })
}

export function createPartner(data) {
  return request({ url: '/marketing/partners', method: 'post', data })
}

export function updatePartner(id, data) {
  return request({ url: `/marketing/partners/${id}`, method: 'put', data })
}

export function deletePartner(id) {
  return request({ url: `/marketing/partners/${id}`, method: 'delete' })
}
