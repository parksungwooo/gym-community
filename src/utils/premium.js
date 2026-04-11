export const PREMIUM_CONTEXT = {
  GENERAL: 'general',
  AI_PLAN: 'ai_plan',
  ANALYTICS: 'analytics',
  SHARE_CARDS: 'share_cards',
  UNLIMITED: 'unlimited',
  PRO_COMMUNITY: 'pro_community',
  REPORTS: 'reports',
  REMINDERS: 'reminders',
  CHALLENGES: 'challenges',
}

export const FREE_WORKOUT_LOG_LIMIT = 30

export const PREMIUM_PLANS = [
  {
    id: 'annual',
    badge: { ko: '가장 추천', en: 'Most popular' },
    title: { ko: '연간 Pro', en: 'Annual Pro' },
    price: { ko: '59,000원 / 년', en: '$44.99 / year' },
    detail: { ko: '7일 무료 체험 + 월간 대비 약 38% 절약', en: '7-day free trial + save about 38% vs monthly' },
    footnote: { ko: '월 4,900원 수준 · 가장 낮은 가격', en: 'About $3.75 per month · best value' },
    highlighted: true,
    providerPriceIds: {
      stripe: 'price_gym_pro_annual',
      toss: 'gym_pro_annual',
    },
  },
  {
    id: 'monthly',
    badge: null,
    title: { ko: '월간 Pro', en: 'Monthly Pro' },
    price: { ko: '7,900원 / 월', en: '$7.99 / month' },
    detail: { ko: '언제든 해지 가능', en: 'Cancel anytime' },
    footnote: { ko: '가볍게 시작하기 좋아요', en: 'A lighter way to start' },
    highlighted: false,
    providerPriceIds: {
      stripe: 'price_gym_pro_monthly',
      toss: 'gym_pro_monthly',
    },
  },
]

export const PREMIUM_BENEFITS = [
  {
    title: { ko: 'AI 개인 맞춤 운동 플랜', en: 'AI personalized training plan' },
    body: {
      ko: '테스트 결과, 최근 기록, 목표를 분석해 주간/월간 플랜을 자동으로 제안해요.',
      en: 'Turns test results, recent logs, and goals into weekly and monthly plans.',
    },
  },
  {
    title: { ko: '고급 분석 대시보드', en: 'Advanced analytics dashboard' },
    body: {
      ko: '볼륨 변화, XP 추이, 1RM 예측, 회복 추천을 한 화면에서 볼 수 있어요.',
      en: 'Shows volume change, XP trend, 1RM estimates, and recovery signals.',
    },
  },
  {
    title: { ko: '프리미엄 공유 카드', en: 'Premium share cards' },
    body: {
      ko: '운동 기록을 인스타/카톡에 올리기 좋은 고퀄리티 카드로 만들어요.',
      en: 'Creates polished cards for Instagram, KakaoTalk, and group chats.',
    },
  },
  {
    title: { ko: '무제한 기록 + 광고 제거', en: 'Unlimited logs + no ads' },
    body: {
      ko: '기록 제한 없이 쌓고, 피드와 기록 화면에서 광고 없이 집중해요.',
      en: 'Keep every log and stay focused with an ad-free experience.',
    },
  },
  {
    title: { ko: 'Pro 클럽', en: 'Pro Club' },
    body: {
      ko: 'Pro 배지, 전용 리더보드, 비공개 챌린지로 더 진한 커뮤니티를 만들어요.',
      en: 'Adds a Pro badge, dedicated leaderboard, and private challenges.',
    },
  },
]

export const PREMIUM_FEATURE_TABLE = [
  {
    category: { ko: '기록', en: 'Logging' },
    free: { ko: '최근 기록 중심 기본 히스토리', en: 'Basic recent-history logging' },
    pro: { ko: '무제한 기록, 광고 제거, 프리미엄 공유 카드', en: 'Unlimited logs, no ads, premium share cards' },
  },
  {
    category: { ko: '리포트', en: 'Reports' },
    free: { ko: '기본 주간 요약과 추이 확인', en: 'Basic weekly summaries and trends' },
    pro: { ko: '볼륨, XP, 회복, 1RM 예측, 정체 구간 분석', en: 'Volume, XP, recovery, 1RM estimate, and plateau analysis' },
  },
  {
    category: { ko: 'AI 플랜', en: 'AI plan' },
    free: { ko: '오늘 추천 운동', en: 'Today recommendation' },
    pro: { ko: '주간/월간 플랜, 점진 과부하, 회복 자동 조정', en: 'Weekly/monthly plan, overload, and recovery adjustment' },
  },
  {
    category: { ko: '커뮤니티', en: 'Community' },
    free: { ko: '피드, 팔로우, 댓글, 공개 프로필', en: 'Feed, follows, comments, and public profiles' },
    pro: { ko: '비공개 챌린지, 친구 그룹, 그룹 랭킹', en: 'Private challenges, friend groups, and group rankings' },
  },
  {
    category: { ko: '성장', en: 'Growth' },
    free: { ko: 'XP, 레벨, 기본 배지', en: 'XP, levels, and core badges' },
    pro: { ko: '상세 XP 히스토리, 시즌 리캡, 대표 배지 고정', en: 'Detailed XP history, season recaps, and featured badges' },
  },
]

export function isProMember(profile) {
  const hasPremiumFlag = (
    profile?.is_pro === true
    || profile?.is_premium === true
    || profile?.isPremium === true
    || profile?.subscription_tier === 'pro'
    || profile?.plan_tier === 'pro'
    || profile?.subscription_plan === 'pro'
  )

  const premiumUntil = profile?.premium_until ?? profile?.premiumUntil
  if (!premiumUntil) return hasPremiumFlag

  const premiumUntilTime = new Date(premiumUntil).getTime()
  if (!Number.isFinite(premiumUntilTime)) return hasPremiumFlag

  return hasPremiumFlag && premiumUntilTime > Date.now()
}

export function getCheckoutPreparation(planId, provider = 'stripe') {
  const plan = PREMIUM_PLANS.find((item) => item.id === planId) ?? PREMIUM_PLANS[0]

  return {
    planId: plan.id,
    provider,
    priceId: plan.providerPriceIds?.[provider] ?? plan.providerPriceIds?.stripe ?? '',
    mode: 'subscription',
    successUrlPath: '/#/profile?billing=success',
    cancelUrlPath: '/#/profile?billing=cancel',
  }
}

export function getPaywallCopy(context, language = 'ko') {
  const copyMap = {
    [PREMIUM_CONTEXT.GENERAL]: {
      kicker: { ko: 'Pro', en: 'Pro' },
      title: {
        ko: '기록하는 앱에서, 계속 가는 앱으로',
        en: 'Turn a logging app into a staying-consistent app',
      },
      body: {
        ko: '주간 리포트, 고급 리마인더, 비공개 챌린지까지 열고 운동 습관을 더 오래 이어가세요.',
        en: 'Unlock reports, advanced reminders, and private challenges to keep your workout rhythm going longer.',
      },
    },
    [PREMIUM_CONTEXT.AI_PLAN]: {
      kicker: { ko: 'Pro AI 플랜', en: 'Pro AI Plan' },
      title: {
        ko: '오늘 뭐 할지 고민하지 않게 해드릴게요',
        en: 'Stop guessing what to train next',
      },
      body: {
        ko: '체력 테스트, 최근 기록, 목표를 분석해 주간/월간 플랜과 회복일을 자동으로 제안합니다.',
        en: 'Analyzes test results, recent logs, and goals to create weekly/monthly plans with recovery days.',
      },
    },
    [PREMIUM_CONTEXT.ANALYTICS]: {
      kicker: { ko: 'Pro 분석', en: 'Pro Analytics' },
      title: {
        ko: '내 몸이 좋아지는 이유를 숫자로 확인하세요',
        en: 'See why your fitness is improving',
      },
      body: {
        ko: '운동 볼륨, XP 추이, 스트릭, 체중 변화, 1RM 예측과 회복 신호를 한 화면에서 보여줍니다.',
        en: 'See volume, XP trend, streak, weight change, 1RM estimates, and recovery signals in one dashboard.',
      },
    },
    [PREMIUM_CONTEXT.SHARE_CARDS]: {
      kicker: { ko: 'Pro 공유 카드', en: 'Pro Share Cards' },
      title: {
        ko: '자랑하고 싶은 운동 기록을 자동으로 만드세요',
        en: 'Create workout stories worth sharing',
      },
      body: {
        ko: '레벨, XP, 스트릭, 체중 변화를 담은 고퀄리티 이미지를 인스타와 카톡에 바로 공유할 수 있어요.',
        en: 'Generate polished images with level, XP, streak, and weight progress for social sharing.',
      },
    },
    [PREMIUM_CONTEXT.UNLIMITED]: {
      kicker: { ko: 'Pro 무제한', en: 'Pro Unlimited' },
      title: {
        ko: '기록은 쌓일수록 가치가 커집니다',
        en: 'Your logs get more valuable over time',
      },
      body: {
        ko: '기록 개수 제한과 광고를 제거하고 장기 히스토리, 분석, 공유 카드를 계속 사용할 수 있어요.',
        en: 'Remove log caps and ads while keeping long-term history, analytics, and share cards.',
      },
    },
    [PREMIUM_CONTEXT.PRO_COMMUNITY]: {
      kicker: { ko: 'Pro 클럽', en: 'Pro Club' },
      title: {
        ko: '꾸준한 사람들끼리 더 오래 가세요',
        en: 'Go further with people who keep showing up',
      },
      body: {
        ko: 'Pro 배지, 전용 리더보드, 비공개 챌린지와 소모임으로 운동을 더 오래 이어갈 수 있습니다.',
        en: 'Unlock a Pro badge, dedicated leaderboard, private challenges, and tighter training circles.',
      },
    },
    [PREMIUM_CONTEXT.REPORTS]: {
      kicker: { ko: 'Pro 리포트', en: 'Pro Reports' },
      title: {
        ko: '숫자만 쌓지 말고, 변화를 읽어보세요',
        en: 'Do more than collect numbers. Read the change.',
      },
      body: {
        ko: '주간/월간 리포트와 패턴 분석으로 운동, 체중, XP 변화를 더 깊게 볼 수 있어요.',
        en: 'Go deeper on workouts, weight, and XP with weekly and monthly reports plus pattern insights.',
      },
    },
    [PREMIUM_CONTEXT.REMINDERS]: {
      kicker: { ko: 'Pro 리마인더', en: 'Pro Reminders' },
      title: {
        ko: '내 생활 패턴에 맞는 리마인더로 바꿔보세요',
        en: 'Shape reminders around your real routine',
      },
      body: {
        ko: '요일별 시간, 다시 알림, 목표 미달성 알림으로 놓치기 쉬운 운동도 챙겨보세요.',
        en: 'Use weekday timing, retry nudges, and missed-goal alerts to catch the workouts that usually slip away.',
      },
    },
    [PREMIUM_CONTEXT.CHALLENGES]: {
      kicker: { ko: 'Pro 챌린지', en: 'Pro Challenges' },
      title: {
        ko: '작은 그룹 안에서 더 오래 가세요',
        en: 'Go longer inside a smaller circle',
      },
      body: {
        ko: '비공개 챌린지와 친구 그룹 랭킹으로 가까운 사람들과 더 강한 꾸준함을 만들 수 있어요.',
        en: 'Private challenges and friend-group rankings help build stronger consistency with people close to you.',
      },
    },
  }

  const selected = copyMap[context] ?? copyMap[PREMIUM_CONTEXT.GENERAL]

  return {
    kicker: selected.kicker[language],
    title: selected.title[language],
    body: selected.body[language],
  }
}
