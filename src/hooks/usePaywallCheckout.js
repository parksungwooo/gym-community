import { useCallback, useMemo, useState } from 'react'
import {
  PREMIUM_PLANS,
  getCheckoutPreparation,
} from '../utils/premium'

export function usePaywallCheckout({
  loading,
}) {
  const [provider, setProvider] = useState('stripe')
  const [selectedPlanId, setSelectedPlanId] = useState('annual')
  const [checkoutStep, setCheckoutStep] = useState('details')
  const [activationResult, setActivationResult] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')

  const selectedPlan = useMemo(
    () => PREMIUM_PLANS.find((plan) => plan.id === selectedPlanId) ?? PREMIUM_PLANS[0],
    [selectedPlanId],
  )
  const checkout = useMemo(
    () => getCheckoutPreparation(selectedPlan.id, provider),
    [provider, selectedPlan.id],
  )
  const busy = loading || checkoutStep === 'activating'

  const resetCheckout = useCallback(() => {
    setCheckoutStep('details')
    setActivationResult(null)
    setCheckoutError('')
  }, [])

  const startCheckout = useCallback(() => {
    setCheckoutError('')
    setCheckoutStep('confirm')
  }, [])

  const backToDetails = useCallback(() => {
    setCheckoutError('')
    setCheckoutStep('details')
  }, [])

  return {
    activationResult,
    backToDetails,
    busy,
    checkout,
    checkoutError,
    checkoutStep,
    provider,
    resetCheckout,
    selectedPlan,
    setActivationResult,
    setCheckoutError,
    setCheckoutStep,
    setProvider,
    setSelectedPlanId,
    startCheckout,
  }
}
