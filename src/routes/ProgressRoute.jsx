import { useState } from 'react'
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
  onSaveWeight,
  workoutStats,
  workoutHistory,
  onUpdateWorkout,
  onDeleteWorkout,
}) {
  const [weightDraft, setWeightDraft] = useState(null)
  const weightInputValue = weightDraft ?? String(bodyMetrics?.latestWeightKg ?? '')

  const handleWeightSubmit = async (event) => {
    event.preventDefault()
    await onSaveWeight?.(weightInputValue)
    setWeightDraft(null)
  }

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

      <section className="card record-module-card compact record-weight-log-card">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Weight' : '체중'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Quick weight log' : '빠른 체중 기록'}</h2>
          </div>
          <span className="community-mini-pill">
            {bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'}
          </span>
        </div>

        <form className="weight-log-form" onSubmit={handleWeightSubmit}>
          <div className="weight-log-row">
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              step="0.1"
              value={weightInputValue}
              onChange={(event) => setWeightDraft(event.target.value)}
              placeholder={isEnglish ? 'Current weight (kg)' : '현재 몸무게 (kg)'}
              disabled={loadingAction}
            />
            <button type="submit" className="secondary-btn weight-log-btn" disabled={loadingAction}>
              {loadingAction ? (isEnglish ? 'Saving...' : '저장 중...') : (isEnglish ? 'Save weight' : '체중 저장')}
            </button>
          </div>
        </form>

        <p className="subtext compact settings-inline-note">
          {isEnglish
            ? 'Weight logging moved here so profile stays focused on your identity and settings.'
            : '프로필은 가볍게 유지하고, 몸무게 기록은 기록 탭에서 바로 관리할 수 있게 옮겼어요.'}
        </p>
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
