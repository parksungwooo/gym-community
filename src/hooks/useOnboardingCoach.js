import { useCallback, useEffect, useState } from 'react'
import { ONBOARDING_STORAGE_KEY } from '../components/OnboardingCoach'

export function useOnboardingCoach({ loadingInit }) {
  const [showOnboardingCoach, setShowOnboardingCoach] = useState(false)

  const closeOnboardingCoach = useCallback(() => {
    setShowOnboardingCoach(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    }
  }, [])

  useEffect(() => {
    if (loadingInit || typeof window === 'undefined') return undefined
    if (window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1') return undefined

    const timer = window.setTimeout(() => setShowOnboardingCoach(true), 450)
    return () => window.clearTimeout(timer)
  }, [loadingInit])

  return {
    showOnboardingCoach,
    closeOnboardingCoach,
  }
}
