import { useMemo, useState } from 'react'
import MonthlyCalendar from '../components/MonthlyCalendar'
import PremiumStudio from '../components/PremiumStudio'
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
  profile,
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
  const insightToneClass = {
    warm: 'border-amber-200 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/15',
    cool: 'border-cyan-200 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-500/15',
    growth: 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20',
    neutral: 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/10',
  }[progressInsight.tone] ?? 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-white/10'

  const handleWeightSubmit = async (event) => {
    event.preventDefault()
    await onSaveWeight?.(weightInputValue)
    setWeightDraft(null)
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="grid gap-2">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Records' : '기록'}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'This week' : '이번 주'}</h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {isEnglish
              ? 'Start with a workout, then track weight or review your level when needed.'
              : '운동부터 남기고, 필요할 때 체중과 레벨을 이어서 확인하세요.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800" onClick={onGoHome}>
            {isEnglish ? 'Log workout now' : '지금 운동 기록하기'}
          </button>
          <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-5 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onToggleTestFlow} data-testid="progress-open-level-test">
            {levelTestActionLabel}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {recordHubGlanceItems.map((item) => (
            <div key={item.label} className="grid gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
              <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{item.label}</span>
              <strong className="text-2xl font-black leading-tight text-gray-950 dark:text-white">{item.value}</strong>
              <small className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{item.detail}</small>
            </div>
          ))}
        </div>

        <div className={`grid gap-2 rounded-2xl border p-4 ${insightToneClass}`}>
          <span className="text-xs font-black uppercase text-gray-800 dark:text-gray-100">{progressInsight.label}</span>
          <strong className="text-lg font-black leading-6 text-gray-950 dark:text-white">{progressInsight.title}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{progressInsight.body}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" data-testid="record-weight-log">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Weight' : '체중'}</span>
            <h2 className="m-0 mt-1 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Weight log' : '체중 기록'}</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">
            {bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'}
          </span>
        </div>

        <form className="grid gap-3" onSubmit={handleWeightSubmit}>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-base font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
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
          className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6"
          role="presentation"
          onClick={onCloseTestFlow}
          data-testid="level-test-backdrop"
        >
          <div
            className="max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900"
            role="dialog"
            aria-modal="true"
            aria-label={isEnglish ? 'Fitness level test' : '체력 레벨 테스트'}
            data-testid="level-test-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid max-h-[92dvh] grid-rows-[auto_1fr]">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-white/10 sm:p-6">
                <div className="grid gap-1">
                  <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
                    {showTestForm
                      ? (isEnglish ? '3-Min Check' : '3분 체크')
                      : (isEnglish ? 'Result' : '결과')}
                  </span>
                  <strong className="text-2xl font-black leading-tight text-gray-950 dark:text-white">
                    {showTestForm
                      ? (isEnglish ? 'Level test' : '레벨 테스트')
                      : (isEnglish ? 'Your level' : '현재 레벨')}
                  </strong>
                </div>
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
                  onClick={onCloseTestFlow}
                  data-testid="level-test-close"
                >
                  {isEnglish ? 'Close' : '닫기'}
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
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
      <PremiumStudio
        isPro={isPro}
        onOpenPaywall={onOpenPaywall}
        profile={profile}
        latestResult={latestResult}
        workoutStats={workoutStats}
        workoutHistory={workoutHistory}
        weeklyGoal={weeklyGoal}
        activitySummary={activitySummary}
        bodyMetrics={bodyMetrics}
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
