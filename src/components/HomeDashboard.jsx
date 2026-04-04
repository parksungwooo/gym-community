import { getBadgeLabel, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function MetricTile({ label, value, meta, tone = 'default' }) {
  return (
    <article className={`metric-tile compact ${tone}`}>
      <span className="metric-tile-label">{label}</span>
      <strong className="metric-tile-value">{value}</strong>
      {meta ? <span className="metric-tile-meta">{meta}</span> : null}
    </article>
  )
}

function ShortcutTile({ label, detail, tone = 'default', onClick }) {
  return (
    <button type="button" className={`shortcut-tile compact ${tone}`} onClick={onClick}>
      <span className="shortcut-tile-label">{label}</span>
      <span className="shortcut-tile-detail">{detail}</span>
    </button>
  )
}

function OnboardingStep({ index, title, detail }) {
  return (
    <article className="onboarding-step compact">
      <span className="onboarding-step-index">{index}</span>
      <div className="onboarding-step-copy">
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </article>
  )
}

export default function HomeDashboard({
  user,
  profile,
  todayDone,
  currentLevel,
  currentScore,
  stats,
  challenge,
  badges,
  todayFocus,
  onCompleteWorkout,
  workoutLoading,
  onOpenCommunity,
  onOpenProgress,
  onOpenTest,
}) {
  const { language, isEnglish } = useI18n()
  const nickname = profile?.display_name?.trim() || null
  const isFirstVisit = !currentLevel && stats.todayCount === 0 && stats.weeklyCount === 0

  const greeting = user?.is_anonymous
    ? (isEnglish ? 'Start your streak with one simple log.' : '기록 하나로 오늘 스트릭을 시작해보세요.')
    : (isEnglish ? `${nickname || 'You'} are ready for today.` : `${nickname || '당신'}의 오늘 운동을 이어가볼까요?`)

  const recentWorkout = stats.lastWorkoutType && stats.lastWorkoutDate
    ? `${getWorkoutTypeLabel(stats.lastWorkoutType, language)} · ${new Date(stats.lastWorkoutDate).toLocaleDateString(isEnglish ? 'en-US' : 'ko-KR', { month: 'numeric', day: 'numeric' })}`
    : (isEnglish ? 'No recent workout' : '최근 운동 없음')

  const featuredBadge = getBadgeLabel(badges[badges.length - 1] ?? 'starter', language)
  const displayLevel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : (isEnglish ? 'Not tested' : '측정 전')

  return (
    <section className="home-dashboard-app compact-home-dashboard">
      <section className="card app-surface home-status-surface compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Today' : '오늘'}</span>
            <h2 className="app-section-title compact">{isEnglish ? 'Daily Overview' : '데일리 오버뷰'}</h2>
          </div>
          <span className={`status-pill compact ${todayDone ? 'done' : 'ready'}`}>
            {todayDone ? (isEnglish ? 'Logged' : '기록 완료') : (isEnglish ? 'Ready' : '기록 가능')}
          </span>
        </div>

        <div className="home-headline-block compact">
          <strong className="home-headline compact">
            {todayDone
              ? (isEnglish ? 'Today is already logged.' : '오늘 운동은 이미 기록했어요.')
              : (isEnglish ? 'Log today before anything else.' : '오늘 운동부터 먼저 기록해볼까요?')}
          </strong>
          <p className="subtext compact">{greeting}</p>
        </div>

        <div className="hero-action-card compact">
          <div>
            <span className="hero-action-label">{todayFocus.label}</span>
            <strong className="hero-action-title">{todayFocus.title}</strong>
            <p className="hero-action-detail compact">{todayFocus.detail}</p>
          </div>

          <button
            type="button"
            className="primary-btn hero-action-btn compact"
            onClick={() =>
              onCompleteWorkout({
                workoutType: '빠른 체크인',
                durationMinutes: 20,
                note: isEnglish ? 'Quick check-in from home.' : '홈에서 빠르게 오늘 운동을 체크했어요.',
              })
            }
            disabled={workoutLoading}
          >
            {workoutLoading
              ? (isEnglish ? 'Saving...' : '저장 중...')
              : todayDone
                ? (isEnglish ? 'Log One More' : '하나 더 기록')
                : (isEnglish ? 'Quick Start' : '빠른 시작')}
          </button>
        </div>
      </section>

      {isFirstVisit && (
        <section className="card onboarding-surface compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Start Here' : '처음 시작'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'First 3 steps' : '첫 3단계'}</h2>
            </div>
            <span className="community-mini-pill">{isEnglish ? 'Quick setup' : '빠른 시작'}</span>
          </div>

          <div className="onboarding-step-list compact">
            <OnboardingStep
              index="1"
              title={isEnglish ? 'Check your level' : '레벨 확인'}
              detail={isEnglish ? 'Take the test once.' : '테스트를 한 번 해보세요.'}
            />
            <OnboardingStep
              index="2"
              title={isEnglish ? 'Save one workout' : '운동 기록'}
              detail={isEnglish ? 'A 20-minute log is enough.' : '20분 기록이면 충분해요.'}
            />
            <OnboardingStep
              index="3"
              title={isEnglish ? 'See the feed' : '피드 보기'}
              detail={isEnglish ? 'Your feed starts moving too.' : '피드도 바로 움직이기 시작해요.'}
            />
          </div>

          <div className="onboarding-actions compact">
            <button type="button" className="secondary-btn compact" onClick={onOpenTest}>
              {isEnglish ? 'Level Test' : '레벨 테스트'}
            </button>
            <button
              type="button"
              className="ghost-btn compact"
              onClick={() =>
                onCompleteWorkout({
                  workoutType: '빠른 체크인',
                  durationMinutes: 20,
                  note: isEnglish ? 'First quick check-in from home.' : '처음 빠른 체크인으로 기록을 시작했어요.',
                })
              }
              disabled={workoutLoading}
            >
              {isEnglish ? 'Quick Log' : '바로 기록'}
            </button>
          </div>
        </section>
      )}

      <section className="metric-grid compact">
        <MetricTile
          label={isEnglish ? 'Today' : '오늘'}
          value={isEnglish ? `${stats.todayCount}` : `${stats.todayCount}개`}
          meta={isEnglish ? 'logs today' : '오늘 기록'}
          tone="cool"
        />
        <MetricTile
          label={isEnglish ? 'Level' : '레벨'}
          value={displayLevel}
          meta={currentScore ? (isEnglish ? `${currentScore} pts` : `${currentScore}점`) : (isEnglish ? 'first test' : '첫 테스트 전')}
          tone="warm"
        />
        <MetricTile
          label={isEnglish ? 'Latest' : '최근'}
          value={recentWorkout}
          meta={isEnglish ? `${stats.weeklyCount}/${challenge.goal} this week` : `이번 주 ${stats.weeklyCount}/${challenge.goal}`}
        />
      </section>

      <section className="card app-surface challenge-surface compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Challenge' : '챌린지'}</span>
            <h2 className="app-section-title small">{challenge.title}</h2>
          </div>
          <span className="challenge-badge-pill">{featuredBadge}</span>
        </div>

        <div className="challenge-summary-row compact">
          <strong>{challenge.current}/{challenge.goal}</strong>
          <span>
            {isEnglish
              ? `${Math.max(challenge.goal - challenge.current, 0)} left this week`
              : `이번 주 ${Math.max(challenge.goal - challenge.current, 0)}회 남음`}
          </span>
        </div>
        <div className="challenge-progress compact-progress">
          <div className="challenge-progress-bar" style={{ width: `${challenge.progress}%` }} />
        </div>
      </section>

      <section className="quick-launch-grid compact">
        <ShortcutTile
          label={isEnglish ? 'Records' : '기록'}
          detail={isEnglish ? 'Timeline and badges' : '타임라인과 배지'}
          tone="cool"
          onClick={onOpenProgress}
        />
        <ShortcutTile
          label={isEnglish ? 'Community' : '커뮤니티'}
          detail={isEnglish ? 'Ranking and reactions' : '랭킹과 반응'}
          onClick={onOpenCommunity}
        />
        <ShortcutTile
          label={isEnglish ? 'Test' : '테스트'}
          detail={isEnglish ? 'Update your level' : '현재 레벨 측정'}
          tone="warm"
          onClick={onOpenTest}
        />
      </section>
    </section>
  )
}
