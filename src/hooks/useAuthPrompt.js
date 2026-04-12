import { useCallback, useState } from 'react'
import {
  createAuthPromptState,
  persistPendingAction,
} from '../features/auth/authFlow'
import { AUTH_PROVIDERS, signInWithOAuth } from '../services/auth'

export function useAuthPrompt({
  isAuthenticated,
  isEnglish,
  setLoadingAuth,
  setErrorMessage,
  captureError,
}) {
  const [authPrompt, setAuthPrompt] = useState(null)

  const openAuthPrompt = useCallback((reason, pendingAction = null) => {
    const authState = createAuthPromptState(false, reason, pendingAction)
    setAuthPrompt(authState.authPrompt)
  }, [])

  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt(null)
  }, [])

  const guardAuthAction = useCallback((reason, pendingAction = null) => {
    const authState = createAuthPromptState(isAuthenticated, reason, pendingAction)

    if (!authState.blocked) return false

    setAuthPrompt(authState.authPrompt)
    return true
  }, [isAuthenticated])

  const signInWithProvider = useCallback(async (provider, fallbackMessage) => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
      persistPendingAction(authPrompt?.pendingAction ?? null)
      await signInWithOAuth(provider)
    } catch (error) {
      captureError(error, fallbackMessage)
      setLoadingAuth(false)
    }
  }, [authPrompt, captureError, setErrorMessage, setLoadingAuth])

  const handleGoogleSignIn = useCallback(() => signInWithProvider(
    AUTH_PROVIDERS.GOOGLE,
    isEnglish ? 'Google sign-in failed.' : 'Google 로그인을 완료하지 못했어요.',
  ), [isEnglish, signInWithProvider])

  const handleKakaoSignIn = useCallback(() => signInWithProvider(
    AUTH_PROVIDERS.KAKAO,
    isEnglish ? 'Kakao sign-in failed.' : 'Kakao 로그인을 완료하지 못했어요.',
  ), [isEnglish, signInWithProvider])

  const handleNaverSignIn = useCallback(() => signInWithProvider(
    AUTH_PROVIDERS.NAVER,
    isEnglish ? 'Naver sign-in failed.' : '네이버 로그인을 완료하지 못했어요.',
  ), [isEnglish, signInWithProvider])

  return {
    authPrompt,
    setAuthPrompt,
    openAuthPrompt,
    closeAuthPrompt,
    guardAuthAction,
    handleGoogleSignIn,
    handleKakaoSignIn,
    handleNaverSignIn,
  }
}
