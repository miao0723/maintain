import axios from 'axios'
import { ElMessage } from 'element-plus'

const miniAdminRequest = axios.create({
  baseURL: '/api/mini-admin',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

miniAdminRequest.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') || localStorage.getItem('mini_admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

miniAdminRequest.interceptors.response.use(
  response => {
    const res = response.data
    const codeRaw = res.code
    const code =
      typeof codeRaw === 'number'
        ? codeRaw
        : codeRaw !== null && codeRaw !== undefined && codeRaw !== ''
          ? Number(codeRaw)
          : null

    const isSuccessCode = code !== null && !Number.isNaN(code) && (code === 0 || (code >= 200 && code < 300))
    if (isSuccessCode) {
      return res
    }

    const message = res.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(new Error(message))
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('permissions')
      localStorage.removeItem('mini_admin_token')
      localStorage.removeItem('mini_admin_user')
      localStorage.removeItem('mini_admin_permissions')
      window.location.href = '/login'
    }

    ElMessage.error(error.response?.data?.message || error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default miniAdminRequest
