import { useCallback, useEffect, useState } from 'react'
import { buildCommunityAccessResult } from '../features/community/communityFlow'
import {
  buildAppHistoryState,
  getHashForView,
  parseViewFromHash,
  shouldPushHomeBackGuard,
} from '../utils/appRouting'

export const VIEW = {
  HOME: 'home',
  COMMUNITY: 'community',
  PROGRESS: 'progress',
  PROFILE: 'profile',
}

export function useAppNavigation({
  hasCommunityNickname,
  isEnglish,
  showSuccess,
  showWorkoutPanel,
}) {
  const [view, setView] = useState(() => (
    typeof window === 'undefined'
      ? VIEW.HOME
      : parseViewFromHash(window.location.hash, VIEW.HOME, Object.values(VIEW))
  ))
  const [historyTick, setHistoryTick] = useState(0)

  const navigateToView = useCallback((nextView, options = {}) => {
    setView(nextView)

    if (typeof window !== 'undefined') {
      const nextHash = getHashForView(nextView)
      if (window.location.hash !== nextHash) {
        if (options.replace) {
          window.history.replaceState(null, '', nextHash)
        } else {
          window.location.hash = nextHash
        }
      }
    }
  }, [])

  const handleChangeView = useCallback((nextView) => {
    const access = buildCommunityAccessResult(nextView, hasCommunityNickname, VIEW.COMMUNITY)

    if (!access.allowed) {
      navigateToView(VIEW.PROFILE)
      showSuccess(
        isEnglish
          ? 'Save nickname first.'
          : '닉네임을 먼저 저장해 주세요.',
        'info',
      )
      return
    }

    navigateToView(access.redirectView)
  }, [hasCommunityNickname, isEnglish, navigateToView, showSuccess])
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncViewFromHistory = () => {
      setView(parseViewFromHash(window.location.hash, VIEW.HOME, Object.values(VIEW)))
      setHistoryTick((current) => current + 1)
    }

    window.addEventListener('hashchange', syncViewFromHistory)
    window.addEventListener('popstate', syncViewFromHistory)
    return () => {
      window.removeEventListener('hashchange', syncViewFromHistory)
      window.removeEventListener('popstate', syncViewFromHistory)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentHash = window.location.hash || getHashForView(view)
    const normalizedState = buildAppHistoryState(view, window.history.state ?? {})

    if (window.history.state?.appView !== view) {
      window.history.replaceState(normalizedState, '', currentHash)
    }

    if (shouldPushHomeBackGuard(view, showWorkoutPanel, normalizedState)) {
      window.history.pushState(
        { ...normalizedState, appHomeGuard: true },
        '',
        currentHash,
      )
    }
  }, [historyTick, showWorkoutPanel, view])

  return {
    view,
    navigateToView,
    handleChangeView,
  }
}
