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
