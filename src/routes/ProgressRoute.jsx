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
  showTestResult,
  onToggleTestFlow,
  onCloseTestFlow,
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
  const isTestFlowOpen = showTestForm || showTestResult

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
          <h2>{isEnglish ? 'This week' : '이번 주'}</h2>
        </div>
        <div className={`surface-insight-banner ${progressInsight.tone}`}>
          <div className="surface-insight-copy">
            <span>{progressInsight.label}</span>
            <strong>{progressInsight.title}</strong>
            <p>{progressInsight.body}</p>
          </div>
        </div>
        <div className="record-hub-actions">
          <button type="button" className="ghost-btn" onClick={onToggleTestFlow} data-testid="progress-open-level-test">
            {isTestFlowOpen
              ? (isEnglish ? 'Close' : '닫기')
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
            <h2 className="app-section-title small">{isEnglish ? 'Weight log' : '체중 기록'}</h2>
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
              placeholder="kg"
              disabled={loadingAction}
            />
            <button type="submit" className="secondary-btn weight-log-btn" disabled={loadingAction}>
              {loadingAction ? (isEnglish ? 'Saving...' : '저장 중...') : (isEnglish ? 'Save' : '저장')}
            </button>
          </div>
        </form>
      </section>

      {isTestFlowOpen && (
        <div
          className="auth-modal-backdrop record-test-flow-overlay"
          role="presentation"
          onClick={onCloseTestFlow}
          data-testid="level-test-backdrop"
        >
          <div
            className="record-test-flow-panel"
            role="dialog"
            aria-modal="true"
            aria-label={isEnglish ? 'Fitness level test' : '체력 레벨 테스트'}
            data-testid="level-test-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="record-test-flow-shell">
              <div className="record-test-flow-header">
                <div className="record-test-flow-title">
                  <span className="auth-modal-kicker">
                    {showTestForm
                      ? (isEnglish ? '3-Min Check' : '3분 체크')
                      : (isEnglish ? 'Result' : '결과')}
                  </span>
                  <strong>
                    {showTestForm
                      ? (isEnglish ? 'Level test' : '레벨 테스트')
                      : (isEnglish ? 'Your level' : '현재 레벨')}
                  </strong>
                </div>
                <button
                  type="button"
                  className="sheet-close-btn"
                  onClick={onCloseTestFlow}
                  data-testid="level-test-close"
                >
                  {isEnglish ? 'Close' : '닫기'}
                </button>
              </div>

              <div className="record-test-flow-body">
                {showTestForm && <TestForm onSubmit={onSubmitTest} loading={loadingAction} />}
                {!showTestForm && showTestResult && testResult && (
                  <ResultView
                    score={testResult.score}
                    level={testResult.level}
                    onStartWorkout={() => {
                      onCloseTestFlow?.()
                      onGoHome?.()
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
