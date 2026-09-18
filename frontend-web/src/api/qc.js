import request from './request'

// ==================== 质检单 ====================

export function getQcOrders(params) {
  return request({ url: '/qc/orders', method: 'get', params })
}

export function getQcOrderDetail(id) {
  return request({ url: `/qc/orders/${id}`, method: 'get' })
}

export function createQcOrder(data) {
  return request({ url: '/qc/orders', method: 'post', data })
}

export function startQcOrder(id) {
  return request({ url: `/qc/orders/${id}/start`, method: 'put' })
}

export function gradeQcOrder(id, data) {
  return request({ url: `/qc/orders/${id}/grade`, method: 'put', data })
}

export function completeQcOrder(id) {
  return request({ url: `/qc/orders/${id}/complete`, method: 'put' })
}

export function getQcPriceSuggestion(id, gradeKey) {
  return request({ url: `/qc/orders/${id}/price-suggestion`, method: 'get', params: { grade_key: gradeKey } })
}

export function getQcReport(id) {
  return request({ url: `/qc/orders/${id}/report`, method: 'get' })
}

// ==================== 质检图片/视频 ====================

export function saveQcMedia(qcOrderId, data) {
  return request({ url: `/qc/orders/${qcOrderId}/media`, method: 'post', data })
}

export function deleteQcMedia(mediaId) {
  return request({ url: `/qc/media/${mediaId}`, method: 'delete' })
}

// ==================== 复核/争议 ====================

export function saveQcReview(qcOrderId, data) {
  return request({ url: `/qc/orders/${qcOrderId}/reviews`, method: 'post', data })
}

export function resolveQcReview(reviewId, data) {
  return request({ url: `/qc/reviews/${reviewId}`, method: 'put', data })
}

// ==================== 模板/质检项/成色标准/版本 ====================

export function getQcTemplates(params) {
  return request({ url: '/qc/templates', method: 'get', params })
}

export function getQcTemplateDetail(id) {
  return request({ url: `/qc/templates/${id}`, method: 'get' })
}

export function createQcTemplate(data) {
  return request({ url: '/qc/templates', method: 'post', data })
}

export function updateQcTemplate(id, data) {
  return request({ url: `/qc/templates/${id}`, method: 'put', data })
}

export function deleteQcTemplate(id) {
  return request({ url: `/qc/templates/${id}`, method: 'delete' })
}

export function createQcItem(templateId, data) {
  return request({ url: `/qc/templates/${templateId}/items`, method: 'post', data })
}

export function updateQcItem(id, data) {
  return request({ url: `/qc/items/${id}`, method: 'put', data })
}

export function deleteQcItem(id) {
  return request({ url: `/qc/items/${id}`, method: 'delete' })
}

export function createQcGrade(templateId, data) {
  return request({ url: `/qc/templates/${templateId}/grades`, method: 'post', data })
}

export function updateQcGrade(id, data) {
  return request({ url: `/qc/grades/${id}`, method: 'put', data })
}

export function deleteQcGrade(id) {
  return request({ url: `/qc/grades/${id}`, method: 'delete' })
}

export function publishQcVersion(templateId, changelog) {
  return request({ url: `/qc/templates/${templateId}/publish`, method: 'post', data: { changelog } })
}
