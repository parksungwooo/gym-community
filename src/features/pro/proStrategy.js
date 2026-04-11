import { FREE_WORKOUT_LOG_LIMIT, PREMIUM_CONTEXT } from '../../utils/premium.js'

export const PRO_LEAGUE_REWARD_MULTIPLIER = 1.5
export const PRO_REFERRAL_REWARD_XP = 300
export const PRO_PARTY_BONUS_XP = 120

export const PRO_PAYWALL_HIGHLIGHTS = [
  {
    key: 'next-workout',
    metric: { ko: '30초', en: '30 sec' },
    title: { ko: '오늘 운동이 바로 정해집니다', en: 'Your next workout is decided' },
    body: {
      ko: '테스트 결과와 최근 기록을 읽고, 강도와 회복까지 맞춘 다음 운동을 제안합니다.',
      en: 'Uses your test result and recent logs to suggest the next session with intensity and recovery.',
    },
  },
  {
    key: 'reward-boost',
    metric: { ko: '1.5배', en: '1.5x' },
    title: { ko: '리그 보상이 더 커집니다', en: 'League rewards get bigger' },
    body: {
      ko: 'Pro 리그에서는 같은 기록도 더 큰 XP와 전용 배지로 돌아옵니다.',
      en: 'Pro League turns the same effort into stronger XP and exclusive badges.',
    },
  },
  {
    key: 'party-perks',
    metric: { ko: '+120 XP', en: '+120 XP' },
    title: { ko: '파티 미션도 더 짜릿해집니다', en: 'Party missions feel stronger' },
    body: {
      ko: '친구와 함께 목표를 깨면 Pro 파티 보너스와 배지가 함께 열립니다.',
      en: 'Clearing goals with friends unlocks Pro party bonuses and badges.',
    },
  },
]

export const PRO_COMPARISON_ROWS = [
  {
    key: 'planning',
    label: { ko: '오늘 뭐 하지?', en: 'What to train?' },
    free: { ko: '오늘 추천 운동 1개', en: 'One daily recommendation' },
    pro: { ko: 'AI 주간/월간 플랜 + 회복 조절', en: 'AI weekly/monthly plan + recovery tuning' },
  },
  {
    key: 'rewards',
    label: { ko: '보상', en: 'Rewards' },
    free: { ko: '기본 XP와 일반 리그 보상', en: 'Base XP and normal league rewards' },
    pro: { ko: 'Pro 리그 XP 1.5배 + 전용 미션', en: '1.5x Pro league XP + exclusive missions' },
  },
  {
    key: 'insights',
    label: { ko: '성장 분석', en: 'Growth insights' },
    free: { ko: '기본 기록과 요약', en: 'Basic logs and summaries' },
    pro: { ko: '볼륨, 1RM, 회복, 정체 구간 분석', en: 'Volume, 1RM, recovery, and plateau insights' },
  },
  {
    key: 'status',
    label: { ko: '커뮤니티', en: 'Community' },
    free: { ko: '공개 피드와 일반 랭킹', en: 'Public feed and normal ranking' },
    pro: { ko: 'Pro 배지, Pro 리그, 파티 혜택', en: 'Pro badge, Pro League, and party perks' },
  },
  {
    key: 'history',
    label: { ko: '기록 보관', en: 'History' },
    free: { ko: `${FREE_WORKOUT_LOG_LIMIT}개까지 저장`, en: `${FREE_WORKOUT_LOG_LIMIT} saved logs` },
    pro: { ko: '무제한 기록 + 광고 없는 피드', en: 'Unlimited logs + ad-free feed' },
  },
]

export function buildProActivation({
  planId = 'annual',
  provider = 'stripe',
  now = new Date(),
} = {}) {
  const activatedAt = new Date(now)
  const premiumUntil = new Date(activatedAt)
  const durationDays = planId === 'annual' ? 365 : 30

  premiumUntil.setDate(premiumUntil.getDate() + durationDays)

  return {
    planId,
    provider,
    activatedAt: activatedAt.toISOString(),
    premiumUntil: premiumUntil.toISOString(),
    durationDays,
    profilePatch: {
      is_pro: true,
      is_premium: true,
      isPremium: true,
      premium_until: premiumUntil.toISOString(),
      premiumUntil: premiumUntil.toISOString(),
      subscription_tier: 'pro',
      subscription_plan: planId,
      subscription_provider: provider,
    },
    analyticsEvent: {
      name: 'pro_checkout_completed',
      properties: {
        planId,
        provider,
        durationDays,
      },
    },
  }
}

export function applyProActivationToProfile(profile = {}, activation = buildProActivation()) {
  return {
    ...profile,
    ...activation.profilePatch,
  }
}

export function getProActivationSuccessCopy({
  planId = 'annual',
  provider = 'stripe',
  language = 'ko',
} = {}) {
  const providerLabel = provider === 'toss' ? 'Toss Payments' : 'Stripe'
  const planLabel = planId === 'annual'
    ? { ko: '연간 Pro', en: 'Annual Pro' }
    : { ko: '월간 Pro', en: 'Monthly Pro' }

  return {
    title: pick({
      ko: '축하해요. 이제 Pro가 열렸어요.',
      en: 'Congrats. Pro is now active.',
    }, language),
    body: pick({
      ko: `${planLabel.ko} 혜택이 즉시 적용됐어요. AI 플랜, Pro 리그 1.5배 보상, 파티 혜택이 지금부터 켜집니다.`,
      en: `${planLabel.en} is active now. AI plans, 1.5x Pro League rewards, and party perks are unlocked.`,
    }, language),
    toast: pick({
      ko: 'Pro 활성화 완료. 지금부터 보상이 더 커져요.',
      en: 'Pro activated. Your rewards are stronger now.',
    }, language),
    providerLine: pick({
      ko: `${providerLabel} 승인 완료 후 적용되는 흐름으로 준비됐어요.`,
      en: `Ready for the live ${providerLabel} approval flow.`,
    }, language),
    benefits: [
      {
        label: pick({ ko: 'AI 플랜', en: 'AI Plan' }, language),
        value: pick({ ko: '오늘 운동 자동 조정', en: 'Next workout tuned' }, language),
      },
      {
        label: pick({ ko: 'Pro 리그', en: 'Pro League' }, language),
        value: pick({ ko: '보상 1.5배', en: '1.5x rewards' }, language),
      },
      {
        label: pick({ ko: '파티 혜택', en: 'Party Perks' }, language),
        value: `+${PRO_PARTY_BONUS_XP} XP`,
      },
    ],
  }
}

export function buildProActivationResult({
  planId = 'annual',
  provider = 'stripe',
  language = 'ko',
  now = new Date(),
} = {}) {
  const activation = buildProActivation({ planId, provider, now })
  const successCopy = getProActivationSuccessCopy({ planId, provider, language })

  return {
    activated: true,
    planId,
    provider,
    activation,
    successCopy,
    analyticsEvent: activation.analyticsEvent,
  }
}

export const PRO_FEATURE_CATALOG = [
  {
    key: 'ai-plan',
    context: PREMIUM_CONTEXT.AI_PLAN,
    title: {
      ko: 'AI 주간/월간 맞춤 플랜',
      en: 'AI weekly/monthly training plan',
    },
    shortTitle: {
      ko: 'AI 플랜',
      en: 'AI Plan',
    },
    value: {
      ko: '오늘 뭘 할지 고민하지 않게, 테스트 결과와 최근 기록으로 다음 운동을 정해줍니다.',
      en: 'Turns test results and recent logs into the next workout so users stop guessing.',
    },
    userReason: {
      ko: '가장 직접적인 결제 이유입니다. 사용자는 “기록 앱”보다 “내 코치”에 돈을 냅니다.',
      en: 'The strongest purchase reason. Users pay for coaching, not another logbook.',
    },
    unlocks: [
      { ko: '주간 핵심 운동 자동 추천', en: 'Weekly key sessions' },
      { ko: '월간 성장 블록', en: 'Monthly growth blocks' },
      { ko: '회복 상태 기반 강도 조절', en: 'Recovery-based intensity' },
      { ko: '점진 과부하 목표', en: 'Progressive overload targets' },
    ],
  },
  {
    key: 'analytics',
    context: PREMIUM_CONTEXT.ANALYTICS,
    title: {
      ko: '상세 운동 분석 + AI 인사이트',
      en: 'Advanced analytics + AI insights',
    },
    shortTitle: {
      ko: '성장 분석',
      en: 'Analytics',
    },
    value: {
      ko: '볼륨, XP, 스트릭, 체중, 1RM 예측을 한 화면에서 읽고 다음 결정을 돕습니다.',
      en: 'Reads volume, XP, streak, weight, and 1RM estimates to guide the next decision.',
    },
    userReason: {
      ko: '운동을 오래 한 사용자는 “내가 잘 가고 있나?”에 돈을 냅니다.',
      en: 'Committed users pay to know whether they are moving in the right direction.',
    },
    unlocks: [
      { ko: '근력/볼륨 변화 그래프', en: 'Strength and volume trends' },
      { ko: '1RM 예측', en: '1RM estimate' },
      { ko: '회복 추천', en: 'Recovery recommendation' },
      { ko: '정체 구간 알림', en: 'Plateau alerts' },
    ],
  },
  {
    key: 'pro-league',
    context: PREMIUM_CONTEXT.PRO_COMMUNITY,
    title: {
      ko: 'Pro 전용 리그',
      en: 'Pro-only league',
    },
    shortTitle: {
      ko: 'Pro 리그',
      en: 'Pro League',
    },
    value: {
      ko: '일반 리그보다 더 큰 XP 보상과 전용 배지로 경쟁 욕구를 키웁니다.',
      en: 'Adds stronger XP rewards and badges on top of the normal weekly competition loop.',
    },
    userReason: {
      ko: '경쟁형 사용자는 보상과 지위를 위해 결제합니다.',
      en: 'Competitive users pay for status and better rewards.',
    },
    unlocks: [
      { ko: '리그 보상 1.5배', en: '1.5x league rewards' },
      { ko: 'Pro 챔피언 배지', en: 'Pro champion badge' },
      { ko: '상위권 보상 미리보기', en: 'Reward preview' },
      { ko: '광고 없는 리더보드', en: 'Ad-free leaderboard' },
    ],
  },
  {
    key: 'unlimited',
    context: PREMIUM_CONTEXT.UNLIMITED,
    title: {
      ko: '광고 제거 + 무제한 기록',
      en: 'No ads + unlimited logs',
    },
    shortTitle: {
      ko: '무제한 기록',
      en: 'Unlimited',
    },
    value: {
      ko: `무료는 ${FREE_WORKOUT_LOG_LIMIT}개까지, Pro는 장기 기록과 공유 카드를 계속 쌓습니다.`,
      en: `Free saves ${FREE_WORKOUT_LOG_LIMIT} logs. Pro keeps long-term history and cards alive.`,
    },
    userReason: {
      ko: '기록이 많아질수록 이탈이 아니라 업그레이드가 자연스러워집니다.',
      en: 'As history grows, the limit becomes a natural upgrade moment.',
    },
    unlocks: [
      { ko: '운동 기록 무제한', en: 'Unlimited workout history' },
      { ko: '피드 광고 제거', en: 'No feed ads' },
      { ko: '장기 성장 리포트', en: 'Long-term reports' },
      { ko: '공유 카드 무제한 생성', en: 'Unlimited share cards' },
    ],
  },
  {
    key: 'party-perks',
    context: PREMIUM_CONTEXT.CHALLENGES,
    title: {
      ko: 'Pro 배지 + 파티 전용 혜택',
      en: 'Pro badge + party perks',
    },
    shortTitle: {
      ko: '파티 혜택',
      en: 'Party Perks',
    },
    value: {
      ko: '파티 미션 보상, 초대 보너스, 전용 배지로 함께 운동하는 재미를 키웁니다.',
      en: 'Boosts party missions, referral rewards, and badges so group training feels special.',
    },
    userReason: {
      ko: '친구와 함께 쓰는 기능은 결제 후에도 유지율을 올리는 장치입니다.',
      en: 'Group value helps users stay after they subscribe.',
    },
    unlocks: [
      { ko: `친구 결제 시 초대한 사람 +${PRO_REFERRAL_REWARD_XP} XP`, en: `+${PRO_REFERRAL_REWARD_XP} XP when an invited friend upgrades` },
      { ko: `파티 목표 달성 보너스 +${PRO_PARTY_BONUS_XP} XP`, en: `+${PRO_PARTY_BONUS_XP} XP party completion bonus` },
      { ko: 'Pro 파티 배지', en: 'Pro party badge' },
      { ko: '비공개 챌린지 준비', en: 'Private challenge ready' },
    ],
  },
]

export const PRO_SPECIAL_MISSIONS = [
  {
    key: 'ai-plan-start',
    title: { ko: 'AI 플랜 1회 시작', en: 'Start one AI plan' },
    reward: { ko: '+80 XP · Pro Planner 배지', en: '+80 XP · Pro Planner badge' },
  },
  {
    key: 'pro-league-push',
    title: { ko: 'Pro 리그 상위 10% 도전', en: 'Reach Pro top 10%' },
    reward: { ko: '+120 XP · Pro Champion 배지', en: '+120 XP · Pro Champion badge' },
  },
  {
    key: 'party-pro-boost',
    title: { ko: '파티 공동 미션 완료', en: 'Clear a party mission' },
    reward: { ko: '+120 XP · Crew Boost 배지', en: '+120 XP · Crew Boost badge' },
  },
]

function pick(value, language = 'ko') {
  if (value && typeof value === 'object') return value[language] ?? value.ko ?? value.en ?? ''
  return value ?? ''
}

export function getProFeatureDefinition(language = 'ko') {
  return PRO_FEATURE_CATALOG.map((feature) => ({
    ...feature,
    titleText: pick(feature.title, language),
    shortTitleText: pick(feature.shortTitle, language),
    valueText: pick(feature.value, language),
    userReasonText: pick(feature.userReason, language),
    unlockTexts: feature.unlocks.map((item) => pick(item, language)),
  }))
}

export function getProMissionPreview(language = 'ko') {
  return PRO_SPECIAL_MISSIONS.map((mission) => ({
    ...mission,
    titleText: pick(mission.title, language),
    rewardText: pick(mission.reward, language),
  }))
}

export function getProPaywallHighlights(language = 'ko') {
  return PRO_PAYWALL_HIGHLIGHTS.map((item) => ({
    ...item,
    metricText: pick(item.metric, language),
    titleText: pick(item.title, language),
    bodyText: pick(item.body, language),
  }))
}

export function getProComparisonRows(language = 'ko') {
  return PRO_COMPARISON_ROWS.map((item) => ({
    ...item,
    labelText: pick(item.label, language),
    freeText: pick(item.free, language),
    proText: pick(item.pro, language),
  }))
}

export function getProHomeNudge({
  isPro = false,
  weeklyLeague = null,
  partySnapshot = null,
  activitySummary = {},
  language = 'ko',
} = {}) {
  const currentStreak = Number(activitySummary?.currentStreak ?? 0) || 0
  const partyActive = Boolean(partySnapshot?.party)
  const leagueReward = weeklyLeague?.rewardXp ? Math.round(weeklyLeague.rewardXp * PRO_LEAGUE_REWARD_MULTIPLIER) : 120
  const normalLeagueReward = weeklyLeague?.rewardXp ?? 80
  const proLeagueReward = Math.max(Math.round(normalLeagueReward * PRO_LEAGUE_REWARD_MULTIPLIER), 120)
  const extraLeagueReward = Math.max(proLeagueReward - normalLeagueReward, 40)

  if (isPro) {
    return {
      state: 'active',
      badge: pick({ ko: 'Pro 활성화', en: 'Pro active' }, language),
      title: pick({ ko: '오늘 기록이 코칭 데이터가 됩니다', en: 'Today log becomes coaching data' }, language),
      body: pick({
        ko: 'AI 플랜, Pro 리그 보상, 파티 부스터가 다음 운동까지 이어집니다.',
        en: 'AI plans, Pro league rewards, and party boosts carry into the next workout.',
      }, language),
      bonusCallout: pick({
        ko: `이번 주 Pro 리그 보상 최대 +${proLeagueReward} XP까지 열려 있어요.`,
        en: `This week, Pro League can unlock up to +${proLeagueReward} XP.`,
      }, language),
      context: PREMIUM_CONTEXT.ANALYTICS,
      ctaLabel: pick({ ko: 'Pro 루프 ON', en: 'Pro loop ON' }, language),
      metrics: [
        { label: pick({ ko: 'Pro 리그', en: 'Pro League' }, language), value: `+${leagueReward} XP` },
        { label: pick({ ko: '스트릭 코칭', en: 'Streak coach' }, language), value: currentStreak > 0 ? `${currentStreak}d` : 'Ready' },
        { label: pick({ ko: '파티 혜택', en: 'Party perk' }, language), value: partyActive ? 'ON' : 'Ready' },
      ],
    }
  }

  return {
    state: 'locked',
    badge: pick({ ko: 'Pro로 더 강하게', en: 'Upgrade loop' }, language),
    title: pick({ ko: '무료는 재미있게, Pro는 더 빨리 성장하게', en: 'Free is fun. Pro makes growth faster.' }, language),
    body: pick({
      ko: '오늘 기록을 AI 플랜, Pro 리그 보상, 파티 혜택으로 연결해 보세요.',
      en: 'Connect today log to AI planning, Pro league rewards, and party perks.',
      }, language),
    bonusCallout: pick({
      ko: `Pro 사용자들은 이번 리그에서 최대 +${extraLeagueReward} XP를 더 가져갑니다.`,
      en: `Pro users can take up to +${extraLeagueReward} more XP from this league.`,
    }, language),
    context: PREMIUM_CONTEXT.AI_PLAN,
    secondaryContext: PREMIUM_CONTEXT.PRO_COMMUNITY,
    ctaLabel: pick({ ko: 'Pro 혜택 보기', en: 'See Pro benefits' }, language),
    secondaryCtaLabel: pick({ ko: 'Pro 리그 보기', en: 'See Pro League' }, language),
    metrics: [
      { label: pick({ ko: 'AI 플랜', en: 'AI Plan' }, language), value: pick({ ko: '주간 자동', en: 'Weekly' }, language) },
      { label: pick({ ko: '리그 보상', en: 'League XP' }, language), value: '1.5x' },
      { label: pick({ ko: '파티 보너스', en: 'Party bonus' }, language), value: `+${PRO_PARTY_BONUS_XP}` },
    ],
  }
}

export function getProWorkoutNudge({ isPro = false, estimatedXp = 0, language = 'ko' } = {}) {
  const proLeaguePreviewXp = Math.max(Math.round(estimatedXp * 0.35), 25)

  if (isPro) {
    return {
      state: 'active',
      title: pick({ ko: 'Pro 분석용 데이터 저장 중', en: 'Saving Pro analytics data' }, language),
      body: pick({
        ko: `이번 기록은 XP +${estimatedXp}, 볼륨, 회복 신호에 바로 반영됩니다.`,
        en: `This log feeds XP +${estimatedXp}, volume, and recovery signals.`,
      }, language),
      previewItems: [
        { label: pick({ ko: 'AI 플랜', en: 'AI plan' }, language), value: pick({ ko: '업데이트', en: 'Updated' }, language) },
        { label: pick({ ko: '회복 분석', en: 'Recovery' }, language), value: pick({ ko: '반영', en: 'Tracked' }, language) },
        { label: pick({ ko: 'Pro 리그', en: 'Pro League' }, language), value: `+${proLeaguePreviewXp}` },
      ],
      ctaLabel: pick({ ko: '분석 준비 완료', en: 'Insights ready' }, language),
      context: PREMIUM_CONTEXT.ANALYTICS,
    }
  }

  return {
    state: 'locked',
    title: pick({ ko: '이 기록, Pro면 다음 운동까지 바뀝니다', en: 'With Pro, this log changes the next workout' }, language),
    body: pick({
      ko: '저장 후 AI가 볼륨, 회복, 점진 과부하를 읽어 다음 플랜을 조정합니다.',
      en: 'After saving, AI reads volume, recovery, and overload to tune the next plan.',
    }, language),
    previewItems: [
      { label: pick({ ko: '무료', en: 'Free' }, language), value: `+${estimatedXp} XP` },
      { label: pick({ ko: 'Pro 리그', en: 'Pro League' }, language), value: `+${proLeaguePreviewXp}` },
      { label: pick({ ko: 'AI 코치', en: 'AI Coach' }, language), value: pick({ ko: '다음 운동 조정', en: 'Next plan' }, language) },
    ],
    ctaLabel: pick({ ko: 'Pro 분석 열기', en: 'Unlock Pro insights' }, language),
    context: PREMIUM_CONTEXT.ANALYTICS,
  }
}
