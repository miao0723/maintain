import request from './request'

/**
 * 获取人员部门绑定列表
 */
export function getPersonnelDepartmentList(params) {
  return request({
    url: '/bindings/personnel-department',
    method: 'get',
    params
  })
}

/**
 * 绑定人员到部门
 */
export function bindPersonnelToDepartment(data) {
  return request({
    url: '/bindings/personnel-department',
    method: 'post',
    data
  })
}

/**
 * 解绑人员与部门
 */
export function unbindPersonnelFromDepartment(personnelId) {
  return request({
    url: `/bindings/personnel-department/${personnelId}`,
    method: 'delete'
  })
}

/**
 * 获取工程师用户绑定列表
 */
export function getEngineerUserList(params) {
  return request({
    url: '/bindings/engineer-user',
    method: 'get',
    params
  })
}

/**
 * 绑定工程师与用户
 */
export function bindEngineerToUser(data) {
  return request({
    url: '/bindings/engineer-user',
    method: 'post',
    data
  })
}

/**
 * 解绑工程师与用户
 */
export function unbindEngineerFromUser(engineerId) {
  return request({
    url: `/bindings/engineer-user/${engineerId}`,
    method: 'delete'
  })
}

/**
 * 获取用户角色绑定列表
 */
export function getUserRoleList(params) {
  return request({
    url: '/bindings/user-role',
    method: 'get',
    params
  })
}

/**
 * 绑定用户到角色
 */
export function bindUserToRole(data) {
  return request({
    url: '/bindings/user-role',
    method: 'post',
    data
  })
}

/**
 * 解绑用户与角色
 */
export function unbindUserFromRole(userId, roleId) {
  return request({
    url: `/bindings/user-role/${userId}/${roleId}`,
    method: 'delete'
  })
}

/**
 * 获取部门列表（用于下拉选择）
 */
export function getDepartmentList(params) {
  return request({
    url: '/departments',
    method: 'get',
    params
  })
}

/**
 * 获取人员列表（用于下拉选择）
 */
export function getPersonnelList(params) {
  return request({
    url: '/personnel',
    method: 'get',
    params
  })
}

/**
 * 获取工程师列表（用于下拉选择）
 */
export function getEngineerList(params) {
  return request({
    url: '/engineers',
    method: 'get',
    params
  })
}

/**
 * 获取用户列表（用于下拉选择）
 */
export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

/**
 * 获取角色列表（用于下拉选择）
 */
export function getRoleList(params) {
  return request({
    url: '/roles',
    method: 'get',
    params
  })
}
