import request from './request'

export function sendAgentMessage(data, config = {}) {
  return request({
    url: '/agent/chat',
    method: 'post',
    data,
    timeout: 180000,
    ...config
  })
}
