import { calculateLeagueReward } from '../xp/xpRules.js'

export const LEAGUE_TIERS = [
  {
    key: 'bronze',
    minWeeklyXp: 0,
    label: { ko: 'Bronze', en: 'Bronze' },
    accentClass: 'from-amber-700 to-orange-500',
  },
  {
    key: 'silver',
    minWeeklyXp: 150,
    label: { ko: 'Silver', en: 'Silver' },
    accentClass: 'from-gray-500 to-gray-300',
  },
  {
    key: 'gold',
    minWeeklyXp: 350,
    label: { ko: 'Gold', en: 'Gold' },
    accentClass: 'from-yellow-500 to-amber-300',
  },
  {
    key: 'diamond',
    minWeeklyXp: 700,
    label: { ko: 'Diamond', en: 'Diamond' },
    accentClass: 'from-cyan-400 to-emerald-300',
  },
]

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getLeagueWeekStart(now = new Date()) {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const daysFromMonday = (day + 6) % 7
  date.setDate(date.getDate() - daysFromMonday)

  return date
}

export function getLeagueWeekKey(now = new Date()) {
  return getLocalDateKey(getLeagueWeekStart(now))
}

export function getNextLeagueReset(now = new Date()) {
  const nextReset = getLeagueWeekStart(now)
  nextReset.setDate(nextReset.getDate() + 7)

  return nextReset
}

export function getLeagueTier(weeklyXp = 0) {
  const score = Math.max(0, toNumber(weeklyXp))
  let currentTier = LEAGUE_TIERS[0]

  for (const tier of LEAGUE_TIERS) {
    if (score >= tier.minWeeklyXp) {
      currentTier = tier
    }
  }

  const nextTier = LEAGUE_TIERS.find((tier) => tier.minWeeklyXp > currentTier.minWeeklyXp) ?? null

  return {
    ...currentTier,
    nextTier,
    xpToNextTier: nextTier ? Math.max(nextTier.minWeeklyXp - score, 0) : 0,
  }
}

function normalizeLeagueRow(row = {}, fallbackUserId = 'current-user') {
  return {
    ...row,
    user_id: row.user_id ?? row.id ?? fallbackUserId,
    display_name: row.display_name ?? row.authorDisplayName ?? 'Gym Mate',
    avatar_emoji: row.avatar_emoji ?? row.authorAvatarEmoji ?? 'RUN',
    weekly_points: Math.max(0, toNumber(row.weekly_points ?? row.weeklyPoints)),
    weekly_count: Math.max(0, toNumber(row.weekly_count ?? row.weeklyCount)),
    total_xp: Math.max(0, toNumber(row.total_xp ?? row.totalXp)),
  }
}

export function buildWeeklyLeague({
  leaderboard = [],
  currentUserId,
  profile = {},
  activitySummary = {},
  stats = {},
  isProLeague = false,
  now = new Date(),
} = {}) {
  const userId = currentUserId ?? profile?.id ?? 'current-user'
  const currentUserRow = normalizeLeagueRow({
    user_id: userId,
    display_name: profile?.display_name || '나',
    avatar_emoji: profile?.avatar_emoji || 'RUN',
    avatar_url: profile?.avatar_url ?? null,
    weekly_points: activitySummary?.weeklyPoints ?? profile?.weekly_points ?? 0,
    weekly_count: stats?.weeklyCount ?? 0,
    total_xp: activitySummary?.totalXp ?? profile?.total_xp ?? 0,
    activity_level: activitySummary?.levelValue ?? profile?.activity_level ?? 1,
  }, userId)
  const rowMap = new Map()

  ;[...leaderboard, currentUserRow].forEach((row) => {
    const normalized = normalizeLeagueRow(row, userId)
    const previous = rowMap.get(normalized.user_id)

    if (!previous || normalized.weekly_points >= previous.weekly_points) {
      rowMap.set(normalized.user_id, normalized)
    }
  })

  const rows = [...rowMap.values()]
    .sort((left, right) => {
      if (right.weekly_points !== left.weekly_points) return right.weekly_points - left.weekly_points
      if (right.weekly_count !== left.weekly_count) return right.weekly_count - left.weekly_count
      return right.total_xp - left.total_xp
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
  const participantCount = Math.max(rows.length, 1)
  const topTenCutoffRank = Math.max(1, Math.ceil(participantCount * 0.1))
  const currentUser = rows.find((row) => row.user_id === userId) ?? { ...currentUserRow, rank: participantCount }
  const leader = rows[0] ?? currentUser
  const cutoffRow = rows[topTenCutoffRank - 1] ?? leader
  const weeklyXp = currentUser.weekly_points
  const topTenCutoffXp = cutoffRow?.weekly_points ?? 0
  const xpToTopTen = Math.max((cutoffRow?.weekly_points ?? 0) - weeklyXp + (currentUser.rank <= topTenCutoffRank ? 0 : 1), 0)
  const tier = getLeagueTier(weeklyXp)
  const resetAt = getNextLeagueReset(now)

  return {
    weekKey: getLeagueWeekKey(now),
    resetAt,
    participantCount,
    rows,
    topTenCutoffRank,
    currentUser,
    leader,
    tier,
    rank: currentUser.rank,
    percentile: Math.round((currentUser.rank / participantCount) * 100),
    isChampion: currentUser.rank === 1,
    isTopTen: currentUser.rank <= topTenCutoffRank,
    isProLeague,
    topTenCutoffXp,
    xpToTopTen,
    xpToLeader: Math.max((leader?.weekly_points ?? 0) - weeklyXp + (currentUser.rank === 1 ? 0 : 1), 0),
    rewardXp: calculateLeagueReward(currentUser.rank, participantCount, { isProLeague }),
  }
}
