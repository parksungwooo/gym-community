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

function SectionHeader({ eyebrow, title, badge, accent = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="grid gap-1">
        <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{eyebrow}</span>
        <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{title}</h2>
      </div>
      {badge != null ? (
        <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${accent ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
          {badge}
        </span>
      ) : null}
    </div>
  )
}

function WorkoutMark({ type }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-700 text-xs font-black text-white shadow-sm">
      {getWorkoutMark(type)}
    </span>
  )
}

function HealthStatTile({ label, value, meta, tone = 'default' }) {
  const toneClass = {
    cool: 'bg-cyan-50 dark:bg-cyan-500/15',
    warm: 'bg-amber-50 dark:bg-amber-500/15',
    default: 'bg-gray-50 dark:bg-white/10',
  }[tone]

  return (
    <article className={`rounded-2xl p-4 ${toneClass}`}>
      <span className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200">{label}</span>
      <strong className="mt-1 block text-lg font-black text-gray-950 dark:text-white">{value}</strong>
      <span className="mt-1 block text-xs font-bold text-gray-700 dark:text-gray-200">{meta}</span>
    </article>
  )
}

function EmptyState({ label, title, body }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
      <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{label}</span>
      <strong className="text-lg font-black text-gray-950 dark:text-white">{title}</strong>
      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{body}</p>
    </div>
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
      title: isEnglish ? 'Weekly goal done.' : '이번 주 성공',
      body: isEnglish ? 'Keep the pace.' : '이 페이스 그대로 가요.',
    }
  }

  if (weeklyCount > 0) {
    return {
      title: isEnglish ? 'Your rhythm is showing.' : '리듬이 살아났어요.',
      body: isEnglish ? 'Logs, streak, level.' : '기록, 스트릭, 레벨을 한눈에.',
    }
  }

  return {
    title: isEnglish ? 'Start with one log.' : '첫 기록부터 가요.',
    body: isEnglish ? 'One workout wakes this up.' : '운동 하나면 화면이 살아나요.',
  }
}

function getGoalMeta(targetDeltaKg, isEnglish) {
  if (targetDeltaKg == null) {
    return isEnglish ? 'Set a goal first.' : '목표를 정해볼까요?'
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
    : (badges ?? [])
  const latestWorkoutName = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : (isEnglish ? 'No workout yet' : '기록 없음')
  const heroCopy = getHeroCopy(stats.weeklyCount ?? 0, weeklyGoal, isEnglish)

  const latestWorkoutMetaParts = [
    stats.lastWorkoutDuration
      ? (isEnglish ? `${stats.lastWorkoutDuration} min` : `${stats.lastWorkoutDuration}분`)
      : null,
    stats.lastWorkoutCalories != null ? formatCalories(stats.lastWorkoutCalories, isEnglish) : null,
  ].filter(Boolean)

  const latestWorkoutMeta = latestWorkoutMetaParts.length
    ? latestWorkoutMetaParts.join(' · ')
    : stats.lastWorkoutNote || (isEnglish ? 'Time not saved yet.' : '시간 없음')

  const trendPoints = bodyMetrics?.history?.slice(-6) ?? []
  const weightValues = trendPoints.map((item) => item.weightKg)
  const maxWeight = weightValues.length ? Math.max(...weightValues) : 0
  const minWeight = weightValues.length ? Math.min(...weightValues) : 0
  const range = maxWeight - minWeight || 1
  const weeklyCount = stats.weeklyCount ?? 0
  const lastWorkoutDateLabel = stats.lastWorkoutDate ? formatDate(stats.lastWorkoutDate, language) : '--'
  const levelMeta = latestResult
    ? (isEnglish ? `${latestResult.score} pts` : `${latestResult.score}점`)
    : (isEnglish ? 'Test pending' : '레벨 미정')
  const bmiMeta = bodyMetrics?.bmi != null
    ? `${getBmiCategory(bodyMetrics.bmi, isEnglish)} · ${bodyMetrics.heightCm}cm / ${bodyMetrics.latestWeightKg}kg`
    : (isEnglish ? 'Add height and weight.' : '키와 체중을 입력해요.')
  const trendMeta = isEnglish
    ? `Prev ${formatWeightChange(bodyMetrics?.changeFromPreviousKg, isEnglish)} · First ${formatWeightChange(bodyMetrics?.changeFromStartKg, isEnglish)}`
    : `직전 ${formatWeightChange(bodyMetrics?.changeFromPreviousKg, isEnglish)} · 처음 ${formatWeightChange(bodyMetrics?.changeFromStartKg, isEnglish)}`

  return (
    <section className="grid gap-6">
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'This week' : '이번 주'} title={isEnglish ? 'My pace' : '내 페이스'} badge={`${weeklyCount}/${weeklyGoal}`} />

        <div className="grid gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
          <strong className="text-xl font-black leading-7 text-gray-950 dark:text-white">{heroCopy.title}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{heroCopy.body}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <HealthStatTile
            label={isEnglish ? 'Today' : '오늘'}
            value={isEnglish ? `${stats.todayCount ?? 0} logs` : `${stats.todayCount ?? 0}개`}
            meta={formatCalories(stats.todayCalories, isEnglish)}
            tone="cool"
          />
          <HealthStatTile
            label={isEnglish ? 'Streak' : '연속'}
            value={isEnglish ? `${stats.streak ?? 0} days` : `${stats.streak ?? 0}일`}
            meta={isEnglish ? `Last ${lastWorkoutDateLabel}` : `${lastWorkoutDateLabel} 마지막`}
            tone="warm"
          />
          <HealthStatTile
            label={isEnglish ? 'Level' : '레벨'}
            value={latestResult ? localizeLevelText(latestResult.level, language) : (isEnglish ? 'Not tested' : '미측정')}
            meta={levelMeta}
          />
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow="XP" title={isEnglish ? 'Activity XP' : '활동 XP'} badge={`${activitySummary?.totalXp ?? 0} XP`} accent />

          <div className="grid gap-3">
            <HealthStatTile label={isEnglish ? 'Board' : '보드'} value={String(activitySummary?.weeklyPoints ?? 0)} meta={isEnglish ? 'This week' : '이번 주'} tone="cool" />
            <HealthStatTile label={isEnglish ? 'Today' : '오늘'} value={`${activitySummary?.todayXp ?? 0} XP`} meta={isEnglish ? 'Earned' : '획득'} tone="warm" />
            <HealthStatTile
              label={isEnglish ? 'Level' : '레벨'}
              value={`Lv ${activitySummary?.levelValue ?? 1}`}
              meta={activitySummary?.nextLevelValue
                ? (isEnglish ? `Next ${activitySummary?.remainingXp ?? 0} XP` : `다음 ${activitySummary?.remainingXp ?? 0} XP`)
                : (isEnglish ? 'Max' : '최고')}
            />
          </div>

          <div className="grid gap-3">
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-emerald-700" style={{ width: `${activitySummary?.progressPercent ?? 0}%` }} />
            </div>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {achievementBadges.length
                ? (isEnglish ? `${achievementBadges.length} badges` : `배지 ${achievementBadges.length}개`)
                : (isEnglish ? 'Badges unlock as you log.' : '기록하면 배지가 열려요.')}
            </p>
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Recent' : '최근'} title={isEnglish ? 'Recent XP' : '최근 XP'} badge={visibleActivityEvents.length} />

          {visibleActivityEvents.length ? (
            <div className="grid gap-3">
              {visibleActivityEvents.map((event) => {
                const eventMeta = getActivityEventMeta(event, language)
                return (
                  <article key={event.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
                    <div className="grid gap-1">
                      <strong className="text-sm font-black text-gray-950 dark:text-white">{eventMeta.label}</strong>
                      <span className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{eventMeta.description}</span>
                    </div>
                    <div className="grid justify-items-end gap-1 text-right">
                      <strong className="text-sm font-black text-emerald-800 dark:text-emerald-200">{`+${event.xp_amount} XP`}</strong>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{event.weekly_points ? `+${event.weekly_points}P` : '-'}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <EmptyState label="XP" title={isEnglish ? 'No XP yet.' : '아직 XP가 없어요.'} body={isEnglish ? 'Log one workout.' : '운동 하나면 바로 쌓여요.'} />
          )}
        </section>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Calories' : '칼로리'} title={isEnglish ? 'Burn' : '태운 만큼'} />
          <div className="grid gap-3">
            <HealthStatTile label={isEnglish ? 'Today' : '오늘'} value={formatCalories(stats.todayCalories, isEnglish)} meta={isEnglish ? 'Saved logs' : '오늘 기록'} tone="cool" />
            <HealthStatTile label={isEnglish ? 'Week' : '주간'} value={formatCalories(stats.weeklyCalories, isEnglish)} meta={isEnglish ? `${weeklyCount} logs` : `${weeklyCount}개`} tone="warm" />
            <HealthStatTile label={isEnglish ? 'Total' : '누적'} value={formatCalories(stats.totalCalories, isEnglish)} meta={isEnglish ? 'All logs' : '누적 기록'} />
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Body' : '몸'} title="BMI" />
          <div className="grid gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <strong className="text-4xl font-black leading-none text-gray-950 dark:text-white">{bodyMetrics?.bmi != null ? bodyMetrics.bmi : '--'}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{bmiMeta}</p>
          </div>
        </section>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Goal' : '목표'} title={isEnglish ? 'Progress' : '진행'} badge={bodyMetrics?.goalProgressPercent != null ? `${bodyMetrics.goalProgressPercent}%` : '--'} accent />
          <div className="grid gap-3">
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-emerald-700" style={{ width: `${bodyMetrics?.goalProgressPercent ?? 0}%` }} />
            </div>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{getGoalMeta(bodyMetrics?.targetDeltaKg, isEnglish)}</p>
          </div>
        </section>

        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Latest' : '최근'} title={isEnglish ? 'Last workout' : '마지막 운동'} />
          <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <WorkoutMark type={stats.lastWorkoutType} />
            <div className="grid gap-1">
              <strong className="text-xl font-black leading-7 text-gray-950 dark:text-white">{latestWorkoutName}</strong>
              <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{latestWorkoutMeta}</p>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <SectionHeader eyebrow={isEnglish ? 'Trend' : '추이'} title={isEnglish ? 'Weight trend' : '체중 추이'} badge={bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'} />

        {trendPoints.length ? (
          <div className="grid gap-4">
            <div className="grid grid-cols-6 items-end gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
              {trendPoints.map((point) => {
                const heightPercent = ((point.weightKg - minWeight) / range) * 100
                return (
                  <div key={point.id} className="grid gap-2 text-center">
                    <div className="flex h-28 items-end justify-center rounded-xl bg-white p-1 dark:bg-neutral-950">
                      <span className="w-full rounded-lg bg-emerald-700" style={{ height: `${Math.max(heightPercent, 12)}%` }} />
                    </div>
                    <strong className="text-xs font-black text-gray-950 dark:text-white">{point.weightKg}</strong>
                    <small className="text-xs font-bold text-gray-700 dark:text-gray-200">{formatDate(point.recordedAt, language)}</small>
                  </div>
                )
              })}
            </div>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{trendMeta}</p>
          </div>
        ) : (
          <EmptyState label={isEnglish ? 'Weight' : '체중'} title={isEnglish ? 'Add your first weight.' : '첫 체중을 남겨요.'} body={isEnglish ? 'Use Profile.' : '프로필에서 바로 기록해요.'} />
        )}
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Badges' : '배지'} title={isEnglish ? 'Unlocked' : '열린 배지'} badge={visibleBadges.length} accent />

          {visibleBadges.length ? (
            <div className="flex flex-wrap gap-2">
              {visibleBadges.map((badge) => (
                <span key={badge} className="rounded-full bg-gray-100 px-3 py-2 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{getBadgeLabel(badge, language)}</span>
              ))}
            </div>
          ) : (
            <EmptyState label={isEnglish ? 'Badge' : '배지'} title={isEnglish ? 'No badges yet.' : '아직 배지가 없어요.'} body={isEnglish ? 'Log to unlock.' : '기록하면 하나씩 열려요.'} />
          )}
        </section>

        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <SectionHeader eyebrow={isEnglish ? 'Pattern' : '패턴'} title={isEnglish ? 'Workout mix' : '운동 취향'} badge={safeTypeCounts.length} />

          {safeTypeCounts.length ? (
            <div className="grid gap-3">
              {safeTypeCounts.map((item) => (
                <article key={item.type} className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <WorkoutMark type={item.type} />
                      <strong className="truncate text-base font-black text-gray-950 dark:text-white">{getWorkoutTypeLabel(item.type, language)}</strong>
                    </div>
                    <span className="text-sm font-black text-gray-700 dark:text-gray-200">{isEnglish ? `${item.count}x` : `${item.count}회`}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max((item.count / maxCount) * 100, 18)}%` }} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState label={isEnglish ? 'Pattern' : '패턴'} title={isEnglish ? 'Patterns start soon.' : '패턴은 곧 보여요.'} body={isEnglish ? 'More logs make it clear.' : '기록할수록 선명해져요.'} />
          )}
        </section>
      </section>
    </section>
  )
}
