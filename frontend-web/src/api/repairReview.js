import request from '@/api/request'

export function getOrderReviews(page = 1, pageSize = 20, params = {}) {
  return request({
    url: '/miniprogram-reviews',
    method: 'get',
    params: Object.assign({ page, pageSize }, params)
  })
}

export function getOrderReviewDetail(id) {
  return request({
    url: `/miniprogram-reviews/${id}`,
    method: 'get'
  })
}

export function getOrderReviewStatistics() {
  return request({ url: '/miniprogram-reviews/statistics', method: 'get' })
}

export function deleteOrderReview(id) {
  return request({ url: `/miniprogram-reviews/${id}`, method: 'delete' })
}

export function replyOrderReview(id, content) {
  return request({ url: `/miniprogram-reviews/${id}/reply`, method: 'post', data: { content } })
}

export function exportOrderReviews(params = {}) {
  // return URL for direct download
  const qs = new URLSearchParams(params).toString()
  return `/api/miniprogram-reviews/export${qs ? ('?' + qs) : ''}`
}
