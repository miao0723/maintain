import request from './request'

/**
 * 获取配件列表
 */
export function getPartsList(params) {
  return request({
    url: '/parts',
    method: 'get',
    params
  })
}

/**
 * 获取配件详情
 */
export function getPartsDetail(id) {
  return request({
    url: `/parts/${id}`,
    method: 'get'
  })
}

/**
 * 创建配件
 */
export function createParts(data) {
  return request({
    url: '/parts',
    method: 'post',
    data
  })
}

/**
 * 更新配件
 */
export function updateParts(id, data) {
  return request({
    url: `/parts/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除配件
 */
export function deleteParts(id) {
  return request({
    url: `/parts/${id}`,
    method: 'delete'
  })
}

/**
 * 获取库存预警列表
 */
export function getStockAlerts() {
  return request({
    url: '/parts/alerts',
    method: 'get'
  })
}

/**
 * 配件入库
 */
export function partsInbound(id, data) {
  return request({
    url: `/parts/${id}/in`,
    method: 'post',
    data
  })
}

/**
 * 配件出库
 */
export function partsOutbound(id, data) {
  return request({
    url: `/parts/${id}/out`,
    method: 'post',
    data
  })
}

/**
 * 获取出入库记录
 */
export function getStockRecords(params) {
  return request({
    url: '/parts/records',
    method: 'get',
    params
  })
}

/**
 * 获取供应商列表
 */
export function getSuppliers(params) {
  return request({
    url: '/suppliers',
    method: 'get',
    params
  })
}

/**
 * 获取供应商详情
 */
export function getSupplierDetail(id) {
  return request({
    url: `/suppliers/${id}`,
    method: 'get'
  })
}

/**
 * 创建供应商
 */
export function createSupplier(data) {
  return request({
    url: '/suppliers',
    method: 'post',
    data
  })
}

/**
 * 更新供应商
 */
export function updateSupplier(id, data) {
  return request({
    url: `/suppliers/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除供应商
 */
export function deleteSupplier(id) {
  return request({
    url: `/suppliers/${id}`,
    method: 'delete'
  })
}

/**
 * 获取供应商的配件列表
 */
export function getSupplierParts(id, params) {
  return request({
    url: `/suppliers/${id}/parts`,
    method: 'get',
    params
  })
}

/**
 * 获取供应商统计
 */
export function getSupplierStatistics(params) {
  return request({
    url: '/suppliers/statistics',
    method: 'get',
    params
  })
}

/**
 * 导出配件库存
 */
export function exportParts(params) {
  return request({
    url: '/parts/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
