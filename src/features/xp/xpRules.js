export const XP_RULE_TYPES = Object.freeze({
  WORKOUT_BASE: 'workout_base',
  FIRST_RECORD: 'first_record',
  STREAK: 'streak',
  DAILY_MISSION: 'daily_mission',
  WEEKLY_GOAL: 'weekly_goal',
  LEAGUE: 'league',
  LEVEL_UP: 'level_up',
})

export const PRO_LEAGUE_REWARD_MULTIPLIER = 1.5

const XP_RULE_LABELS = {
  [XP_RULE_TYPES.WORKOUT_BASE]: { ko: '기본 기록', en: 'Base log' },
  [XP_RULE_TYPES.FIRST_RECORD]: { ko: '첫 기록', en: 'First log' },
  [XP_RULE_TYPES.STREAK]: { ko: '스트릭', en: 'Streak' },
  [XP_RULE_TYPES.DAILY_MISSION]: { ko: '오늘 미션', en: 'Daily quest' },
  [XP_RULE_TYPES.WEEKLY_GOAL]: { ko: '주간 목표', en: 'Weekly goal' },
  [XP_RULE_TYPES.LEAGUE]: { ko: '리그', en: 'League' },
  [XP_RULE_TYPES.LEVEL_UP]: { ko: '레벨업', en: 'Level up' },
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

function normalizeWorkoutType(workoutType = '') {
  return String(workoutType).trim().toLowerCase()
}

function getWorkoutTypeModifier(workoutType) {
  const normalizedType = normalizeWorkoutType(workoutType)

  if (normalizedType.includes('웨이트') || normalizedType.includes('strength')) return 1.12
  if (normalizedType.includes('러닝') || normalizedType.includes('run')) return 1.08
  if (normalizedType.includes('사이클') || normalizedType.includes('cycle')) return 1.06
  if (normalizedType.includes('요가') || normalizedType.includes('스트레칭') || normalizedType.includes('mobility')) return 0.92

  return 1
}

function addBreakdownItem(breakdown, type, amount) {
  const safeAmount = Math.round(toNumber(amount))

  if (safeAmount <= 0) return

  breakdown.push({ type, amount: safeAmount })
}

export function calculateWorkoutBaseXP({
  workoutType,
  durationMinutes = 0,
  sets = 1,
  loadKg = 0,
  levelValue = 1,
} = {}) {
  const duration = clamp(toNumber(durationMinutes), 0, 240)
  const setCount = clamp(toNumber(sets, 1), 1, 30)
  const load = clamp(toNumber(loadKg), 0, 500)
  const level = clamp(toNumber(levelValue, 1), 1, 50)
  const typeModifier = getWorkoutTypeModifier(workoutType)
  const levelModifier = 1 + Math.min((level - 1) * 0.025, 0.18)
  const durationXP = duration * 0.78
  const setXP = setCount * 2.4
  const loadXP = load * 0.06

  return clamp(Math.round((durationXP + setXP + loadXP) * typeModifier * levelModifier), 10, 90)
}

export function calculateStreakBonus(streakCount = 0) {
  const streak = Math.max(0, Math.floor(toNumber(streakCount)))

  if (streak >= 30) return 60
  if (streak >= 14) return 40
  if (streak >= 7) return 25
  if (streak >= 3) return 15
  if (streak >= 1) return 8

  return 0
}

export function calculateWeeklyGoalBonus({ todayDone = false, weeklyCount = 0, weeklyGoal = 4 } = {}) {
  const count = Math.max(0, Math.floor(toNumber(weeklyCount)))
  const goal = Math.max(1, Math.floor(toNumber(weeklyGoal, 4)))

  if (todayDone) return 0
  if (count >= goal) return 0

  return count + 1 >= goal ? 40 : 0
}

export function calculateLeagueReward(rank, participantCount = 100, options = {}) {
  const safeRank = Math.max(1, Math.floor(toNumber(rank, 1)))
  const safeParticipantCount = Math.max(1, Math.floor(toNumber(participantCount, 100)))
  const topTenCutoff = Math.max(1, Math.ceil(safeParticipantCount * 0.1))
  const topQuarterCutoff = Math.max(topTenCutoff, Math.ceil(safeParticipantCount * 0.25))
  const isProLeague = typeof options === 'boolean' ? options : options?.isProLeague === true
  let baseReward = 0

  if (safeRank === 1) baseReward = 120
  else if (safeRank <= topTenCutoff) baseReward = 80
  else if (safeRank <= topQuarterCutoff) baseReward = 35

  if (!isProLeague || baseReward <= 0) return baseReward

  return Math.round(baseReward * PRO_LEAGUE_REWARD_MULTIPLIER)
}

export function calculateXpAward({
  workoutType,
  durationMinutes = 0,
  sets = 1,
  loadKg = 0,
  levelValue = 1,
  todayDone = false,
  todayCount = 0,
  historyCount = 0,
  streakCount = 0,
  weeklyCount = 0,
  weeklyGoal = 4,
  includeDailyMission = true,
  leagueBonus = null,
  leagueRank = null,
  leagueParticipants = null,
  isProLeague = false,
  leveledUp = false,
} = {}) {
  const breakdown = []
  const isFirstWorkout = !todayDone && toNumber(todayCount) <= 0 && toNumber(historyCount) <= 0

  addBreakdownItem(breakdown, XP_RULE_TYPES.WORKOUT_BASE, calculateWorkoutBaseXP({
    workoutType,
    durationMinutes,
    sets,
    loadKg,
    levelValue,
  }))

  if (isFirstWorkout) {
    addBreakdownItem(breakdown, XP_RULE_TYPES.FIRST_RECORD, 25)
  }

  if (!todayDone) {
    addBreakdownItem(breakdown, XP_RULE_TYPES.STREAK, calculateStreakBonus(streakCount))
  }

  if (!todayDone && includeDailyMission) {
    addBreakdownItem(breakdown, XP_RULE_TYPES.DAILY_MISSION, 15)
  }

  addBreakdownItem(breakdown, XP_RULE_TYPES.WEEKLY_GOAL, calculateWeeklyGoalBonus({
    todayDone,
    weeklyCount,
    weeklyGoal,
  }))

  const resolvedLeagueBonus = leagueBonus ?? (
    leagueRank ? calculateLeagueReward(leagueRank, leagueParticipants ?? 100, { isProLeague }) : 0
  )
  addBreakdownItem(breakdown, XP_RULE_TYPES.LEAGUE, resolvedLeagueBonus)

  if (leveledUp) {
    addBreakdownItem(breakdown, XP_RULE_TYPES.LEVEL_UP, 50)
  }

  return {
    totalXP: breakdown.reduce((total, item) => total + item.amount, 0),
    breakdown,
  }
}

export function getXpAmountByType(award, type) {
  return award?.breakdown?.find((item) => item.type === type)?.amount ?? 0
}

export function getXpRuleLabel(type, language = 'ko') {
  const labels = XP_RULE_LABELS[type]
  return labels?.[language] ?? labels?.ko ?? type
}
