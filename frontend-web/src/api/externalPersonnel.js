import request from './request'

/**
 * 外部系统人员（同步）相关接口 —— 仅老板/管理员可访问
 */

// 触发同步（可带 keyword 按姓名检索后同步子集）
export function syncPersonnel(data) {
  return request({ url: '/external-personnel/sync', method: 'post', data })
}

// 分页列表（默认脱敏）
export function getExternalPersonnel(params) {
  return request({ url: '/external-personnel', method: 'get', params })
}

// 按姓名检索（本地已同步数据）
export function searchExternalPersonnel(params) {
  return request({ url: '/external-personnel/search', method: 'get', params })
}

// 详情
export function getExternalPersonnelDetail(id) {
  return request({ url: `/external-personnel/${id}`, method: 'get' })
}

// 同步日志
export function getSyncLogs(params) {
  return request({ url: '/external-personnel/sync-logs', method: 'get', params })
}
