import { useState } from 'react'
import MonthlyCalendar from '../components/MonthlyCalendar'
import ProgressPanel from '../components/ProgressPanel'
import ResultView from '../components/ResultView'
import TestForm from '../components/TestForm'
import WorkoutHistory from '../components/WorkoutHistory'

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
      <section className="card record-hub-card record-hub-card-simple">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Records' : '기록'}</span>
          <h2>{isEnglish ? 'See your progress in one place.' : '내 변화를 한 곳에서 확인하세요.'}</h2>
          <p className="subtext">
            {isEnglish
              ? 'Body changes, calories, XP, and workout history all live here.'
              : '체중 변화, 칼로리, XP, 운동 기록을 이 탭에서 함께 확인할 수 있어요.'}
          </p>
        </div>
        <div className="record-hub-actions">
          <button type="button" className="ghost-btn" onClick={onToggleTestForm}>
            {showTestForm
              ? (isEnglish ? 'Close Test' : '테스트 닫기')
              : (isEnglish ? 'Retake Level Test' : '레벨 테스트 다시하기')}
          </button>
          <button type="button" className="secondary-btn" onClick={onGoHome}>
            {isEnglish ? "Log Today's Workout" : '오늘 운동 기록하러 가기'}
          </button>
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
