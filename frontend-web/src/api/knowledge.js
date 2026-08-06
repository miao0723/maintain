import request from './request'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 知识库专用聊天请求实例（更长的超时时间用于RAG+AI）
const kbChatRequest = axios.create({
  baseURL: '/api',
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' }
})

kbChatRequest.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

kbChatRequest.interceptors.response.use(
  response => {
    const res = response.data
    const code = typeof res.code === 'number' ? res.code : Number(res.code)
    if (code === 0 || (code >= 200 && code < 300)) {
      return res
    }
    const message = res.message || '请求失败'
    return Promise.reject({ message, response })
  },
  error => {
    if (error.response?.data) {
      // 处理 HTTP 错误响应
      const res = error.response.data
      const message = res.message || error.message || '请求失败'
      return Promise.reject({ message, response: error.response })
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ message: 'AI回复超时，请稍后重试' })
    }
    if (error.message) {
      return Promise.reject({ message: error.message })
    }
    return Promise.reject({ message: '网络错误' })
  }
)

// ==================== 知识库集合 ====================

export function getCollections(params) {
  return request({ url: '/kb/collections', method: 'get', params })
}

export function getCollection(id) {
  return request({ url: `/kb/collections/${id}`, method: 'get' })
}

export function createCollection(data) {
  return request({ url: '/kb/collections', method: 'post', data })
}

export function updateCollection(id, data) {
  return request({ url: `/kb/collections/${id}`, method: 'put', data })
}

export function deleteCollection(id) {
  return request({ url: `/kb/collections/${id}`, method: 'delete' })
}

// ==================== 知识库文件 ====================

export function getFiles(params) {
  return request({ url: '/kb/files', method: 'get', params })
}

export function getFile(id) {
  return request({ url: `/kb/files/${id}`, method: 'get' })
}

export function uploadKbFile(formData, onProgress) {
  return request({
    url: '/kb/files/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    }
  })
}

export function deleteFile(id) {
  return request({ url: `/kb/files/${id}`, method: 'delete' })
}

export function reprocessFile(id) {
  return request({ url: `/kb/files/${id}/reprocess`, method: 'post' })
}

/**
 * 获取文件内容（用于显示本地文件）
 * @param {number} fileId 文件ID
 * @returns {Promise}
 */
export function getFileContent(id) {
  return request({ url: `/kb/files/${id}/content`, method: 'get' })
}

/**
 * 获取文件下载URL（用于在线预览或下载）
 * @param {number} fileId 文件ID
 * @param {boolean} preview 是否预览模式
 * @returns {string} 文件URL
 */
export function getFileUrl(fileId, preview = false) {
  const store = useAuthStore()
  const baseUrl = '/api/kb/files/' + fileId + '/download'
  const params = new URLSearchParams()

  // 预览模式：在浏览器中展示内容
  // 下载模式：不设置preview参数，触发下载
  if (preview) {
    params.append('preview', '1')
  }

  // 添加token参数用于认证（兼容文件预览）
  if (store.token) {
    // 只使用token的值，不包含 "Bearer " 前缀
    const cleanToken = store.token.replace('Bearer ', '')
    params.append('token', cleanToken)
  }

  return baseUrl + '?' + params.toString()
}

// ==================== AI 聊天 ====================

export function getChatSessions(params) {
  return request({ url: '/kb/chat/sessions', method: 'get', params })
}

export function createChatSession(data) {
  return request({ url: '/kb/chat/sessions', method: 'post', data })
}

export function deleteChatSession(id) {
  return request({ url: `/kb/chat/sessions/${id}`, method: 'delete' })
}

export function getChatMessages(sessionId) {
  return request({ url: `/kb/chat/sessions/${sessionId}/messages`, method: 'get' })
}

export function sendChatMessage(sessionId, data) {
  return kbChatRequest({ url: `/kb/chat/sessions/${sessionId}/send`, method: 'post', data })
}
