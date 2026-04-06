import { getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getBmiCategory } from '../utils/bodyMetrics'
import { localizeLevelText } from '../utils/level'

function HomeStatPill({ label, value }) {
  return (
    <article className="home-stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function formatRoutineSummary(routine, language, isEnglish) {
  const parts = [getWorkoutTypeLabel(routine.workout_type, language)]

  if (routine.duration_minutes) {
    parts.push(isEnglish ? `${routine.duration_minutes} min` : `${routine.duration_minutes}분`)
  }

  return parts.join(' · ')
}

function RoutineStartCard({ routine, onStart }) {
  const { language, isEnglish } = useI18n()

  return (
    <button type="button" className="routine-start-card" onClick={() => onStart(routine)}>
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
  routineTemplates = [],
  workoutLoading,
  onOpenWorkoutComposer,
  onStartRoutine,
  onOpenTest,
}) {
  const { isEnglish, language } = useI18n()
  const nickname = profile?.display_name?.trim()
  const topRoutines = routineTemplates.slice(0, 2)
  const currentLevelLabel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : (isEnglish ? 'Not tested' : '아직 측정 전')

  const heroTitle = todayDone
    ? (isEnglish ? 'Today is already logged.' : '오늘 운동은 이미 기록했어요.')
    : (isEnglish ? 'Log one workout for today.' : '오늘 운동 하나만 기록해볼까요?')

  const heroDetail = topRoutines.length > 0
    ? (isEnglish
        ? 'Start from a recent routine or open the workout sheet.'
        : '최근 루틴으로 바로 시작하거나 운동 시트를 열어 기록할 수 있어요.')
    : (isEnglish
        ? 'You only need workout type and time to get started.'
        : '운동 종류와 시간만 입력하면 바로 시작할 수 있어요.')

  const heroDescription = nickname
    ? (isEnglish ? `${nickname}, keep today simple and get one log in.` : `${nickname}님, 오늘은 가볍게 한 번만 기록해도 충분해요.`)
    : heroDetail

  const weeklySummary = isEnglish
    ? `${challenge.current}/${challenge.goal} this week`
    : `이번 주 ${challenge.current}/${challenge.goal}`

  const todaySummary = isEnglish ? `${stats.todayCount} logs` : `${stats.todayCount}개`
  const latestWeightSummary = bodyMetrics?.latestWeightKg != null
    ? `${bodyMetrics.latestWeightKg} kg`
    : (isEnglish ? 'No weight yet' : '체중 기록 없음')
  const bmiSummary = bodyMetrics?.bmi != null
    ? `${bodyMetrics.bmi} BMI`
    : (isEnglish ? 'BMI pending' : 'BMI 대기 중')
  const goalSummary = bodyMetrics?.targetDeltaKg != null
    ? bodyMetrics.targetDeltaKg === 0
      ? (isEnglish ? 'Goal reached' : '목표 달성')
      : bodyMetrics.targetDeltaKg > 0
        ? (isEnglish ? `${bodyMetrics.targetDeltaKg} kg to lose` : `${bodyMetrics.targetDeltaKg}kg 감량`)
        : (isEnglish ? `${Math.abs(bodyMetrics.targetDeltaKg)} kg above goal gain` : `${Math.abs(bodyMetrics.targetDeltaKg)}kg 증량`)
    : (isEnglish ? 'Set target weight' : '목표 체중 설정')

  const lastWorkoutSummary = stats.lastWorkoutType
    ? getWorkoutTypeLabel(stats.lastWorkoutType, language)
    : (isEnglish ? 'None yet' : '아직 없음')

  return (
    <section className="home-dashboard-app streamlined-home">
      <section className="card home-focus-card">
        <div className="home-focus-copy">
          <span className="app-section-kicker">{isEnglish ? 'Today' : '오늘'}</span>
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
              ? (isEnglish ? 'Opening...' : '열고 있어요...')
              : todayDone
                ? (isEnglish ? 'Log One More Workout' : '운동 하나 더 기록')
                : (isEnglish ? "Log Today's Workout" : '오늘 운동 기록')}
          </button>

          {!currentLevel && (
            <button type="button" className="ghost-btn home-focus-secondary" onClick={onOpenTest}>
              {isEnglish ? 'Take Level Test First' : '먼저 레벨 테스트'}
            </button>
          )}
        </div>

        <div className="home-stat-strip">
          <HomeStatPill label={isEnglish ? 'Today' : '오늘'} value={todaySummary} />
          <HomeStatPill label={isEnglish ? 'Goal' : '목표'} value={weeklySummary} />
          <HomeStatPill label={isEnglish ? 'Level' : '레벨'} value={currentLevelLabel} />
        </div>
      </section>

      <section className="card home-routine-card">
        <div className="home-module-heading">
          <div>
            <span className="app-section-kicker">{isEnglish ? 'Recent Routines' : '최근 루틴'}</span>
            <h3>{isEnglish ? 'Start from what you already repeat' : '자주 하는 흐름으로 바로 시작'}</h3>
          </div>
          <span className="home-module-meta">
            {topRoutines.length > 0
              ? (isEnglish ? `${topRoutines.length} ready` : `${topRoutines.length}개 준비됨`)
              : (isEnglish ? 'Save one to unlock' : '루틴을 저장하면 여기에 보여요')}
          </span>
        </div>

        {topRoutines.length > 0 ? (
          <div className="home-routine-list">
            {topRoutines.map((routine) => (
              <RoutineStartCard key={routine.id} routine={routine} onStart={onStartRoutine} />
            ))}
          </div>
        ) : (
          <div className="home-routine-empty">
            <strong>{isEnglish ? 'No saved routine yet' : '저장된 루틴이 아직 없어요'}</strong>
            <p>
              {isEnglish
                ? 'Save one after your first workout so the next start becomes one tap.'
                : '첫 운동을 기록한 뒤 루틴으로 저장해두면 다음부터는 한 번에 시작할 수 있어요.'}
            </p>
          </div>
        )}
      </section>

      <section className="card home-context-card">
        <div className="home-context-row">
          <div className="home-context-block">
            <span>{isEnglish ? 'Latest workout' : '최근 운동'}</span>
            <strong>{lastWorkoutSummary}</strong>
          </div>
          <div className="home-context-block">
            <span>{isEnglish ? 'This week' : '이번 주'}</span>
            <strong>{weeklySummary}</strong>
          </div>
        </div>

        <div className="home-context-row body">
          <div className="home-context-block">
            <span>{isEnglish ? 'Latest weight' : '최신 체중'}</span>
            <strong>{latestWeightSummary}</strong>
          </div>
          <div className="home-context-block">
            <span>{isEnglish ? 'BMI' : 'BMI'}</span>
            <strong>{bmiSummary}</strong>
          </div>
        </div>

        <div className="home-body-goal-callout">
          <span>{isEnglish ? 'Body goal' : '체중 목표'}</span>
          <strong>{goalSummary}</strong>
          <p>{bodyMetrics?.bmi != null ? getBmiCategory(bodyMetrics.bmi, isEnglish) : (isEnglish ? 'Add height and target weight in profile.' : '프로필에서 키와 목표 체중을 입력해보세요.')}</p>
        </div>
      </section>
    </section>
  )
}
