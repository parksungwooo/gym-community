import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAppSession({
  initializeApp,
  initInProgressRef,
  loadPublicData,
  loadUserData,
  navigateToView,
  homeView,
  setLoadingAuth,
  setLoadingInit,
  captureError,
  isEnglish,
}) {
  useEffect(() => {
    initializeApp()

    const failSafe = window.setTimeout(() => {
      setLoadingInit(false)
    }, 12000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || initInProgressRef.current) return

      setLoadingAuth(true)
      try {
        if (session?.user?.id) {
          await loadUserData(session.user)
        } else {
          await loadPublicData()
          navigateToView(homeView, { replace: true })
        }
      } catch (error) {
        captureError(error, isEnglish ? 'Failed to sync auth state.' : '로그인 상태를 확인하지 못했어요.')
      } finally {
        setLoadingAuth(false)
      }
    })

    return () => {
      window.clearTimeout(failSafe)
      subscription.unsubscribe()
    }
  }, [
    captureError,
    homeView,
    initInProgressRef,
    initializeApp,
    isEnglish,
    loadPublicData,
    loadUserData,
    navigateToView,
    setLoadingAuth,
    setLoadingInit,
  ])
}
