const inflightRequests = {}

function now() {
  return Date.now()
}

function readStorage(key, fallback = null) {
  try {
    const value = wx.getStorageSync(key)
    return value === '' || value === undefined ? fallback : value
  } catch (error) {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (error) {}
}

function getCache(key, fallback = null) {
  const payload = readStorage(key, null)
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return {
      data: fallback,
      updatedAt: 0,
      hasCache: false
    }
  }

  return {
    data: payload.data,
    updatedAt: Number(payload.updatedAt) || 0,
    hasCache: true
  }
}

function setCache(key, data) {
  const payload = {
    data,
    updatedAt: now()
  }
  writeStorage(key, payload)
  return payload
}

function isCacheFresh(key, ttl) {
  if (!ttl) return false
  const cache = getCache(key)
  return cache.hasCache && (now() - cache.updatedAt) < ttl
}

function dedupRequest(key, fetcher) {
  if (inflightRequests[key]) {
    return inflightRequests[key]
  }

  const request = Promise.resolve()
    .then(fetcher)
    .finally(() => {
      delete inflightRequests[key]
    })

  inflightRequests[key] = request
  return request
}

function fetchWithCache(options) {
  const {
    storageKey,
    requestKey = storageKey,
    ttl = 0,
    force = false,
    fallback = null,
    fetcher
  } = options

  const cache = getCache(storageKey, fallback)
  const fresh = !force && ttl > 0 && cache.hasCache && (now() - cache.updatedAt) < ttl

  if (fresh) {
    return Promise.resolve({
      data: cache.data,
      updatedAt: cache.updatedAt,
      fromCache: true
    })
  }

  return dedupRequest(requestKey, () => Promise.resolve(fetcher()).then(data => {
    setCache(storageKey, data)
    return {
      data,
      updatedAt: now(),
      fromCache: false
    }
  }))
}

const CACHE_KEYS = {
  userProfile: 'mine:userProfile',
  orderSummary: 'mine:orderSummary',
  addressCount: 'mine:addressCount',
  unitCount: 'mine:unitCount',
  deviceCount: 'mine:deviceCount',
  quotedCount: 'mine:quotedCount',
  progressUnreadCount: 'mine:progressUnreadCount'
}

const CACHE_TTL = {
  userProfile: 5 * 60 * 1000,
  orderSummary: 60 * 1000,
  menuCount: 90 * 1000,
  badge: 30 * 1000
}

module.exports = {
  CACHE_KEYS,
  CACHE_TTL,
  getCache,
  setCache,
  isCacheFresh,
  dedupRequest,
  fetchWithCache
}
