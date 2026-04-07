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

export function buildAppHistoryState(view, currentState = {}) {
  return {
    ...currentState,
    appView: view || 'home',
  }
}

export function shouldPushHomeBackGuard(view, showOverlay, historyState = {}) {
  return view === 'home' && !showOverlay && historyState?.appHomeGuard !== true
}
