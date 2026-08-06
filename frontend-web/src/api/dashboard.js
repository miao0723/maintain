import request from './request'

/**
 * 获取首页看板聚合数据
 */
export function getDashboardStatistics() {
  return request({
    url: '/statistics/dashboard',
    method: 'get'
  })
}
