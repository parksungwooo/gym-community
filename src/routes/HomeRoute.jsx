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
  workoutLoading,
  onOpenWorkoutComposer,
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
      {celebration && (
        <section className="grid gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/20 dark:bg-neutral-900 sm:p-6">
          <div className="inline-grid h-16 w-16 place-items-center rounded-3xl bg-emerald-700 text-2xl font-black text-white shadow-sm">
            {celebration.gainedXp ? `+${celebration.gainedXp}` : 'OK'}
          </div>
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">Nice Work</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? `${celebration.workoutType} saved` : `${celebration.workoutType} 기록 완료`}</h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {celebration.durationMinutes
              ? isEnglish ? `${celebration.durationMinutes} minutes were saved.` : `${celebration.durationMinutes}분 운동이 저장됐어요.`
              : isEnglish ? 'Today\'s workout was saved.' : '오늘 운동 기록이 저장됐어요.'}{' '}
            {isEnglish ? `You are now at ${celebration.nextWeeklyCount} this week.` : `이번 주 누적 ${celebration.nextWeeklyCount}회입니다.`}
            {celebration.gainedXp ? ` ${isEnglish ? `You earned ${celebration.gainedXp} XP.` : `${celebration.gainedXp} XP를 얻었어요.`}` : ''}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10" onClick={onOpenWorkoutComposer}>
              {isEnglish ? 'Log Another' : '하나 더 기록'}
            </button>
            <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onSeeCommunity}>
              {isEnglish ? 'See Community' : '커뮤니티 보기'}
            </button>
          </div>
        </section>
      )}
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
        workoutLoading={workoutLoading}
        onOpenWorkoutComposer={onOpenWorkoutComposer}
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
            aria-label={isEnglish ? 'Workout logging sheet' : '운동 기록 바텀시트'}
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
