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

  const levelSummary = currentLevel
    ? (isEnglish ? `Level ${currentLevel}` : `레벨 ${currentLevel}`)
    : (isEnglish ? 'Test not started' : '테스트 전')
  const latestWeightSummary = bodyMetrics?.latestWeightKg != null
    ? `${bodyMetrics.latestWeightKg} kg`
    : (isEnglish ? 'Not set yet' : '아직 없음')
  const recordHubGlanceItems = [
    {
      label: isEnglish ? 'Weekly goal' : '주간 목표',
      value: `${workoutStats?.weeklyCount ?? 0}/${weeklyGoal}`,
      detail: isEnglish
        ? `${activitySummary?.todayXp ?? 0} XP today`
        : `오늘 XP ${activitySummary?.todayXp ?? 0}`,
    },
    {
      label: isEnglish ? 'Current status' : '현재 상태',
      value: levelSummary,
      detail: latestWeightSummary,
    },
  ]
  const levelTestActionLabel = isTestFlowOpen
    ? (isEnglish ? 'Close level test' : '레벨 테스트 닫기')
    : currentLevel
      ? (isEnglish ? 'Review level test' : '레벨 테스트 다시 보기')
      : (isEnglish ? 'Open level test' : '레벨 테스트 열기')

  const handleWeightSubmit = async (event) => {
    event.preventDefault()
    await onSaveWeight?.(weightInputValue)
    setWeightDraft(null)
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="record-hub-copy">
          <span className="app-section-kicker">{isEnglish ? 'Records' : '기록'}</span>
          <h2>{isEnglish ? 'This week' : '이번 주'}</h2>
          <p>
            {isEnglish
              ? 'Start with a workout, then track weight or review your level when needed.'
              : '운동부터 남기고, 필요할 때 체중과 레벨을 이어서 확인하세요.'}
          </p>
        </div>

        <div className="record-hub-actions">
          <button type="button" className="min-h-12 rounded-lg bg-emerald-500 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600" onClick={onGoHome}>
            {isEnglish ? 'Log workout now' : '지금 운동 기록하기'}
          </button>
          <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-5 text-sm font-black text-gray-600 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white" onClick={onToggleTestFlow} data-testid="progress-open-level-test">
            {levelTestActionLabel}
          </button>
        </div>

        <div className="record-hub-glance">
          {recordHubGlanceItems.map((item) => (
            <div key={item.label} className="record-hub-glance-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>

        <div className={`surface-insight-banner ${progressInsight.tone}`}>
          <div className="surface-insight-copy">
            <span>{progressInsight.label}</span>
            <strong>{progressInsight.title}</strong>
            <p>{progressInsight.body}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 record-weight-log-card">
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
            <button type="submit" className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10" disabled={loadingAction}>
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
