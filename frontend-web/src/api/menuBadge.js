import request from './request'

/**
 * 获取侧边栏菜单徽标（各导航模块的新内容/待办数量）
 * 工人：维修作业-我的工单（即将超时/已超时）
 * 管理员/老板：绩效考核-工单明细（全员工单超时汇总）
 */
export function getMenuBadges() {
  return request({
    url: '/notifications/menu-badges',
    method: 'get'
  })
}
