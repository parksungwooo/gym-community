import { useMemo, useState } from 'react'
import MonthlyCalendar from '../components/MonthlyCalendar'
import ProgressPanel from '../components/ProgressPanel'
import ResultView from '../components/ResultView'
import TestForm from '../components/TestForm'
import WorkoutHistory from '../components/WorkoutHistory'
import { buildProgressInsight } from '../features/app/surfaceInsights'

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
  const currentLevel = latestResult?.level ?? testResult?.level ?? null
  const progressInsight = useMemo(
    () => buildProgressInsight({
      currentLevel,
      workoutStats,
      weeklyGoal,
      bodyMetrics,
      activitySummary,
      workoutHistory,
      isEnglish,
    }),
    [activitySummary, bodyMetrics, currentLevel, isEnglish, weeklyGoal, workoutHistory, workoutStats],
  )

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
          <h2>{isEnglish ? 'See your records at a glance.' : '내 기록을 한눈에 보기'}</h2>
        </div>
        <div className={`surface-insight-banner ${progressInsight.tone}`}>
          <div className="surface-insight-copy">
            <span>{progressInsight.label}</span>
            <strong>{progressInsight.title}</strong>
            <p>{progressInsight.body}</p>
          </div>
        </div>
        <div className="record-hub-actions">
          <button type="button" className="ghost-btn" onClick={onToggleTestForm}>
            {showTestForm
              ? (isEnglish ? 'Close test' : '테스트 닫기')
              : (isEnglish ? 'Level test' : '레벨 테스트')}
          </button>
          <button type="button" className="secondary-btn" onClick={onGoHome}>
            {isEnglish ? 'Log workout' : '운동 기록'}
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
