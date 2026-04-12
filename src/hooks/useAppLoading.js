import { useCallback, useState } from 'react'

export function useAppLoading({ isEnglish, captureError, setErrorMessage }) {
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingMatePosts, setLoadingMatePosts] = useState(false)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [initStatus, setInitStatus] = useState(
    isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...',
  )

  const runActionTask = useCallback(async (
    task,
    fallbackMessage,
    options = {},
  ) => {
    const {
      useLoadingState = true,
      defaultValue = null,
    } = options

    if (useLoadingState) {
      setLoadingAction(true)
    }

    setErrorMessage('')

    try {
      return await task()
    } catch (error) {
      captureError(error, fallbackMessage)
      return defaultValue
    } finally {
      if (useLoadingState) {
        setLoadingAction(false)
      }
    }
  }, [captureError, setErrorMessage])

  return {
    loadingInit,
    setLoadingInit,
    loadingAction,
    setLoadingAction,
    loadingFeed,
    setLoadingFeed,
    loadingMatePosts,
    setLoadingMatePosts,
    loadingLeaderboard,
    setLoadingLeaderboard,
    loadingAuth,
    setLoadingAuth,
    initStatus,
    setInitStatus,
    runActionTask,
  }
}
