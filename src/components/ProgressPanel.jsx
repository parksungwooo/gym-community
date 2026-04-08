import { getBadgeLabel, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getActivityEventMeta } from '../utils/activityLevel'
import { getBmiCategory } from '../utils/bodyMetrics'
import { localizeLevelText } from '../utils/level'

function formatDate(date, language) {
  if (!date) {
    return language === 'en' ? 'No record' : '기록 없음'
  }

  return new Date(date).toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

function getWorkoutMark(type) {
  const normalized = String(type ?? '').toLowerCase()

  if (normalized.includes('러닝') || normalized.includes('run')) return 'RN'
  if (normalized.includes('웨이트') || normalized.includes('weight')) return 'WT'
  if (normalized.includes('스트레칭') || normalized.includes('stretch')) return 'ST'
  if (normalized.includes('요가') || normalized.includes('yoga')) return 'YG'
  if (normalized.includes('필라테스') || normalized.includes('pilates')) return 'PL'
  if (normalized.includes('사이클') || normalized.includes('cycle') || normalized.includes('bike')) return 'CY'
  if (normalized.includes('체력') || normalized.includes('quick')) return 'QC'

  return 'ET'
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
  if (value == null) return '--'
  if (value === 0) return isEnglish ? 'No change' : '변화 없음'
  return `${value > 0 ? '+' : ''}${value} kg`
}

function formatCalories(value, isEnglish) {
  if (value == null) return '--'
  return isEnglish ? `~${value} kcal` : `약 ${value}kcal`
}

function getHeroCopy(weeklyCount, weeklyGoal, isEnglish) {
  if (weeklyCount >= weeklyGoal) {
    return {
      title: isEnglish ? 'Weekly goal done.' : '주간 목표 완료',
      body: isEnglish ? 'You hit the pace.' : '이번 주 페이스를 채웠어요.',
    }
  }

  if (weeklyCount > 0) {
    return {
      title: isEnglish ? 'Your rhythm is showing.' : '이번 주 흐름이 보여요.',
      body: isEnglish ? 'Logs, streak, and level together.' : '기록, 연속, 레벨을 같이 봐요.',
    }
  }

  return {
    title: isEnglish ? 'The first log starts here.' : '첫 기록부터 시작해요.',
    body: isEnglish ? 'One workout opens the page.' : '운동 한 번이면 이 화면이 채워져요.',
  }
}

function getGoalMeta(targetDeltaKg, isEnglish) {
  if (targetDeltaKg == null) {
    return isEnglish ? 'Set a goal first.' : '목표를 정하면 보여요.'
  }

  if (targetDeltaKg === 0) {
    return isEnglish ? 'Goal reached.' : '목표 달성'
  }

  if (targetDeltaKg > 0) {
    return isEnglish ? `${targetDeltaKg} kg left.` : `${targetDeltaKg}kg 남음`
  }

  return isEnglish ? `${Math.abs(targetDeltaKg)} kg past.` : `${Math.abs(targetDeltaKg)}kg 초과`
}

export default function ProgressPanel({
  stats,
  latestResult,
  badges,
  weeklyGoal = 4,
  bodyMetrics,
  activitySummary,
  achievementBadges = [],
  recentActivityEvents = [],
}) {
  const { language, isEnglish } = useI18n()
  const safeTypeCounts = stats.typeCounts ?? []
  const maxCount = Math.max(...safeTypeCounts.map((item) => item.count), 1)
  const visibleActivityEvents = recentActivityEvents.slice(0, 4)
  const visibleBadges = achievementBadges.length
    ? achievementBadges.map((item) => item.badge_key)
    : badges
  const latestWorkoutName = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : (isEnglish ? 'No workout yet' : '아직 기록 없음')
  const heroCopy = getHeroCopy(stats.weeklyCount ?? 0, weeklyGoal, isEnglish)

  const latestWorkoutMetaParts = [
    stats.lastWorkoutDuration
      ? (isEnglish ? `${stats.lastWorkoutDuration} min` : `${stats.lastWorkoutDuration}분`)
      : null,
    stats.lastWorkoutCalories != null ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
  ].filter(Boolean)

  const latestWorkoutMeta = latestWorkoutMetaParts.length
    ? latestWorkoutMetaParts.join(' · ')
    : stats.lastWorkoutNote || (isEnglish ? 'Time not saved yet.' : '시간 기록 없음')

  const trendPoints = bodyMetrics?.history?.slice(-6) ?? []
  const weightValues = trendPoints.map((item) => item.weightKg)
  const maxWeight = weightValues.length ? Math.max(...weightValues) : 0
  const minWeight = weightValues.length ? Math.min(...weightValues) : 0
  const range = maxWeight - minWeight || 1
  const weeklyCount = stats.weeklyCount ?? 0
  const lastWorkoutDateLabel = stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate, language) : '--'
  const levelMeta = latestResult
    ? (isEnglish ? `${latestResult.score} pts` : `${latestResult.score}점`)
    : (isEnglish ? 'Test pending' : '테스트 전')
  const bmiMeta = bodyMetrics?.bmi != null
    ? `${getBmiCategory(bodyMetrics.bmi, isEnglish)} · ${bodyMetrics.heightCm}cm / ${bodyMetrics.latestWeightKg}kg`
    : (isEnglish ? 'Add height and weight.' : '키와 체중을 입력해요.')
  const trendMeta = isEnglish
    ? `Prev ${formatWeightChange(bodyMetrics?.changeFromPreviousKg, isEnglish)} · First ${formatWeightChange(bodyMetrics?.changeFromStartKg, isEnglish)}`
    : `직전 ${formatWeightChange(bodyMetrics?.changeFromPreviousKg, isEnglish)} · 처음 ${formatWeightChange(bodyMetrics?.changeFromStartKg, isEnglish)}`

  return (
    <section className="record-health-screen compact-record-screen">
      <section className="card record-health-hero compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'This week' : '이번 주'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Summary' : '요약'}</h2>
          </div>
          <span className="community-mini-pill">{`${weeklyCount}/${weeklyGoal}`}</span>
        </div>

        <div className="record-health-headline compact">
          <strong>{heroCopy.title}</strong>
          <p className="subtext compact">{heroCopy.body}</p>
        </div>

        <div className="health-stat-grid compact">
          <HealthStatTile
            label={isEnglish ? 'Today' : '오늘'}
            value={isEnglish ? `${stats.todayCount ?? 0} logs` : `${stats.todayCount ?? 0}개`}
            meta={formatCalories(stats.todayCalories, isEnglish)}
            tone="cool"
          />
          <HealthStatTile
            label={isEnglish ? 'Streak' : '연속'}
            value={isEnglish ? `${stats.streak ?? 0} days` : `${stats.streak ?? 0}일`}
            meta={isEnglish ? `Last ${lastWorkoutDateLabel}` : `마지막 ${lastWorkoutDateLabel}`}
            tone="warm"
          />
          <HealthStatTile
            label={isEnglish ? 'Level' : '레벨'}
            value={latestResult ? localizeLevelText(latestResult.level, language) : (isEnglish ? 'Not tested' : '미측정')}
            meta={levelMeta}
          />
        </div>
      </section>

      <section className="record-health-grid compact">
        <section className="card record-module-card compact activity-card">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">XP</span>
              <h2 className="app-section-title small">{isEnglish ? 'Activity XP' : '활동 XP'}</h2>
            </div>
            <span className="community-mini-pill accent">{`${activitySummary?.totalXp ?? 0} XP`}</span>
          </div>
          <div className="health-stat-grid compact">
            <HealthStatTile
              label={isEnglish ? 'Board' : '보드'}
              value={String(activitySummary?.weeklyPoints ?? 0)}
              meta={isEnglish ? 'This week' : '이번 주'}
              tone="cool"
            />
            <HealthStatTile
              label={isEnglish ? 'Today' : '오늘'}
              value={`${activitySummary?.todayXp ?? 0} XP`}
              meta={isEnglish ? 'Earned' : '획득'}
              tone="warm"
            />
            <HealthStatTile
              label={isEnglish ? 'Level' : '레벨'}
              value={`Lv ${activitySummary?.levelValue ?? 1}`}
              meta={activitySummary?.nextLevelValue
                ? (isEnglish ? `Next ${activitySummary?.remainingXp ?? 0} XP` : `다음 ${activitySummary?.remainingXp ?? 0} XP`)
                : (isEnglish ? 'Max' : '최고')}
            />
          </div>
          <div className="goal-progress-block">
            <div className="goal-progress-bar activity-progress-bar">
              <div
                className="goal-progress-fill activity-progress-fill"
                style={{ width: `${activitySummary?.progressPercent ?? 0}%` }}
              />
            </div>
            <p className="record-highlight-meta">
              {achievementBadges.length
                ? (isEnglish ? `${achievementBadges.length} badges` : `배지 ${achievementBadges.length}개`)
                : (isEnglish ? 'Badges open as you log.' : '기록이 쌓이면 배지가 열려요.')}
            </p>
          </div>
        </section>

        <section className="card record-module-card compact activity-card">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Recent' : '최근'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Recent XP' : '최근 XP'}</h2>
            </div>
            <span className="community-mini-pill">{visibleActivityEvents.length}</span>
          </div>
          {visibleActivityEvents.length ? (
            <div className="activity-event-list">
              {visibleActivityEvents.map((event) => {
                const eventMeta = getActivityEventMeta(event, language)
                return (
                  <article key={event.id} className="activity-event-item">
                    <div className="activity-event-copy">
                      <strong>{eventMeta.label}</strong>
                      <span>{eventMeta.description}</span>
                    </div>
                    <div className="activity-event-score">
                      <strong>{`+${event.xp_amount} XP`}</strong>
                      <span>{event.weekly_points ? `+${event.weekly_points}P` : '-'}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state-card cool">
              <span className="empty-state-badge">XP</span>
              <strong>{isEnglish ? 'No recent XP yet.' : '최근 XP가 아직 없어요.'}</strong>
              <p>{isEnglish ? 'Logs and tests fill this.' : '기록과 테스트가 쌓이면 보여요.'}</p>
            </div>
          )}
        </section>
      </section>

      <section className="record-health-grid compact">
        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Calories' : '칼로리'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Burn' : '소모량'}</h2>
            </div>
          </div>
          <div className="health-stat-grid compact">
            <HealthStatTile
              label={isEnglish ? 'Today' : '오늘'}
              value={formatCalories(stats.todayCalories, isEnglish)}
              meta={isEnglish ? 'Saved logs' : '기록 기준'}
              tone="cool"
            />
            <HealthStatTile
              label={isEnglish ? 'Week' : '주간'}
              value={formatCalories(stats.weeklyCalories, isEnglish)}
              meta={isEnglish ? `${weeklyCount} logs` : `${weeklyCount}개`}
              tone="warm"
            />
            <HealthStatTile
              label={isEnglish ? 'Total' : '누적'}
              value={formatCalories(stats.totalCalories, isEnglish)}
              meta={isEnglish ? 'All logs' : '전체 기록'}
            />
          </div>
        </section>

        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Body' : '몸'}</span>
              <h2 className="app-section-title small">BMI</h2>
            </div>
          </div>
          <div className="record-highlight-block compact">
            <strong className="record-highlight-title">
              {bodyMetrics?.bmi != null ? bodyMetrics.bmi : '--'}
            </strong>
            <p className="record-highlight-meta">{bmiMeta}</p>
          </div>
        </section>
      </section>

      <section className="record-health-grid compact body-metrics-grid">
        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Goal' : '목표'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Progress' : '진행'}</h2>
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
            <p className="record-highlight-meta">{getGoalMeta(bodyMetrics?.targetDeltaKg, isEnglish)}</p>
          </div>
        </section>

        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Latest' : '최근'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Workout' : '최근 운동'}</h2>
            </div>
            <span className="workout-mark">{getWorkoutMark(stats.lastWorkoutType)}</span>
          </div>

          <div className="record-highlight-block compact">
            <strong className="record-highlight-title">{latestWorkoutName}</strong>
            <p className="record-highlight-meta">{latestWorkoutMeta}</p>
          </div>
        </section>
      </section>

      <section className="card record-module-card compact">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Trend' : '추이'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Weight trend' : '체중 추이'}</h2>
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
            <p className="record-highlight-meta">{trendMeta}</p>
          </div>
        ) : (
          <div className="empty-state-card cool">
            <span className="empty-state-badge">{isEnglish ? 'Weight' : '체중'}</span>
            <strong>{isEnglish ? 'The first entry starts this.' : '첫 체중부터 시작돼요.'}</strong>
            <p>{isEnglish ? 'Log it in Profile.' : '프로필에서 기록해요.'}</p>
          </div>
        )}
      </section>

      <section className="record-health-grid compact">
        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Badges' : '배지'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Unlocked' : '획득'}</h2>
            </div>
            <span className="community-mini-pill accent">{visibleBadges.length}</span>
          </div>

          {visibleBadges.length ? (
            <div className="badge-row record-badge-row compact">
              {visibleBadges.map((badge) => (
                <span key={badge} className="badge-pill profile-badge">{getBadgeLabel(badge, language)}</span>
              ))}
            </div>
          ) : (
            <div className="empty-state-card cool">
              <span className="empty-state-badge">{isEnglish ? 'Badge' : '배지'}</span>
              <strong>{isEnglish ? 'No badges yet.' : '아직 배지가 없어요.'}</strong>
              <p>{isEnglish ? 'They unlock as you log.' : '기록이 쌓이면 열려요.'}</p>
            </div>
          )}
        </section>

        <section className="card record-module-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{isEnglish ? 'Pattern' : '패턴'}</span>
              <h2 className="app-section-title small">{isEnglish ? 'Types' : '운동 종류'}</h2>
            </div>
            <span className="community-mini-pill">{safeTypeCounts.length}</span>
          </div>

          <div className="type-stats-list compact">
            {safeTypeCounts.length ? (
              safeTypeCounts.map((item) => (
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
                <span className="empty-state-badge">{isEnglish ? 'Pattern' : '패턴'}</span>
                <strong>{isEnglish ? 'Patterns build here.' : '패턴이 여기에 쌓여요.'}</strong>
                <p>{isEnglish ? 'More logs make it clearer.' : '기록이 늘수록 더 또렷해져요.'}</p>
              </div>
            )}
          </div>
        </section>
      </section>
    </section>
  )
}
