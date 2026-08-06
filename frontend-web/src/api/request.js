import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
    baseURL: '/api',
    timeout: 120000, // AI 调用可能需要较长时间，设置为 120 秒
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        const authStore = useAuthStore()
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }
        // 调试日志
        if (config.url && (config.url.includes('kb/chat') || config.url.includes('parts'))) {
          console.log('API请求 - URL:', config.url)
          console.log('API请求 - Method:', config.method)
          console.log('API请求 - Data:', config.data)
          console.log('API请求 - Headers:', config.headers)
        }
        return config
    },
    error => {
        console.error('请求错误', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        // 对于 blob 类型响应，检查是否是错误响应
        if (response.config.responseType === 'blob') {
            // 检查 Content-Type，如果是 JSON 则说明是错误响应
            const contentType = response.headers?.['content-type'] || ''
            if (contentType.includes('application/json') || contentType.includes('text/html')) {
                // 将 blob 转为 JSON 处理
                return response.data.text().then(text => {
                    try {
                        const json = JSON.parse(text)
                        ElMessage.error(json.message || '请求失败')
                        return Promise.reject(new Error(json.message || '请求失败'))
                    } catch (e) {
                        // 如果无法解析为 JSON，说明可能是正常的文件下载
                        return response
                    }
                })
            }
            return response
        }

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

        // 处理业务错误
        let businessMessage = res.message || '请求失败'
        if (typeof businessMessage === 'string' && businessMessage.includes('Coze 当前触发限流')) {
            businessMessage = 'Coze 当前触发限流，请 1-3 分钟后重试。'
        }
        ElMessage.error(businessMessage)
        return Promise.reject(new Error(businessMessage))
    },
    error => {
        console.error('响应错误', error)

        // 处理 HTTP 错误状态码
        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 401:
                    ElMessage.error('登录已过期，请重新登录')
                    const authStore = useAuthStore()
                    authStore.logout()
                    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
                    break
                case 403:
                    ElMessage.error('没有权限访问')
                    break
                case 404:
                    ElMessage.error('请求的资源不存在')
                    break
                case 500:
                    ElMessage.error('服务器错误')
                    break
                default:
                    ElMessage.error(data.message || '请求失败')
            }
        } else if (error.code === 'ECONNABORTED') {
            ElMessage.error('请求超时，AI 分析可能需要更长时间，请稍后重试')
        } else {
            ElMessage.error('网络错误')
        }

        return Promise.reject(error)
    }
)

export default request
