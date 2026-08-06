import request from './request'

/**
 * 获取系统日志列表
 */
export function getSystemLogList(params) {
  return request({
    url: '/system-logs',
    method: 'get',
    params
  })
}

/**
 * 获取系统日志详情
 */
export function getSystemLogDetail(id) {
  return request({
    url: `/system-logs/${id}`,
    method: 'get'
  })
}

/**
 * 清空系统日志
 */
export function clearSystemLogs(data) {
  return request({
    url: '/system-logs/clear',
    method: 'post',
    data
  })
}

/**
 * 导出系统日志
 */
export function exportSystemLogs(params) {
  return request({
    url: '/system-logs/export',
    method: 'get',
    params
  })
}
