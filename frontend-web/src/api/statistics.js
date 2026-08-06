import request from './request'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 创建专用于 AI 调用的请求实例，使用更长超时时间
const aiRequest = axios.create({
  baseURL: '/api',
  timeout: 120000, // 120 秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 添加 token 拦截器
aiRequest.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  }
)

// 添加响应拦截器
aiRequest.interceptors.response.use(
  response => response.data,
  error => {
    console.error('AI 请求错误:', error)
    return Promise.reject(error)
  }
)

export function getDashboardStatistics() {
  return request({ url: '/statistics/dashboard', method: 'get' })
}

export function getIncomeStatistics(params) {
  return request({ url: '/statistics/income', method: 'get', params })
}

export function getExpenseStatistics(params) {
  return request({ url: '/statistics/expense', method: 'get', params })
}

export function getOrderStatistics(params) {
  return request({ url: '/statistics/orders', method: 'get', params })
}

export function getTimeoutStatistics(params) {
  return request({ url: '/statistics/timeout', method: 'get', params })
}

// 使用专用 AI 请求实例
export function generateTimeoutSummary(params) {
  return aiRequest({ url: '/statistics/timeout/summary', method: 'post', params })
}

export function sendTimeoutEmail(data) {
  return request({ url: '/statistics/timeout/send-email', method: 'post', data })
}

export function generateIncomeSummary(params) {
  return aiRequest({ url: '/statistics/income/summary', method: 'post', params })
}

export function generateExpenseSummary(params) {
  return aiRequest({ url: '/statistics/expense/summary', method: 'post', params })
}

export function generateOrderSummary(params) {
  return aiRequest({ url: '/statistics/orders/summary', method: 'post', params })
}
