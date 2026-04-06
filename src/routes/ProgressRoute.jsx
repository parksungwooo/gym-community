import MonthlyCalendar from '../components/MonthlyCalendar'
import ProgressPanel from '../components/ProgressPanel'
import ResultView from '../components/ResultView'
import TestForm from '../components/TestForm'
import WorkoutHistory from '../components/WorkoutHistory'
import { PREMIUM_CONTEXT } from '../utils/premium'

export default function ProgressRoute({
  isEnglish,
  showTestForm,
  onToggleTestForm,
  onGoHome,
  onSubmitTest,
  loadingAction,
  testResult,
  latestResult,
  badges,
  weeklyGoal,
  bodyMetrics,
  activitySummary,
  achievementBadges,
  recentActivityEvents,
  isPro,
  onOpenPaywall,
  workoutStats,
  workoutHistory,
  onUpdateWorkout,
  onDeleteWorkout,
}) {
  return (
    <div className="view-stage">
      <section className="card record-hub-card">
        <h2>{isEnglish ? 'Record Center' : '기록 센터'}</h2>
        <p className="subtext">{isEnglish ? 'See records and tests in one place.' : '기록과 테스트를 한 곳에서 봅니다.'}</p>
        <div className="record-hub-actions">
          <button type="button" className="ghost-btn" onClick={onToggleTestForm}>
            {showTestForm
              ? (isEnglish ? 'Close Test' : '테스트 입력 닫기')
              : (isEnglish ? 'Retake Level Test' : '체력 테스트 다시하기')}
          </button>
          <button type="button" className="secondary-btn" onClick={onGoHome}>
            {isEnglish ? 'Log Today\'s Workout' : '오늘 운동 기록하러 가기'}
          </button>
          {!isPro && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.REPORTS)}
            >
              {isEnglish ? 'Unlock Pro Reports' : 'Pro 리포트 열기'}
            </button>
          )}
        </div>
      </section>

      {showTestForm && <TestForm onSubmit={onSubmitTest} loading={loadingAction} />}
      {testResult && <ResultView score={testResult.score} level={testResult.level} onStartWorkout={onGoHome} />}
      <ProgressPanel
        stats={workoutStats}
        latestResult={latestResult}
        badges={badges}
        weeklyGoal={weeklyGoal}
        bodyMetrics={bodyMetrics}
        activitySummary={activitySummary}
        achievementBadges={achievementBadges}
        recentActivityEvents={recentActivityEvents}
      />
      <MonthlyCalendar history={workoutHistory} />
      <WorkoutHistory
        history={workoutHistory}
        onUpdate={onUpdateWorkout}
        onDelete={onDeleteWorkout}
        loading={loadingAction}
      />
    </div>
  )
}
