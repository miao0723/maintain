import miniAdminRequest from './miniAdminRequest'

export function miniAdminLogin(data) {
  return miniAdminRequest({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function miniAdminLogout() {
  return miniAdminRequest({
    url: '/auth/logout',
    method: 'post'
  })
}

export function getMiniAdminProfile() {
  return miniAdminRequest({
    url: '/auth/profile',
    method: 'get'
  })
}
