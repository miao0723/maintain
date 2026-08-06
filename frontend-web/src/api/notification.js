import request from './request'

export function getNotifications(params) {
  return request({
    url: '/notifications',
    method: 'get',
    params: {
      page: params.page || 1,
      limit: params.pageSize || params.limit || 20
    }
  })
}

export function markAsRead(id) {
  return request({
    url: `/notifications/mark-read/${id}`,
    method: 'post'
  })
}

export function markAllAsRead() {
  return request({
    url: '/notifications/mark-all-read',
    method: 'post'
  })
}

export function deleteNotification(id) {
  return request({
    url: `/notifications/${id}`,
    method: 'delete'
  })
}

export function getUnreadCount() {
  return request({
    url: '/notifications/unread-count',
    method: 'get'
  })
}
