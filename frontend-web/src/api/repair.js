import request from './request'

/**
 * 获取机械分类列表
 */
export function getCategories(params) {
  return request({
    url: '/repair-categories',
    method: 'get',
    params
  })
}

/**
 * 获取机械分类详情
 */
export function getCategoryDetail(id) {
  return request({
    url: `/repair-categories/${id}`,
    method: 'get'
  })
}

/**
 * 创建机械分类
 */
export function createCategory(data) {
  return request({
    url: '/repair-categories',
    method: 'post',
    data
  })
}

/**
 * 更新机械分类
 */
export function updateCategory(id, data) {
  return request({
    url: `/repair-categories/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除机械分类
 */
export function deleteCategory(id) {
  return request({
    url: `/repair-categories/${id}`,
    method: 'delete'
  })
}

/**
 * 获取启用的机械分类列表
 */
export function getActiveCategories() {
  return request({
    url: '/repair-categories/active-list',
    method: 'get'
  })
}

/**
 * 获取机械列表
 */
export function getMachines(params) {
  return request({
    url: '/repair-machines',
    method: 'get',
    params
  })
}

/**
 * 获取机械详情
 */
export function getMachineDetail(id) {
  return request({
    url: `/repair-machines/${id}`,
    method: 'get'
  })
}

/**
 * 创建机械
 */
export function createMachine(data) {
  return request({
    url: '/repair-machines',
    method: 'post',
    data
  })
}

/**
 * 更新机械
 */
export function updateMachine(id, data) {
  return request({
    url: `/repair-machines/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除机械
 */
export function deleteMachine(id) {
  return request({
    url: `/repair-machines/${id}`,
    method: 'delete'
  })
}

/**
 * 获取分类下的机械列表
 */
export function getMachinesByCategory(categoryId, params) {
  return request({
    url: `/repair-machines/category/${categoryId}`,
    method: 'get',
    params
  })
}
