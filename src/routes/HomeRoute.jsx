import { useEffect } from 'react'
import HomeDashboard from '../components/HomeDashboard'
import WorkoutPanel from '../components/WorkoutPanel'

export default function HomeRoute({
  celebration,
  isEnglish,
  profile,
  bodyMetrics,
  todayDone,
  currentLevel,
  stats,
  challenge,
  activitySummary,
  achievementBadges,
  isPro,
  reminder,
  reminderPermission,
  feedPreview,
  routineTemplates,
  workoutLoading,
  onOpenWorkoutComposer,
  onStartRoutine,
  onOpenTest,
  onOpenPaywall,
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
    <div className="view-stage">
      {celebration && (
        <section className="card celebration-card">
          <span className="celebration-eyebrow">Nice Work</span>
          <h2>{isEnglish ? `${celebration.workoutType} saved` : `${celebration.workoutType} 기록 완료`}</h2>
          <p className="subtext">
            {celebration.durationMinutes
              ? isEnglish ? `${celebration.durationMinutes} minutes were saved.` : `${celebration.durationMinutes}분 운동이 저장됐어요.`
              : isEnglish ? 'Today\'s workout was saved.' : '오늘 운동 기록이 저장됐어요.'}{' '}
            {isEnglish ? `You are now at ${celebration.nextWeeklyCount} this week.` : `이번 주 누적 ${celebration.nextWeeklyCount}회입니다.`}
          </p>
          <div className="celebration-actions">
            <button type="button" className="secondary-btn" onClick={onOpenWorkoutComposer}>
              {isEnglish ? 'Log Another' : '하나 더 기록'}
            </button>
            <button type="button" className="ghost-btn" onClick={onSeeCommunity}>
              {isEnglish ? 'See Community' : '커뮤니티 보기'}
            </button>
          </div>
        </section>
      )}
      <HomeDashboard
        profile={profile}
        bodyMetrics={bodyMetrics}
        todayDone={todayDone}
        currentLevel={currentLevel}
        stats={stats}
        challenge={challenge}
        activitySummary={activitySummary}
        achievementBadges={achievementBadges}
        isPro={isPro}
        reminder={reminder}
        reminderPermission={reminderPermission}
        feedPreview={feedPreview}
        routineTemplates={routineTemplates}
        workoutLoading={workoutLoading}
        onOpenWorkoutComposer={onOpenWorkoutComposer}
        onStartRoutine={onStartRoutine}
        onOpenTest={onOpenTest}
        onOpenPaywall={onOpenPaywall}
        onSeeCommunity={onSeeCommunity}
        onSelectFeedPreviewUser={onSelectFeedPreviewUser}
        onRequestReminderPermission={onRequestReminderPermission}
      />
      {showWorkoutPanel && (
        <div
          className="auth-modal-backdrop home-workout-sheet-overlay"
          role="presentation"
          onClick={onCloseWorkoutComposer}
        >
          <div
            className="home-workout-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={isEnglish ? 'Workout logging sheet' : '운동 기록 바텀시트'}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="home-workout-panel-shell">
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
