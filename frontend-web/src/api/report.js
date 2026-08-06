import request from './request'

/**
 * 获取工单报表
 */
export function getWorkOrderReport(params) {
  return request({
    url: '/reports/workorder',
    method: 'get',
    params
  })
}

/**
 * 获取成本报表
 */
export function getCostReport(params) {
  return request({
    url: '/reports/cost',
    method: 'get',
    params
  })
}

/**
 * 获取设备故障分析
 */
export function getDeviceReport(params) {
  return request({
    url: '/reports/device',
    method: 'get',
    params
  })
}

/**
 * 获取维修工绩效报表
 */
export function getEngineerReport(params) {
  return request({
    url: '/reports/engineer',
    method: 'get',
    params
  })
}

/**
 * 获取配件消耗统计
 */
export function getPartsReport(params) {
  return request({
    url: '/reports/parts',
    method: 'get',
    params
  })
}

/**
 * 导出报表
 */
export function exportReport(type, params) {
  return request({
    url: '/reports/export',
    method: 'get',
    params: { type, ...params },
    responseType: 'blob'
  })
}

/**
 * 自定义报表
 */
export function createCustomReport(data) {
  return request({
    url: '/reports/custom',
    method: 'post',
    data
  })
}

/**
 * 获取报表配置列表
 */
export function getReportConfigs() {
  return request({
    url: '/reports/configs',
    method: 'get'
  })
}
