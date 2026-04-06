import { getBadgeLabel, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getBmiCategory } from '../utils/bodyMetrics'
import { localizeLevelText } from '../utils/level'

function formatDate(date, language) {
  if (!date) {
    return language === 'en' ? 'No record' : '기록 없음'
  }

  return new Date(date).toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', {
    month: 'long',
    day: 'numeric',
  })
}

function getWorkoutMark(type) {
  switch (type) {
    case '러닝': return 'RN'
    case '웨이트': return 'WT'
    case '스트레칭': return 'ST'
    case '요가': return 'YG'
    case '필라테스': return 'PL'
    case '사이클': return 'CY'
    case '빠른 체크인': return 'QC'
    default: return 'ET'
  }
}

function HealthStatTile({ label, value, meta, tone = 'default' }) {
  return (
    <article className={`health-stat-tile compact ${tone}`}>
      <span className="health-stat-label">{label}</span>
      <strong className="health-stat-value">{value}</strong>
      <span className="health-stat-meta">{meta}</span>
    </article>
  )
}

function formatWeightChange(value, isEnglish) {
  if (value == null) return isEnglish ? 'No previous entry' : '이전 기록 없음'
  if (value === 0) return isEnglish ? 'No change' : '변화 없음'
  return `${value > 0 ? '+' : ''}${value} kg`
}

export default function ProgressPanel({ stats, latestResult, badges, weeklyGoal = 4, bodyMetrics }) {
  const { language, isEnglish } = useI18n()
  const maxCount = Math.max(...(stats.typeCounts?.map((item) => item.count) ?? [1]))
  const latestWorkoutName = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : (isEnglish ? 'No workout yet' : '아직 운동 기록이 없어요')

  const latestWorkoutMeta = stats.lastWorkoutDuration
    ? `${isEnglish ? `${stats.lastWorkoutDuration} min` : `${stats.lastWorkoutDuration}분`}${stats.lastWorkoutNote ? ` · ${stats.lastWorkoutNote}` : ''}`
    : stats.lastWorkoutNote || (isEnglish ? 'No duration saved' : '시간 기록 없음')

  const trendPoints = bodyMetrics?.history?.slice(-6) ?? []
  const weightValues = trendPoints.map((item) => item.weightKg)
  const maxWeight = weightValues.length ? Math.max(...weightValues) : 0
  const minWeight = weightValues.length ? Math.min(...weightValues) : 0
  const range = maxWeight - minWeight || 1

  return (
    <section className="record-health-screen compact-record-screen">
      <section className="card record-health-hero compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Records' : '기록'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Health Snapshot' : '건강 스냅샷'}</h2>
          </div>
          <span className="community-mini-pill">{isEnglish ? `${stats.weeklyCount}/${weeklyGoal} week` : `주 ${stats.weeklyCount}/${weeklyGoal}`}</span>
        </div>

        <div className="record-health-headline compact">
          <strong>{isEnglish ? 'Your week at a glance.' : '이번 주 흐름을 한눈에 보세요.'}</strong>
          <p className="subtext compact">
            {isEnglish
              ? 'Workouts and body metrics now sit together in one place.'
              : '운동 기록과 몸 상태 지표를 한곳에서 볼 수 있어요.'}
          </p>
        </div>

        <div className="health-stat-grid compact">
          <HealthStatTile
            label={isEnglish ? 'Today' : '오늘'}
            value={isEnglish ? `${stats.todayCount} logs` : `${stats.todayCount}개`}
            meta={stats.todayCount ? (isEnglish ? 'Logged today' : '오늘 기록 있음') : (isEnglish ? 'No log yet' : '오늘 기록 없음')}
            tone="cool"
          />
          <HealthStatTile
            label={isEnglish ? 'Streak' : '연속'}
            value={isEnglish ? `${stats.streak} days` : `${stats.streak}일`}
            meta={isEnglish ? `Last ${stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate, language) : 'none'}` : `마지막 ${stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate, language) : '없음'}`}
            tone="warm"
          />
          <HealthStatTile
            label={isEnglish ? 'Level' : '레벨'}
            value={latestResult ? localizeLevelText(latestResult.level, language) : (isEnglish ? 'Not tested' : '측정 전')}
            meta={latestResult ? (isEnglish ? `${latestResult.score} pts` : `${latestResult.score}점`) : (isEnglish ? 'First test pending' : '첫 테스트 전')}
          />
        </div>
      </section>

      <section className="record-health-grid compact body-metrics-grid">
        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Body' : '체형'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'BMI' : 'BMI'}</h2>
            </div>
          </div>
          <div className="record-highlight-block compact">
            <strong className="record-highlight-title">
              {bodyMetrics?.bmi != null ? bodyMetrics.bmi : (isEnglish ? 'Need more data' : '데이터 필요')}
            </strong>
            <p className="record-highlight-meta">
              {bodyMetrics?.bmi != null
                ? `${getBmiCategory(bodyMetrics.bmi, isEnglish)} · ${bodyMetrics.heightCm} cm / ${bodyMetrics.latestWeightKg} kg`
                : (isEnglish ? 'Add height and weight in your profile to calculate BMI.' : '프로필에 키와 몸무게를 입력하면 BMI가 계산돼요.')}
            </p>
          </div>
        </section>

        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Goal' : '목표'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Progress to Target' : '목표 체중 진행률'}</h2>
            </div>
            <span className="community-mini-pill accent">
              {bodyMetrics?.goalProgressPercent != null ? `${bodyMetrics.goalProgressPercent}%` : '--'}
            </span>
          </div>
          <div className="goal-progress-block">
            <div className="goal-progress-bar">
              <div
                className="goal-progress-fill"
                style={{ width: `${bodyMetrics?.goalProgressPercent ?? 0}%` }}
              />
            </div>
            <p className="record-highlight-meta">
              {bodyMetrics?.targetDeltaKg == null
                ? (isEnglish ? 'Set a target weight and log at least one weight entry.' : '목표 체중을 설정하고 몸무게를 기록해보세요.')
                : bodyMetrics.targetDeltaKg === 0
                  ? (isEnglish ? 'You are at your target weight.' : '현재 목표 체중에 도달했어요.')
                  : bodyMetrics.targetDeltaKg > 0
                    ? (isEnglish ? `${bodyMetrics.targetDeltaKg} kg left to lose.` : `${bodyMetrics.targetDeltaKg}kg 더 감량하면 목표예요.`)
                    : (isEnglish ? `${Math.abs(bodyMetrics.targetDeltaKg)} kg beyond target.` : `목표보다 ${Math.abs(bodyMetrics.targetDeltaKg)}kg 더 낮아요.`)}
            </p>
          </div>
        </section>
      </section>

      <section className="card record-module-card compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Trend' : '추이'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Weight Trend' : '체중 변화 추이'}</h2>
          </div>
          <span className="community-mini-pill">
            {bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'}
          </span>
        </div>

        {trendPoints.length ? (
          <div className="weight-trend-shell">
            <div className="weight-trend-chart">
              {trendPoints.map((point) => {
                const heightPercent = ((point.weightKg - minWeight) / range) * 100
                return (
                  <div key={point.id} className="weight-trend-point">
                    <div className="weight-trend-bar">
                      <span style={{ height: `${Math.max(heightPercent, 12)}%` }} />
                    </div>
                    <strong>{point.weightKg}</strong>
                    <small>{formatDate(point.recordedAt, language)}</small>
                  </div>
                )
              })}
            </div>
            <p className="record-highlight-meta">
              {isEnglish ? 'Change vs previous:' : '직전 기록 대비:'} {formatWeightChange(bodyMetrics?.changeFromPreviousKg, isEnglish)}
              {' · '}
              {isEnglish ? 'Change vs first:' : '첫 기록 대비:'} {formatWeightChange(bodyMetrics?.changeFromStartKg, isEnglish)}
            </p>
          </div>
        ) : (
          <div className="empty-state-card cool">
            <span className="empty-state-badge">{isEnglish ? 'Weight' : '체중'}</span>
            <strong>{isEnglish ? 'Your trend will appear after the first entry.' : '첫 체중 기록 후 추이가 보이기 시작해요.'}</strong>
            <p>
              {isEnglish
                ? 'Log your weight in the profile tab and we will chart the recent movement here.'
                : '프로필 탭에서 몸무게를 기록하면 최근 변화가 여기 표시돼요.'}
            </p>
          </div>
        )}
      </section>

      <section className="record-health-grid compact">
        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Latest' : '최근'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Latest Workout' : '최근 운동'}</h2>
            </div>
            <span className="workout-mark">{getWorkoutMark(stats.lastWorkoutType)}</span>
          </div>

          <div className="record-highlight-block compact">
            <strong className="record-highlight-title">{latestWorkoutName}</strong>
            <p className="record-highlight-meta">{latestWorkoutMeta}</p>
          </div>
        </section>

        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Badges' : '배지'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Unlocked' : '획득 배지'}</h2>
            </div>
            <span className="community-mini-pill accent">{badges.length}</span>
          </div>

          <div className="badge-row record-badge-row compact">
            {badges.map((badge) => (
              <span key={badge} className="badge-pill profile-badge">{getBadgeLabel(badge, language)}</span>
            ))}
          </div>
        </section>
      </section>

      <section className="card record-module-card compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Pattern' : '패턴'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Workout Types' : '운동 종류별 기록'}</h2>
          </div>
          <span className="community-mini-pill">{stats.typeCounts?.length ?? 0}</span>
        </div>

        <div className="type-stats-list compact">
          {stats.typeCounts?.length ? (
            stats.typeCounts.map((item) => (
              <article key={item.type} className="type-stat-card record-type-card compact">
                <div className="type-stat-copy">
                  <div className="type-stat-title-row">
                    <span className="workout-mark">{getWorkoutMark(item.type)}</span>
                    <strong>{getWorkoutTypeLabel(item.type, language)}</strong>
                  </div>
                  <span>{isEnglish ? `${item.count}x` : `${item.count}회`}</span>
                </div>
                <div className="type-stat-bar">
                  <div className="type-stat-fill" style={{ width: `${Math.max((item.count / maxCount) * 100, 18)}%` }} />
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state-card cool">
              <span className="empty-state-badge">{isEnglish ? 'Pattern' : '패턴 준비 중'}</span>
              <strong>{isEnglish ? 'Workout patterns will build here.' : '운동 패턴이 여기에 쌓일 거예요.'}</strong>
              <p>
                {isEnglish
                  ? 'As you log more workouts, your favorite types and rhythm will become easier to spot.'
                  : '운동 기록이 쌓일수록 자주 하는 운동과 리듬이 더 분명해져요.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
