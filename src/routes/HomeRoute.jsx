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
      )}
    </div>
  )
}
