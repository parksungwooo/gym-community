import { useCallback, useEffect, useState } from 'react'

export function useCelebration() {
  const [celebration, setCelebration] = useState(null)

  const clearCelebration = useCallback(() => {
    setCelebration(null)
  }, [])

  useEffect(() => {
    if (!celebration) return undefined
    const timer = window.setTimeout(() => setCelebration(null), 4200)
    return () => window.clearTimeout(timer)
  }, [celebration])

  return {
    celebration,
    setCelebration,
    clearCelebration,
  }
}
