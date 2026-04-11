import { useEffect } from 'react'
import HomeDashboard from '../components/HomeDashboard'
import WorkoutPanel from '../components/WorkoutPanel'

export default function HomeRoute({
  celebration,
  isEnglish,
  profile,
  todayDone,
  currentLevel,
  stats,
  challenge,
  activitySummary,
  homeInsight,
  achievementBadges,
  reminder,
  reminderPermission,
  feedPreview,
  routineTemplates,
  workoutHistory,
  workoutLoading,
  isPro,
  onOpenWorkoutComposer,
  onCompleteRecommendedWorkout,
  onOpenPaywall,
  onStartRoutine,
  onOpenTest,
  onSeeCommunity,
  onSelectFeedPreviewUser,
  onRequestReminderPermission,
  showWorkoutPanel,
  workoutPreset,
  onCompleteWorkout,
  onSaveRoutine,
  onDeleteRoutine,
  onCloseWorkoutComposer,
}) {
  useEffect(() => {
    if (!showWorkoutPanel || typeof document === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onCloseWorkoutComposer?.()
      }
    }

    const handlePopState = () => {
      onCloseWorkoutComposer?.()
    }

    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onCloseWorkoutComposer, showWorkoutPanel])

  return (
    <div className="grid gap-6">
      <HomeDashboard
        profile={profile}
        todayDone={todayDone}
        currentLevel={currentLevel}
        stats={stats}
        challenge={challenge}
        activitySummary={activitySummary}
        homeInsight={homeInsight}
        achievementBadges={achievementBadges}
        reminder={reminder}
        reminderPermission={reminderPermission}
        feedPreview={feedPreview}
        routineTemplates={routineTemplates}
        workoutHistory={workoutHistory}
        workoutLoading={workoutLoading}
        celebration={celebration}
        isPro={isPro}
        onOpenWorkoutComposer={onOpenWorkoutComposer}
        onCompleteRecommendedWorkout={onCompleteRecommendedWorkout}
        onOpenPaywall={onOpenPaywall}
        onStartRoutine={onStartRoutine}
        onOpenTest={onOpenTest}
        onSeeCommunity={onSeeCommunity}
        onSelectFeedPreviewUser={onSelectFeedPreviewUser}
        onRequestReminderPermission={onRequestReminderPermission}
      />

      {showWorkoutPanel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/70 px-3 pb-[env(safe-area-inset-bottom)] pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-sm sm:items-center sm:px-6 sm:pb-6"
          role="presentation"
          onClick={onCloseWorkoutComposer}
          data-testid="workout-sheet-backdrop"
        >
          <div
            className="max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] w-full max-w-3xl overflow-hidden rounded-t-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900 sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            data-testid="workout-sheet"
            aria-label={isEnglish ? 'Workout logging sheet' : '운동 기록 시트'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="max-h-[inherit] w-full overflow-y-auto overscroll-contain">
              <WorkoutPanel
                key={[
                  workoutPreset?.name || '',
                  workoutPreset?.workoutType || '',
                  workoutPreset?.durationMinutes || '',
                  workoutPreset?.note || '',
                ].join('|')}
                onComplete={onCompleteWorkout}
                onSaveRoutine={onSaveRoutine}
                onDeleteRoutine={onDeleteRoutine}
                onClose={onCloseWorkoutComposer}
                loading={workoutLoading}
                todayDone={todayDone}
                todayCount={stats.todayCount}
                recentWorkout={{
                  workoutType: stats.lastWorkoutType,
                  durationMinutes: stats.lastWorkoutDuration,
                  note: stats.lastWorkoutNote,
                }}
                routineTemplates={routineTemplates}
                initialSelection={workoutPreset}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
