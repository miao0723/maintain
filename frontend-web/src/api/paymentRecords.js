import request from './request'

/**
 * 获取小程序交易（收入流水）列表 - repair 库 transaction_income
 */
export function getTransactionList(params) {
  return request({
    url: '/payment/transactions',
    method: 'get',
    params
  })
}

/**
 * 获取交易统计
 */
export function getTransactionStatistics() {
  return request({
    url: '/payment/transactions/statistics',
    method: 'get'
  })
}

/**
 * 获取退款列表 - repair 库 orders 退款字段
 */
export function getRefundList(params) {
  return request({
    url: '/payment/refunds',
    method: 'get',
    params
  })
}

/**
 * 退款审核（approve=同意退款 / reject=拒绝退款）
 */
export function reviewRefund(id, data) {
  return request({
    url: `/payment/refunds/${id}`,
    method: 'put',
    data
  })
}

/**
 * 读取支付配置（repair 库 system_config）
 */
export function getPaymentConfig() {
  return request({
    url: '/payment/config',
    method: 'get'
  })
}

/**
 * 保存支付配置
 */
export function savePaymentConfig(values) {
  return request({
    url: '/payment/config',
    method: 'put',
    data: { values }
  })
}

/**
 * 费用单列表（检测费等）
 */
export function getServiceFeeList(params) {
  return request({
    url: '/repair/service-fees',
    method: 'get',
    params
  })
}

/**
 * 创建费用单（检测费）
 */
export function createServiceFee(data) {
  return request({
    url: '/repair/service-fees',
    method: 'post',
    data
  })
}

/**
 * 收款 / 减免费用单
 */
export function payServiceFee(id, data) {
  return request({
    url: `/repair/service-fees/${id}/pay`,
    method: 'put',
    data
  })
}

/**
 * 删除费用单
 */
export function deleteServiceFee(id) {
  return request({
    url: `/repair/service-fees/${id}`,
    method: 'delete'
  })
}
