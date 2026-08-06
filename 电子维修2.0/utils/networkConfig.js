const DEFAULT_BASE_URL = 'http://192.168.8.72:3001'

function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return ''
  return url.replace(/\/+$/, '')
}

function getDefaultBaseUrl() {
  return normalizeBaseUrl(DEFAULT_BASE_URL)
}

module.exports = {
  DEFAULT_BASE_URL,
  getDefaultBaseUrl,
  normalizeBaseUrl
}
