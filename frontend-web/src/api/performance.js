import request from './request'

// ===== 绩效考核模块 API =====

/** 绩效总览看板 */
export function getPerformanceOverview(params) {
  return request({ url: '/performance/overview', method: 'get', params })
}

/** 按月趋势 */
export function getPerformanceTrend(params) {
  return request({ url: '/performance/trend', method: 'get', params })
}

/** 人员 / 班组 排名 */
export function getPerformanceRanking(params) {
  return request({ url: '/performance/ranking', method: 'get', params })
}

/** 工单列表（分页） */
export function getPerformanceWorkOrders(params) {
  return request({ url: '/performance/work-orders', method: 'get', params })
}

/** 工单详情 */
export function getPerformanceWorkOrderDetail(id) {
  return request({ url: `/performance/work-order/${id}/detail`, method: 'get' })
}

/** 维修人员列表 */
export function getPerformanceEngineers() {
  return request({ url: '/performance/engineers', method: 'get' })
}

/** 班组列表 */
export function getPerformanceTeams() {
  return request({ url: '/performance/teams', method: 'get' })
}

/** 评分规则列表 */
export function getScoreRules() {
  return request({ url: '/performance/score-rules', method: 'get' })
}

/** 更新评分规则 */
export function updateScoreRules(rules) {
  return request({ url: '/performance/score-rules', method: 'post', data: { rules } })
}

/** 重置评分规则 */
export function resetScoreRules() {
  return request({ url: '/performance/score-rules/reset', method: 'post' })
}

/** 生成绩效快照 */
export function generateSnapshot(data) {
  return request({ url: '/performance/snapshot/generate', method: 'post', data })
}

/** 快照列表 */
export function getSnapshots(params) {
  return request({ url: '/performance/snapshots', method: 'get', params })
}

/** 读取绩效配置（达标分数线 / 最低样本量） */
export function getPerfConfig() {
  return request({ url: '/performance/config', method: 'get' })
}

/** 保存绩效配置 */
export function savePerfConfig(data) {
  return request({ url: '/performance/config', method: 'post', data })
}

// ===== 工人端：自建工单 / 交付 / 判定 =====

/** 当前用户绩效上下文（是否工人视角） */
export function getPerformanceContext() {
  return request({ url: '/performance/context', method: 'get' })
}

/** 设备列表（工人建单选设备） */
export function getPerformanceDevices(params) {
  return request({ url: '/performance/devices', method: 'get', params })
}

/** 新建设备（设备台账） */
export function createDevice(data) {
  return request({ url: '/performance/devices', method: 'post', data })
}

/** 更新设备 */
export function updateDevice(id, data) {
  return request({ url: `/performance/devices/${id}`, method: 'put', data })
}

/** 删除设备 */
export function deleteDevice(id) {
  return request({ url: `/performance/devices/${id}`, method: 'delete' })
}

/** 维修工期合理性评估 */
export function estimateRepair(params) {
  return request({ url: '/performance/estimate', method: 'get', params })
}

/** 工人自建工单 */
export function createSelfWorkOrder(data) {
  return request({ url: '/performance/work-orders/self', method: 'post', data })
}

/** 我的工单（分页） */
export function getMyWorkOrders(params) {
  return request({ url: '/performance/my-work-orders', method: 'get', params })
}

/** 更新我的工单（维修中可改） */
export function updateSelfWorkOrder(id, data) {
  return request({ url: `/performance/work-orders/self/${id}`, method: 'put', data })
}

/** 删除我的工单（未完结可删） */
export function deleteSelfWorkOrder(id) {
  return request({ url: `/performance/work-orders/self/${id}`, method: 'delete' })
}

/** 交付工单 */
export function deliverWorkOrder(id, data) {
  return request({ url: `/performance/work-order/${id}/deliver`, method: 'post', data })
}

/** 管理员/老板验收评分（工人不可自验） */
export function reviewWorkOrder(id, data) {
  return request({ url: `/performance/work-order/${id}/review`, method: 'post', data })
}
