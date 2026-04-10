import { useCallback, useEffect, useMemo, useState } from 'react'
import { getActionableErrorMessage, isTransientInitDelayMessage } from '../features/app/appFlowUtils'

export function useAppError(isEnglish) {
  const [errorMessage, setErrorMessage] = useState('')

  const clearErrorMessage = useCallback(() => {
    setErrorMessage('')
  }, [])

  const captureError = useCallback((error, fallbackMessage) => {
    setErrorMessage(getActionableErrorMessage(error, fallbackMessage, isEnglish))
  }, [isEnglish])

  useEffect(() => {
    if (!errorMessage || !isTransientInitDelayMessage(errorMessage)) return undefined
    const timer = setTimeout(() => setErrorMessage(''), 1400)
    return () => clearTimeout(timer)
  }, [errorMessage])

  const visibleErrorMessage = isTransientInitDelayMessage(errorMessage) ? '' : errorMessage

  const errorState = useMemo(() => {
    if (!visibleErrorMessage) return null

    const normalized = visibleErrorMessage.toLowerCase()

    if (normalized.includes('supabase') || normalized.includes('sql') || normalized.includes('rls')) {
      return {
        label: isEnglish ? 'Setup' : '설정',
        title: isEnglish ? 'Supabase needs one more check.' : 'Supabase 설정을 한 번 더 확인해주세요.',
      }
    }

    if (normalized.includes('network') || visibleErrorMessage.includes('네트워크')) {
      return {
        label: isEnglish ? 'Network' : '네트워크',
        title: isEnglish ? 'Connection looks unstable.' : '연결 상태를 먼저 확인해주세요.',
      }
    }

    if (
      normalized.includes('sign')
      || normalized.includes('auth')
      || visibleErrorMessage.includes('로그')
      || visibleErrorMessage.includes('인증')
    ) {
      return {
        label: isEnglish ? 'Account' : '계정',
        title: isEnglish ? 'The account flow needs another try.' : '계정 작업을 한 번 더 시도해주세요.',
      }
    }

    return {
      label: isEnglish ? 'Notice' : '안내',
      title: isEnglish ? 'This view needs a quick check.' : '현재 화면을 확인해주세요.',
    }
  }, [isEnglish, visibleErrorMessage])

  return {
    errorMessage,
    visibleErrorMessage,
    errorState,
    setErrorMessage,
    clearErrorMessage,
    captureError,
  }
}
