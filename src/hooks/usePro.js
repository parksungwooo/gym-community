import { useCallback, useState } from 'react'
import {
  applyProActivationToProfile,
  buildProActivationResult,
} from '../features/pro/proStrategy'
import { activateUserPremium } from '../services/communityService'
import { getCheckoutPreparation, PREMIUM_CONTEXT } from '../utils/premium'

export function usePro({
  isPro,
  isAuthenticated,
  isEnglish,
  language,
  effectiveProfile,
  userId,
  setProfile,
  setLeaderboard,
  setFeedPosts,
  setLoadingAction,
  showSuccess,
  openAuthPrompt,
  captureError,
}) {
  const [paywallContext, setPaywallContext] = useState(null)

  const openPaywall = useCallback((context = PREMIUM_CONTEXT.GENERAL) => {
    setPaywallContext(context)
  }, [])

  const closePaywall = useCallback(() => {
    setPaywallContext(null)
  }, [])

  const handleUpgradePlan = useCallback(async (planId, provider = 'stripe') => {
    if (isPro) {
      showSuccess(
        isEnglish ? 'You are already on Pro.' : '이미 Pro 플랜을 사용 중이에요.',
        'info',
      )
      return {
        activated: true,
        alreadyPro: true,
        successCopy: {
          title: isEnglish ? 'Pro is already active.' : '이미 Pro가 활성화되어 있어요.',
          body: isEnglish ? 'AI plans, Pro rewards, and party perks are already on.' : 'AI 플랜, Pro 보상, 파티 혜택이 이미 켜져 있어요.',
          benefits: [],
        },
      }
    }

    if (!isAuthenticated) {
      closePaywall()
      openAuthPrompt('premium_upgrade')
      return { activated: false, requiresAuth: true }
    }

    const checkout = getCheckoutPreparation(planId, provider)
    const activationResult = buildProActivationResult({
      planId: checkout.planId,
      provider,
      language,
    })
    const immediateProfile = applyProActivationToProfile(effectiveProfile, activationResult.activation)

    setLoadingAction(true)
    setProfile(immediateProfile)
    setLeaderboard((items) => items.map((item) => (
      item.user_id === userId
        ? { ...item, ...activationResult.activation.profilePatch }
        : item
    )))
    setFeedPosts((items) => items.map((item) => (
      item.user_id === userId
        ? { ...item, ...activationResult.activation.profilePatch }
        : item
    )))
    showSuccess(activationResult.successCopy.toast, 'success')

    try {
      const savedProfile = await activateUserPremium(userId, activationResult.activation.profilePatch)

      if (savedProfile) {
        setProfile((current) => ({
          ...(current ?? immediateProfile),
          ...savedProfile,
          ...activationResult.activation.profilePatch,
        }))
      }
    } catch (error) {
      captureError(
        error,
        isEnglish
          ? 'Pro is active in this session. Server confirmation will retry when billing is connected.'
          : '현재 세션에서는 Pro가 켜졌어요. 결제 서버 저장은 연동 후 다시 확인됩니다.',
      )
    } finally {
      setLoadingAction(false)
    }

    return activationResult
  }, [
    captureError,
    closePaywall,
    effectiveProfile,
    isAuthenticated,
    isEnglish,
    isPro,
    language,
    openAuthPrompt,
    setFeedPosts,
    setLeaderboard,
    setLoadingAction,
    setProfile,
    showSuccess,
    userId,
  ])

  return {
    paywallContext,
    openPaywall,
    closePaywall,
    handleUpgradePlan,
  }
}
