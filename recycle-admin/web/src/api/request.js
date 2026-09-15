import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  // 子路径部署时由构建注入 VITE_API_BASE（如 /recycle-admin/api），默认同源 /api
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 20000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('recycle_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const resp = error.response
    if (resp) {
      if (resp.status === 401) {
        localStorage.removeItem('recycle_admin_token')
        localStorage.removeItem('recycle_admin_info')
        if (router.currentRoute.value.path !== '/login') {
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
        }
      } else {
        const data = resp.data
        if (data && data.needConfirm) {
          return Promise.reject({ needConfirm: true, message: data.message })
        }
        ElMessage.error((data && data.message) || `请求失败（${resp.status}）`)
      }
    } else {
      ElMessage.error('网络异常，请检查回收后台服务是否在线')
    }
    return Promise.reject(error)
  }
)

export default request
