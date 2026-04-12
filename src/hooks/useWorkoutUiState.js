import { useCallback, useEffect, useState } from 'react'

export function useWorkoutUiState({ profile, workoutStats }) {
  const [showTestForm, setShowTestForm] = useState(false)
  const [showTestResult, setShowTestResult] = useState(false)
  const [showWorkoutPanel, setShowWorkoutPanel] = useState(false)
  const [workoutPreset, setWorkoutPreset] = useState(null)

  const openWorkoutComposer = useCallback((preset = null) => {
    const nextPreset = preset
      ? {
          name: preset.name || '',
          workoutType: preset.workout_type || preset.workoutType || workoutStats.lastWorkoutType || '휴식',
          durationMinutes: preset.duration_minutes || preset.durationMinutes || workoutStats.lastWorkoutDuration || 30,
          note: preset.note || '',
          defaultShareToFeed: profile?.default_share_to_feed !== false,
        }
      : {
          name: '',
          workoutType: workoutStats.lastWorkoutType || '휴식',
          durationMinutes: workoutStats.lastWorkoutDuration || 30,
          note: '',
          defaultShareToFeed: profile?.default_share_to_feed !== false,
        }

    setWorkoutPreset(nextPreset)
    setShowWorkoutPanel(true)

    if (typeof window !== 'undefined' && window.history.state?.workoutSheet !== true) {
      window.history.pushState(
        { ...(window.history.state ?? {}), workoutSheet: true },
        '',
        window.location.href,
      )
    }
  }, [profile?.default_share_to_feed, workoutStats.lastWorkoutDuration, workoutStats.lastWorkoutType])

  const closeWorkoutComposer = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.workoutSheet === true) {
      window.history.back()
      return
    }

    setShowWorkoutPanel(false)
    setWorkoutPreset(null)
  }, [])

  const dismissWorkoutComposer = useCallback(() => {
    setShowWorkoutPanel(false)
    setWorkoutPreset(null)
  }, [])

  const openTestFlow = useCallback(() => {
    setShowTestResult(false)
    setShowTestForm(true)
  }, [])

  const closeTestFlow = useCallback(() => {
    setShowTestForm(false)
    setShowTestResult(false)
  }, [])

  const showTestResultOnly = useCallback(() => {
    setShowTestForm(false)
    setShowTestResult(true)
  }, [])

  return {
    showTestForm,
    setShowTestForm,
    showTestResult,
    setShowTestResult,
    showWorkoutPanel,
    workoutPreset,
    setWorkoutPreset,
    openWorkoutComposer,
    closeWorkoutComposer,
    dismissWorkoutComposer,
    openTestFlow,
    closeTestFlow,
    showTestResultOnly,
  }
}

export function useWorkoutRouteSync({
  view,
  homeView,
  progressView,
  showWorkoutPanel,
  showTestForm,
  showTestResult,
  dismissWorkoutComposer,
  closeTestFlow,
}) {
  useEffect(() => {
    if (view === homeView || !showWorkoutPanel) return

    dismissWorkoutComposer()
  }, [dismissWorkoutComposer, homeView, showWorkoutPanel, view])

  useEffect(() => {
    if (view === progressView || (!showTestForm && !showTestResult)) return

    closeTestFlow()
  }, [closeTestFlow, progressView, showTestForm, showTestResult, view])
}
