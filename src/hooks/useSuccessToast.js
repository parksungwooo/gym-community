import { useCallback, useEffect, useMemo, useState } from 'react'

const TOAST_TONE_CLASS = {
  default: 'border-emerald-100 bg-white text-gray-950 dark:border-emerald-400/20 dark:bg-neutral-900 dark:text-white',
  success: 'border-emerald-100 bg-white text-gray-950 dark:border-emerald-400/20 dark:bg-neutral-900 dark:text-white',
  info: 'border-sky-100 bg-white text-gray-950 dark:border-sky-400/20 dark:bg-neutral-900 dark:text-white',
  routine: 'border-emerald-100 bg-white text-gray-950 dark:border-emerald-400/20 dark:bg-neutral-900 dark:text-white',
  'danger-soft': 'border-rose-100 bg-white text-gray-950 dark:border-rose-400/20 dark:bg-neutral-900 dark:text-white',
}

const TOAST_DOT_CLASS = {
  default: 'bg-emerald-700',
  success: 'bg-emerald-700',
  info: 'bg-sky-700 dark:bg-sky-300',
  routine: 'bg-emerald-700',
  'danger-soft': 'bg-rose-600 dark:bg-rose-300',
}

export function useSuccessToast() {
  const [successState, setSuccessState] = useState(null)

  const showSuccess = useCallback((message, accent = 'default') => {
    setSuccessState({ message, accent })
  }, [])

  useEffect(() => {
    if (!successState) return undefined
    const timer = window.setTimeout(() => setSuccessState(null), 2600)
    return () => window.clearTimeout(timer)
  }, [successState])

  const toneKey = successState?.accent ?? 'default'
  const toastToneClass = useMemo(
    () => TOAST_TONE_CLASS[toneKey] ?? TOAST_TONE_CLASS.default,
    [toneKey],
  )
  const toastDotClass = useMemo(
    () => TOAST_DOT_CLASS[toneKey] ?? TOAST_DOT_CLASS.default,
    [toneKey],
  )

  return {
    successState,
    showSuccess,
    toastToneClass,
    toastDotClass,
  }
}
