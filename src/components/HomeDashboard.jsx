import { getBadgeLabel, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getBmiCategory } from '../utils/bodyMetrics'
import { localizeLevelText } from '../utils/level'
import { PREMIUM_CONTEXT } from '../utils/premium'

function MetricPill({ eyebrow, value, detail, tone = 'default' }) {
  return (
    <article className={`home-metric-pill ${tone}`}>
      <span>{eyebrow}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function InsightStat({ label, value, detail }) {
  return (
    <article className="home-insight-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  )
}

function ActivityBadgeStrip({ badges }) {
  if (!badges.length) return null

  return (
    <div className="home-badge-strip">
      {badges.map((badge) => (
        <span key={badge} className="home-badge-chip">
          {badge}
        </span>
      ))}
    </div>
  )
}

function formatRoutineSummary(routine, language, isEnglish) {
  const parts = [getWorkoutTypeLabel(routine.workout_type, language)]

  if (routine.duration_minutes) {
    parts.push(isEnglish ? `${routine.duration_minutes} min` : `${routine.duration_minutes}분`)
  }

  return parts.join(' · ')
}

function formatCalories(value, isEnglish) {
  if (!value) return isEnglish ? 'No data yet' : '아직 데이터 없음'
  return isEnglish ? `~${value} kcal` : `약 ${value}kcal`
}

function formatGoalDelta(bodyMetrics, isEnglish) {
  if (bodyMetrics?.targetDeltaKg == null) {
    return isEnglish ? 'Set a target weight' : '목표 체중을 먼저 정해보세요'
  }

  if (bodyMetrics.targetDeltaKg === 0) {
    return isEnglish ? 'Goal reached' : '목표 달성'
  }

  if (bodyMetrics.targetDeltaKg > 0) {
    return isEnglish
      ? `${bodyMetrics.targetDeltaKg} kg left`
      : `${bodyMetrics.targetDeltaKg}kg 남음`
  }

  return isEnglish
    ? `${Math.abs(bodyMetrics.targetDeltaKg)} kg past target`
    : `${Math.abs(bodyMetrics.targetDeltaKg)}kg 초과`
}

function RoutineStartCard({ routine, onStart }) {
  const { language, isEnglish } = useI18n()

  return (
    <button
      type="button"
      className="routine-start-card home-routine-item"
      onClick={() => onStart(routine)}
    >
      <div className="routine-start-copy">
        <strong>{routine.name}</strong>
        <span>{formatRoutineSummary(routine, language, isEnglish)}</span>
      </div>
      <span className="routine-start-action">{isEnglish ? 'Start' : '시작'}</span>
    </button>
  )
}

export default function HomeDashboard({
  profile,
  bodyMetrics,
  todayDone,
  currentLevel,
  stats,
  challenge,
  activitySummary,
  achievementBadges = [],
  isPro,
  reminder,
  reminderPermission,
  routineTemplates = [],
  workoutLoading,
  onOpenWorkoutComposer,
  onStartRoutine,
  onOpenTest,
  onOpenPaywall,
  onRequestReminderPermission,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)

  const nickname = profile?.display_name?.trim()
  const topRoutines = routineTemplates.slice(0, 2)
  const featuredBadges = achievementBadges.slice(0, 3).map((item) => getBadgeLabel(item.badge_key, language))
  const activityLevelValue = activitySummary?.levelValue ?? 1
  const activityProgress = Math.max(0, Math.min(activitySummary?.progressPercent ?? 0, 100))
  const goalProgress = Math.max(0, Math.min(challenge?.progress ?? 0, 100))

  const heroTitle = todayDone
    ? t('오늘 기록은 이미 끝났어요.', 'Today already has a saved workout.')
    : t('오늘 운동 한 번만 찍고 가요.', 'Give today one clean workout check-in.')

  const heroDescription = nickname
    ? todayDone
      ? t(
        `${nickname}님, 이제 오늘은 유지 모드예요. 한 번 더 기록해도 좋고 이 흐름만 지켜도 충분해요.`,
        `${nickname}, today is already in the green. One more log is great, but simply keeping the rhythm is enough.`,
      )
      : t(
        `${nickname}님, 오늘 필요한 건 길지 않은 운동 한 번이에요. 타입과 시간만 남겨도 흐름이 이어집니다.`,
        `${nickname}, today only needs one simple session. Type and time are enough to keep the streak moving.`,
      )
    : t(
      '운동 종류와 시간만 남겨도 오늘의 흐름이 시작돼요.',
      'Workout type and time are enough to get today moving.',
    )

  const currentLevelLabel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : t('레벨 테스트 전', 'Level test pending')

  const bodyStatusLabel = bodyMetrics?.bmi != null
    ? `${bodyMetrics.bmi} BMI · ${getBmiCategory(bodyMetrics.bmi, isEnglish)}`
    : t('키와 체중을 입력하면 BMI가 바로 계산돼요.', 'Add height and weight to unlock BMI.')

  const recentWorkoutTitle = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : t('아직 기록 없음', 'No workout yet')

  const recentWorkoutMeta = stats.lastWorkoutType
    ? [
      stats.lastWorkoutDuration ? t(`${stats.lastWorkoutDuration}분`, `${stats.lastWorkoutDuration} min`) : null,
      stats.lastWorkoutCalories ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
    ].filter(Boolean).join(' · ')
    : t('첫 기록을 남기면 여기에 바로 보여요.', 'Your latest workout will appear here after the first save.')

  const showReminderCard = reminder?.enabled && !todayDone
  const reminderTitle = reminder?.due
    ? t('지금이 오늘 운동 리마인더 시간이에요.', 'It is time for today’s workout reminder.')
    : t(
      `오늘 리마인더는 ${reminder?.reminderTimeLabel}에 울리도록 잡혀 있어요.`,
      `Today’s reminder is set for ${reminder?.reminderTimeLabel}.`,
    )

  const reminderBody = reminder?.due
    ? t(
      '지금 한 번만 기록해도 연속 기록과 주간 흐름을 계속 이어갈 수 있어요.',
      'One workout now is enough to keep both your streak and weekly rhythm alive.',
    )
    : t(
      '부담 없이 다시 돌아올 수 있도록 오늘의 타이밍만 잡아두었어요.',
      'A gentle nudge is queued up so you can come back without overthinking it.',
    )

  return (
    <section className="home-dashboard-app streamlined-home home-dashboard-redesign">
      <section className="card home-focus-card home-growth-hero">
        <div className="home-growth-hero-main">
          <div className="home-focus-copy">
            <span className="app-section-kicker">{t('오늘의 흐름', 'Today')}</span>
            <h2>{heroTitle}</h2>
            <p>{heroDescription}</p>
          </div>

          <div className="home-focus-actions">
            <button
              type="button"
              className="primary-btn home-focus-btn"
              onClick={onOpenWorkoutComposer}
              disabled={workoutLoading}
            >
              {workoutLoading
                ? t('열고 있어요...', 'Opening...')
                : todayDone
                  ? t('운동 하나 더 기록', 'Log one more workout')
                  : t('오늘 운동 기록하기', 'Log today’s workout')}
            </button>

            {!currentLevel && (
              <button
                type="button"
                className="ghost-btn home-focus-secondary"
                onClick={onOpenTest}
              >
                {t('레벨 테스트 먼저 하기', 'Take the level test first')}
              </button>
            )}
          </div>

          <ActivityBadgeStrip badges={featuredBadges} />
        </div>

        <aside className="home-growth-side">
          <div className="home-growth-side-head">
            <span>{t('오늘의 보드', 'Daily board')}</span>
            <strong>{todayDone ? t('완료', 'Logged') : t('진행 중', 'In progress')}</strong>
          </div>
          <div className="home-growth-side-grid">
            <MetricPill
              eyebrow={t('주간 목표', 'Weekly goal')}
              value={`${challenge.current}/${challenge.goal}`}
              detail={`${goalProgress}%`}
              tone="warm"
            />
            <MetricPill
              eyebrow={t('오늘 XP', 'Today XP')}
              value={`${activitySummary?.todayXp ?? 0} XP`}
              detail={t('한 번 기록하면 바로 올라가요', 'One saved workout moves this')}
              tone="cool"
            />
            <MetricPill
              eyebrow={t('연속 기록', 'Streak')}
              value={t(`${stats.streak}일`, `${stats.streak} days`)}
              detail={t('끊기지 않게 유지해보세요', 'Keep the rhythm unbroken')}
            />
            <MetricPill
              eyebrow={t('현재 레벨', 'Current level')}
              value={currentLevelLabel}
              detail={t(`활동 Lv ${activityLevelValue}`, `Activity Lv ${activityLevelValue}`)}
            />
          </div>
        </aside>
      </section>

      {showReminderCard && (
        <section className={`card home-reminder-card home-reminder-banner ${reminder?.due ? 'due' : ''}`}>
          <div className="home-reminder-copy">
            <span className="app-section-kicker">{t('리마인더', 'Reminder')}</span>
            <h3>{reminderTitle}</h3>
            <p className="subtext">{reminderBody}</p>
          </div>
          <div className="home-reminder-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={onOpenWorkoutComposer}
              disabled={workoutLoading}
            >
              {t('지금 기록하기', 'Log now')}
            </button>
            {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' && (
              <button type="button" className="ghost-btn" onClick={onRequestReminderPermission}>
                {t('브라우저 알림 켜기', 'Enable browser alert')}
              </button>
            )}
          </div>
        </section>
      )}

      <section className="home-growth-grid">
        <section className="card record-module-card compact activity-card home-growth-card home-growth-card-accent">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{t('활동 XP', 'Activity XP')}</span>
              <h2 className="app-section-title small">{t('성장 보드', 'Growth board')}</h2>
            </div>
            <span className="community-mini-pill accent">{`${activitySummary?.totalXp ?? 0} XP`}</span>
          </div>

          <div className="home-level-track">
            <div>
              <strong>{t(`활동 Lv ${activityLevelValue}`, `Activity Lv ${activityLevelValue}`)}</strong>
              <p>
                {activitySummary?.nextLevelValue
                  ? t(
                    `다음 레벨까지 ${activitySummary.remainingXp ?? 0} XP`,
                    `${activitySummary.remainingXp ?? 0} XP to Lv ${activitySummary.nextLevelValue}`,
                  )
                  : t('최고 활동 레벨에 도달했어요.', 'You reached the highest activity level.')}
              </p>
            </div>
            <span>{`${activityProgress}%`}</span>
          </div>

          <div className="goal-progress-bar activity-progress-bar">
            <div
              className="goal-progress-fill activity-progress-fill"
              style={{ width: `${activityProgress}%` }}
            />
          </div>

          <div className="home-insight-grid">
            <InsightStat
              label={t('주간 포인트', 'Weekly points')}
              value={String(activitySummary?.weeklyPoints ?? 0)}
              detail={t('커뮤니티 랭킹에 반영돼요', 'Shown on the community board')}
            />
            <InsightStat
              label={t('오늘 XP', 'Today XP')}
              value={`${activitySummary?.todayXp ?? 0} XP`}
              detail={todayDone ? t('오늘 기록 완료', 'Workout saved today') : t('오늘 한 번이면 충분해요', 'One workout is enough')}
            />
            <InsightStat
              label={t('대표 배지', 'Featured badge')}
              value={featuredBadges[0] ?? t('새 배지 도전 중', 'Working toward the next badge')}
              detail={t('꾸준함 보상이 여기에 쌓여요', 'Consistency rewards stack here')}
            />
          </div>
        </section>

        <section className="card record-module-card compact home-growth-card">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{t('주간 리듬', 'Weekly rhythm')}</span>
              <h2 className="app-section-title small">{t('이번 주 진행 상황', 'This week’s pace')}</h2>
            </div>
            <span className="community-mini-pill">{`${challenge.current}/${challenge.goal}`}</span>
          </div>

          <div className="home-level-track">
            <div>
              <strong>{challenge.title}</strong>
              <p>{t('주간 목표를 채우면 포인트 보너스가 붙어요.', 'Complete the weekly goal to unlock a bonus.')}</p>
            </div>
            <span>{`${goalProgress}%`}</span>
          </div>

          <div className="goal-progress-bar">
            <div className="goal-progress-fill" style={{ width: `${goalProgress}%` }} />
          </div>

          <div className="home-insight-grid">
            <InsightStat
              label={t('이번 주 운동', 'Workouts')}
              value={t(`${stats.weeklyCount}회`, `${stats.weeklyCount}`)}
              detail={t('목표를 향해 쌓이고 있어요', 'Climbing toward your goal')}
            />
            <InsightStat
              label={t('주간 칼로리', 'Weekly burn')}
              value={formatCalories(stats.weeklyCalories, isEnglish)}
              detail={t('누적 소모 추정치', 'Estimated burn so far')}
            />
            <InsightStat
              label={t('최근 운동', 'Latest workout')}
              value={recentWorkoutTitle}
              detail={recentWorkoutMeta}
            />
          </div>
        </section>

        <section className="card record-module-card compact home-growth-card">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{t('바디 스냅샷', 'Body snapshot')}</span>
              <h2 className="app-section-title small">{t('체중과 BMI', 'Weight and BMI')}</h2>
            </div>
          </div>

          <div className="home-insight-grid">
            <InsightStat
              label={t('현재 체중', 'Current weight')}
              value={bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : t('미입력', 'Pending')}
              detail={t('최근 기록 기준', 'Using your latest entry')}
            />
            <InsightStat
              label="BMI"
              value={bodyMetrics?.bmi != null ? `${bodyMetrics.bmi}` : '--'}
              detail={bodyMetrics?.bmi != null ? getBmiCategory(bodyMetrics.bmi, isEnglish) : t('정보를 입력하면 계산돼요', 'Calculated after body data')}
            />
            <InsightStat
              label={t('목표 상태', 'Goal status')}
              value={formatGoalDelta(bodyMetrics, isEnglish)}
              detail={bodyMetrics?.goalProgressPercent != null ? `${bodyMetrics.goalProgressPercent}%` : t('진행률 대기 중', 'Progress pending')}
            />
          </div>

          <p className="subtext compact home-body-footnote">{bodyStatusLabel}</p>
        </section>
      </section>

      <section className="home-secondary-grid">
        <section className="card home-routine-card home-routine-spotlight">
          <div className="home-module-heading">
            <div>
              <span className="app-section-kicker">{t('최근 루틴', 'Recent routines')}</span>
              <h3>{t('반복하는 루틴을 바로 다시 시작해요', 'Restart what is already working')}</h3>
            </div>
            <span className="home-module-meta">
              {topRoutines.length
                ? t(`${topRoutines.length}개 준비됨`, `${topRoutines.length} ready`)
                : t('저장된 루틴 없음', 'No saved routine yet')}
            </span>
          </div>

          {topRoutines.length ? (
            <div className="home-routine-list">
              {topRoutines.map((routine) => (
                <RoutineStartCard key={routine.id} routine={routine} onStart={onStartRoutine} />
              ))}
            </div>
          ) : (
            <div className="empty-state-card cool">
              <span className="empty-state-badge">{t('루틴', 'Routine')}</span>
              <strong>{t('저장한 루틴이 여기에 쌓여요.', 'Your saved routines will stack up here.')}</strong>
              <p>
                {t(
                  '운동 한 번을 루틴으로 저장해두면 홈에서 바로 다시 시작할 수 있어요.',
                  'Save one workout as a routine and you can restart it from home anytime.',
                )}
              </p>
            </div>
          )}
        </section>

        <section className="card home-context-card home-story-card">
          <div className="home-module-heading">
            <div>
              <span className="app-section-kicker">{t('한눈에 보기', 'At a glance')}</span>
              <h3>{t('오늘의 성장 이야기', 'Today’s growth story')}</h3>
            </div>
          </div>

          <div className="home-story-grid">
            <MetricPill
              eyebrow={t('현재 레벨', 'Current level')}
              value={currentLevelLabel}
              detail={t('체력 테스트 기준', 'Based on the fitness test')}
            />
            <MetricPill
              eyebrow={t('오늘 칼로리', 'Today burn')}
              value={formatCalories(stats.todayCalories, isEnglish)}
              detail={t('오늘 기록 기준 추정치', 'Estimated from today’s saved logs')}
              tone="cool"
            />
            <MetricPill
              eyebrow={t('누적 칼로리', 'Total burn')}
              value={formatCalories(stats.totalCalories, isEnglish)}
              detail={t('지금까지 누적된 추정치', 'Estimated total across your logs')}
            />
            <MetricPill
              eyebrow={t('바디 목표', 'Body goal')}
              value={formatGoalDelta(bodyMetrics, isEnglish)}
              detail={t('체중 목표 기준', 'Measured against your target weight')}
              tone="warm"
            />
          </div>
        </section>
      </section>

      <section className={`card home-context-card home-pro-preview-card ${isPro ? 'active' : ''}`}>
        <div className="home-module-heading">
          <div>
            <span className="app-section-kicker">Pro</span>
            <h3>{isPro ? t('지금 Pro 기능이 열려 있어요', 'Your Pro tools are active') : t('기록을 더 깊게 보는 Pro', 'Go deeper with Pro')}</h3>
          </div>
          <span className={`community-mini-pill ${isPro ? 'accent' : ''}`}>
            {isPro ? t('활성화됨', 'Active') : t('7일 무료 체험', '7-day free trial')}
          </span>
        </div>

        <p className="subtext compact">
          {isPro
            ? t(
              '주간/월간 리포트, 고급 리마인더, 비공개 챌린지 기능을 바로 이어서 사용할 수 있어요.',
              'Weekly reports, advanced reminders, and private challenges are ready to use.',
            )
            : t(
              '주간 리포트, 고급 리마인더, 비공개 챌린지로 꾸준함을 더 오래 유지해보세요.',
              'Use reports, advanced reminders, and private challenges to keep consistency going longer.',
            )}
        </p>

        <div className="home-pro-list">
          <span>{t('주간/월간 리포트', 'Weekly and monthly reports')}</span>
          <span>{t('요일별 리마인더', 'Weekday reminders')}</span>
          <span>{t('비공개 챌린지', 'Private challenges')}</span>
        </div>

        <div className="home-pro-actions">
          <button
            type="button"
            className={isPro ? 'ghost-btn' : 'primary-btn'}
            onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.GENERAL)}
          >
            {isPro ? t('요금제 보기', 'View plans') : t('Pro 자세히 보기', 'See Pro plans')}
          </button>
          {!isPro && (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.REMINDERS)}
            >
              {t('리마인더 먼저 보기', 'Preview reminder perks')}
            </button>
          )}
        </div>
      </section>
    </section>
  )
}
