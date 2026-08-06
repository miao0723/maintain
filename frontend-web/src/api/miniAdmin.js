import miniAdminRequest from './miniAdminRequest'

export function getMiniAdminResourceList(resource, params) {
  return miniAdminRequest({ url: `/${resource}`, method: 'get', params })
}

export function getMiniAdminResourceDetail(resource, id) {
  return miniAdminRequest({ url: `/${resource}/${id}`, method: 'get' })
}

export function createMiniAdminResource(resource, data) {
  return miniAdminRequest({ url: `/${resource}`, method: 'post', data })
}

export function updateMiniAdminResource(resource, id, data) {
  return miniAdminRequest({ url: `/${resource}/${id}`, method: 'put', data })
}

export function deleteMiniAdminResource(resource, id) {
  return miniAdminRequest({ url: `/${resource}/${id}`, method: 'delete' })
}

export function getMiniAdminOrders(params) {
  return miniAdminRequest({ url: '/orders', method: 'get', params })
}

export function getMiniAdminOrderDetail(id) {
  return miniAdminRequest({ url: `/orders/${id}`, method: 'get' })
}

export function createMiniAdminOrder(data) {
  return miniAdminRequest({ url: '/orders', method: 'post', data })
}

export function updateMiniAdminOrder(id, data) {
  return miniAdminRequest({ url: `/orders/${id}`, method: 'put', data })
}

export function getMiniAdminProgress(params) {
  return miniAdminRequest({ url: '/progress', method: 'get', params })
}

export function getMiniAdminProgressStatistics() {
  return miniAdminRequest({ url: '/progress/statistics', method: 'get' })
}

export function updateMiniAdminProgress(id, data) {
  return miniAdminRequest({ url: `/progress/${id}/progress`, method: 'put', data })
}

export function getMiniAdminProgressMediaSummary(params) {
  return miniAdminRequest({ url: '/progress-media/summary', method: 'get', params })
}

export function getMiniAdminOrderPhotos(orderId) {
  return miniAdminRequest({ url: `/progress-media/photos/${orderId}`, method: 'get' })
}

export function getMiniAdminOrderVideos(orderId) {
  return miniAdminRequest({ url: `/progress-media/videos/${orderId}`, method: 'get' })
}

export function getMiniAdminReviews(params) {
  return miniAdminRequest({ url: '/reviews', method: 'get', params })
}

export function getMiniAdminReviewDetail(id) {
  return miniAdminRequest({ url: `/reviews/${id}`, method: 'get' })
}

export function replyMiniAdminReview(id, content) {
  return miniAdminRequest({ url: `/reviews/${id}/reply`, method: 'post', data: { content } })
}

export function deleteMiniAdminReview(id) {
  return miniAdminRequest({ url: `/reviews/${id}`, method: 'delete' })
}

export function getMiniAdminProgressApplyList(params) {
  return miniAdminRequest({ url: '/progress-apply', method: 'get', params })
}

export function getMiniAdminProgressApplyStatistics() {
  return miniAdminRequest({ url: '/progress-apply/statistics', method: 'get' })
}

export function getMiniAdminProgressApplyDetail(id) {
  return miniAdminRequest({ url: `/progress-apply/${id}`, method: 'get' })
}

export function createMiniAdminProgressApply(data) {
  return miniAdminRequest({ url: '/progress-apply', method: 'post', data })
}

export function approveMiniAdminProgressApply(id, data) {
  return miniAdminRequest({ url: `/progress-apply/${id}/approve`, method: 'post', data })
}

export function rejectMiniAdminProgressApply(id, data) {
  return miniAdminRequest({ url: `/progress-apply/${id}/reject`, method: 'post', data })
}

export function syncMiniAdminProgressApply() {
  return miniAdminRequest({ url: '/progress-apply/sync', method: 'post' })
}

export function getMiniAdminUsers(params) {
  return miniAdminRequest({ url: '/users', method: 'get', params })
}

export function updateMiniAdminUser(id, data) {
  return miniAdminRequest({ url: `/users/${id}`, method: 'put', data })
}

export function getMiniAdminAddresses(params) {
  return miniAdminRequest({ url: '/addresses', method: 'get', params })
}

export function getMiniAdminUnits(params) {
  return miniAdminRequest({ url: '/units', method: 'get', params })
}

export function getMiniAdminBrands(params) {
  return miniAdminRequest({ url: '/brands', method: 'get', params })
}

export function getMiniAdminDeviceTypes(params) {
  return miniAdminRequest({ url: '/device-types', method: 'get', params })
}

export function getMiniAdminCommonProblems(params) {
  return miniAdminRequest({ url: '/common-problems', method: 'get', params })
}

export function createMiniAdminCommonProblem(data) {
  return miniAdminRequest({ url: '/common-problems', method: 'post', data })
}

export function updateMiniAdminCommonProblem(id, data) {
  return miniAdminRequest({ url: `/common-problems/${id}`, method: 'put', data })
}

export function deleteMiniAdminCommonProblem(id) {
  return miniAdminRequest({ url: `/common-problems/${id}`, method: 'delete' })
}

export function getMiniAdminCommonProblemDeviceTypes() {
  return miniAdminRequest({ url: '/common-problems/device-types', method: 'get' })
}

export function syncMiniAdminCommonProblemsToLocal() {
  return miniAdminRequest({ url: '/common-problems/sync/to-local', method: 'post' })
}

export function syncMiniAdminCommonProblemsFromLocal() {
  return miniAdminRequest({ url: '/common-problems/sync/from-local', method: 'post' })
}

export function getMiniAdminChats(params) {
  return miniAdminRequest({ url: '/chats', method: 'get', params })
}

export function getMiniAdminChatDetail(id) {
  return miniAdminRequest({ url: `/chats/${id}`, method: 'get' })
}

export function updateMiniAdminChat(id, data) {
  return miniAdminRequest({ url: `/chats/${id}`, method: 'put', data })
}

export function remarkMiniAdminChatMessage(id, remark) {
  return miniAdminRequest({ url: `/chats/messages/${id}/remark`, method: 'post', data: { remark } })
}

export function getMiniAdminPayments(params) {
  return miniAdminRequest({ url: '/payments', method: 'get', params })
}

export function getMiniAdminPaymentDetail(id) {
  return miniAdminRequest({ url: `/payments/${id}`, method: 'get' })
}

export function updateMiniAdminPayment(id, data) {
  return miniAdminRequest({ url: `/payments/${id}`, method: 'put', data })
}

export function getMiniAdminConfigs(params) {
  return miniAdminRequest({ url: '/configs', method: 'get', params })
}

export function updateMiniAdminConfig(id, data) {
  return miniAdminRequest({ url: `/configs/${id}`, method: 'put', data })
}

export function getMiniAdminSyncLogs(params) {
  return miniAdminRequest({ url: '/sync-logs', method: 'get', params })
}

export function getMiniAdminSyncLogDetail(id) {
  return miniAdminRequest({ url: `/sync-logs/${id}`, method: 'get' })
}

export function retryMiniAdminSyncLog(id) {
  return miniAdminRequest({ url: `/sync-logs/${id}/retry`, method: 'post' })
}
