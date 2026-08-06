import request from './request'

/**
 * 获取维修人员列表
 */
export function getEngineerList(params) {
  return request({
    url: '/engineers',
    method: 'get',
    params
  })
}

/**
 * 获取维修人员详情
 */
export function getEngineerDetail(id) {
  return request({
    url: `/engineers/${id}`,
    method: 'get'
  })
}

/**
 * 创建维修人员
 */
export function createEngineer(data) {
  return request({
    url: '/engineers',
    method: 'post',
    data
  })
}

/**
 * 更新维修人员
 */
export function updateEngineer(id, data) {
  return request({
    url: `/engineers/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除维修人员
 */
export function deleteEngineer(id) {
  return request({
    url: `/engineers/${id}`,
    method: 'delete'
  })
}

/**
 * 获取维修人员绩效统计
 */
export function getEngineerPerformance(id, params) {
  return request({
    url: `/engineers/${id}/performance`,
    method: 'get',
    params
  })
}

/**
 * 获取排班列表
 */
export function getScheduleList(params) {
  return request({
    url: '/schedules',
    method: 'get',
    params
  })
}

/**
 * 创建排班
 */
export function createSchedule(data) {
  return request({
    url: '/schedules',
    method: 'post',
    data
  })
}

/**
 * 获取可用工程师（智能推荐）
 */
export function getAvailableEngineers(params) {
  return request({
    url: '/engineers/available',
    method: 'get',
    params
  })
}
