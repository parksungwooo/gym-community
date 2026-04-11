export const PARTY_STORAGE_KEY = 'gym-community:party:v1'
export const PARTY_MAX_MEMBERS = 6

export const PARTY_MISSION_TYPES = Object.freeze({
  WEEKLY_LOGS: 'weekly_logs',
  WEEKLY_XP: 'weekly_xp',
})

const PARTY_LEVELS = [
  { value: 1, minXp: 0, label: { ko: 'Spark Crew', en: 'Spark Crew' } },
  { value: 2, minXp: 500, label: { ko: 'Iron Crew', en: 'Iron Crew' } },
  { value: 3, minXp: 1500, label: { ko: 'Beast Squad', en: 'Beast Squad' } },
  { value: 4, minXp: 3500, label: { ko: 'Legend Party', en: 'Legend Party' } },
]

export const DEFAULT_PARTY_MISSIONS = [
  {
    type: PARTY_MISSION_TYPES.WEEKLY_LOGS,
    target: 100,
    rewardXp: 80,
    badgeKey: 'party_100_logs',
    title: { ko: '이번 주 파티 100회 기록', en: '100 party logs this week' },
  },
  {
    type: PARTY_MISSION_TYPES.WEEKLY_XP,
    target: 500000,
    rewardXp: 120,
    badgeKey: 'party_500k_xp',
    title: { ko: '파티 500,000 XP 모으기', en: 'Collect 500,000 party XP' },
  },
]

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clampPercent(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(parsed, 100))
}

function createId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`
}

function getInviteCode(name = 'party') {
  const cleanName = String(name).replace(/[^a-z0-9가-힣]/gi, '').slice(0, 4).toUpperCase() || 'GYM'
  return `${cleanName}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function normalizePartyMember(member = {}) {
  return {
    user_id: member.user_id ?? member.id ?? createId('member'),
    display_name: member.display_name ?? member.authorDisplayName ?? 'Gym Mate',
    avatar_emoji: member.avatar_emoji ?? member.authorAvatarEmoji ?? 'RUN',
    avatar_url: member.avatar_url ?? member.authorAvatarUrl ?? null,
    weekly_points: Math.max(0, toNumber(member.weekly_points ?? member.weeklyPoints)),
    weekly_count: Math.max(0, toNumber(member.weekly_count ?? member.weeklyCount)),
    total_xp: Math.max(0, toNumber(member.total_xp ?? member.totalXp)),
    role: member.role ?? 'member',
    joined_at: member.joined_at ?? new Date().toISOString(),
  }
}

export function buildCurrentPartyMember({
  currentUserId,
  profile = {},
  activitySummary = {},
  stats = {},
} = {}) {
  return normalizePartyMember({
    user_id: currentUserId ?? profile?.id ?? 'current-user',
    display_name: profile?.display_name || '나',
    avatar_emoji: profile?.avatar_emoji || 'RUN',
    avatar_url: profile?.avatar_url ?? null,
    weekly_points: activitySummary?.weeklyPoints ?? profile?.weekly_points ?? 0,
    weekly_count: stats?.weeklyCount ?? 0,
    total_xp: activitySummary?.totalXp ?? profile?.total_xp ?? 0,
    role: 'leader',
  })
}

export function createParty({ name, owner, now = new Date() } = {}) {
  const leader = normalizePartyMember({ ...owner, role: 'leader', joined_at: now.toISOString() })
  const partyName = name?.trim() || `${leader.display_name} 파티`

  return {
    id: createId('party'),
    name: partyName,
    ownerId: leader.user_id,
    inviteCode: getInviteCode(partyName),
    createdAt: now.toISOString(),
    members: [leader],
    missions: DEFAULT_PARTY_MISSIONS,
  }
}

export function hydrateParty(party, currentMember) {
  if (!party?.id) return null

  const memberMap = new Map()
  ;(party.members ?? []).forEach((member) => {
    const normalized = normalizePartyMember(member)
    memberMap.set(normalized.user_id, normalized)
  })

  if (currentMember?.user_id) {
    const previous = memberMap.get(currentMember.user_id)
    memberMap.set(currentMember.user_id, {
      ...previous,
      ...currentMember,
      role: party.ownerId === currentMember.user_id ? 'leader' : (previous?.role ?? 'member'),
      joined_at: previous?.joined_at ?? currentMember.joined_at,
    })
  }

  return {
    ...party,
    members: [...memberMap.values()].slice(0, PARTY_MAX_MEMBERS),
    missions: party.missions?.length ? party.missions : DEFAULT_PARTY_MISSIONS,
  }
}

export function addPartyMember(party, member) {
  if (!party?.id) return party

  const normalized = normalizePartyMember(member)
  const exists = (party.members ?? []).some((item) => item.user_id === normalized.user_id)
  if (exists || (party.members ?? []).length >= PARTY_MAX_MEMBERS) return party

  return {
    ...party,
    members: [...(party.members ?? []), normalized],
  }
}

export function buildPartyInviteCandidates({
  leaderboard = [],
  followingIds = [],
  currentUserId,
  party,
} = {}) {
  const memberIds = new Set((party?.members ?? []).map((member) => member.user_id))
  const followingSet = new Set(followingIds)

  return leaderboard
    .filter((item) => item.user_id && item.user_id !== currentUserId && !memberIds.has(item.user_id))
    .sort((left, right) => {
      const leftFollow = followingSet.has(left.user_id) ? 1 : 0
      const rightFollow = followingSet.has(right.user_id) ? 1 : 0
      if (rightFollow !== leftFollow) return rightFollow - leftFollow
      return (Number(right.weekly_points) || 0) - (Number(left.weekly_points) || 0)
    })
    .slice(0, Math.max(PARTY_MAX_MEMBERS - (party?.members?.length ?? 0), 0))
    .map(normalizePartyMember)
}

function getPartyLevel(totalXp) {
  const safeXp = Math.max(0, toNumber(totalXp))
  let currentLevel = PARTY_LEVELS[0]

  for (const level of PARTY_LEVELS) {
    if (safeXp >= level.minXp) currentLevel = level
  }

  const nextLevel = PARTY_LEVELS.find((level) => level.minXp > currentLevel.minXp) ?? null

  return {
    ...currentLevel,
    nextLevel,
    remainingXp: nextLevel ? Math.max(nextLevel.minXp - safeXp, 0) : 0,
    progressPercent: nextLevel
      ? clampPercent(((safeXp - currentLevel.minXp) / Math.max(nextLevel.minXp - currentLevel.minXp, 1)) * 100)
      : 100,
  }
}

export function buildPartySnapshot({
  party,
  currentMember,
} = {}) {
  const hydratedParty = hydrateParty(party, currentMember)

  if (!hydratedParty) {
    return {
      party: null,
      members: [],
      missions: [],
      totalWeeklyLogs: 0,
      totalWeeklyXp: 0,
      level: getPartyLevel(0),
      completedMissionCount: 0,
    }
  }

  const members = hydratedParty.members.map(normalizePartyMember)
  const totalWeeklyLogs = members.reduce((total, member) => total + member.weekly_count, 0)
  const totalWeeklyXp = members.reduce((total, member) => total + member.weekly_points, 0)
  const totalXp = members.reduce((total, member) => total + member.total_xp, 0)
  const missions = hydratedParty.missions.map((mission) => {
    const value = mission.type === PARTY_MISSION_TYPES.WEEKLY_XP ? totalWeeklyXp : totalWeeklyLogs
    const progressPercent = clampPercent((value / Math.max(mission.target, 1)) * 100)

    return {
      ...mission,
      value,
      progressPercent,
      complete: value >= mission.target,
    }
  })

  return {
    party: hydratedParty,
    members,
    missions,
    totalWeeklyLogs,
    totalWeeklyXp,
    level: getPartyLevel(totalXp),
    completedMissionCount: missions.filter((mission) => mission.complete).length,
    topContributor: [...members].sort((left, right) => right.weekly_points - left.weekly_points)[0] ?? members[0],
  }
}

export function getPartyInviteText(party, appUrl = '') {
  if (!party?.inviteCode) return ''

  const url = appUrl ? `${appUrl.replace(/\/$/, '')}/#/home?party=${party.inviteCode}` : party.inviteCode
  return `gym-community 파티 초대\n${party.name}\n초대 코드: ${party.inviteCode}\n${url}`
}
