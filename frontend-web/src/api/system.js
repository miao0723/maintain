import request from './request'

/**
 * 获取用户列表
 */
export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

/**
 * 创建用户
 */
export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 */
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除用户
 */
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

/**
 * 获取部门列表
 */
export function getDepartmentList(params) {
  return request({
    url: '/departments',
    method: 'get',
    params
  })
}

/**
 * 创建部门
 */
export function createDepartment(data) {
  return request({
    url: '/departments',
    method: 'post',
    data
  })
}

/**
 * 更新部门
 */
export function updateDepartment(id, data) {
  return request({
    url: `/departments/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除部门
 */
export function deleteDepartment(id) {
  return request({
    url: `/departments/${id}`,
    method: 'delete'
  })
}

/**
 * 获取系统设置
 */
export function getSettings() {
  return request({
    url: '/settings',
    method: 'get'
  })
}

/**
 * 更新系统设置
 */
export function updateSettings(data) {
  return request({
    url: '/settings',
    method: 'put',
    data
  })
}

/**
 * 文件上传
 */
export function uploadFile(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    }
  })
}
