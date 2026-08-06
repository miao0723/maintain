export const getMediaUrl = (url) => {
  if (!url) return ''

  const normalized = String(url).trim()
  if (!normalized) return ''

  if (/^(https?:)?\/\//i.test(normalized)) {
    return normalized
  }

  let relative = normalized.startsWith('/') ? normalized : `/${normalized}`
  if (relative.startsWith('/uploads/')) {
    relative = relative.replace('/uploads/', '/miniprogram-uploads/')
  }
  const apiOrigin = `${window.location.protocol}//${window.location.host}`
  return `${apiOrigin}${relative}`
}
