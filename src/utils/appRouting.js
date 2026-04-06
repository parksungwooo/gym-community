export function getHashForView(view) {
  return `#/${view || 'home'}`
}

export function parseViewFromHash(hash, fallbackView = 'home', knownViews = []) {
  const normalized = typeof hash === 'string' ? hash.replace(/^#\/?/, '').trim() : ''

  if (!normalized) {
    return fallbackView
  }

  return knownViews.includes(normalized) ? normalized : fallbackView
}
