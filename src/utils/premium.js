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

export const PREMIUM_LAUNCH_OFFER = {
  label: { ko: '런칭 오퍼', en: 'Launch offer' },
  title: { ko: '지금 업그레이드하면 첫 달 40% 할인', en: 'Upgrade now and get 40% off your first month' },
  body: {
    ko: '연간 Pro는 7일 무료 체험과 월간 대비 약 38% 절약까지 함께 적용됩니다.',
    en: 'Annual Pro also includes a 7-day trial and saves about 38% versus monthly.',
  },
  code: 'LAUNCH40',
  expiresLabel: { ko: '이번 주까지만 표시되는 초기 멤버 혜택', en: 'Early-member offer shown this week' },
}

export const PREMIUM_PLANS = [
  {
    id: 'annual',
    badge: { ko: '가장 많이 선택', en: 'Most popular' },
    title: { ko: '연간 Pro', en: 'Annual Pro' },
    price: { ko: '59,000원', en: '$44.99' },
    period: { ko: '/년', en: '/year' },
    monthlyValue: { ko: '월 4,900원 수준', en: 'About $3.75/mo' },
    originalPrice: { ko: '월간 대비 38% 절약', en: 'Save 38% vs monthly' },
    detail: {
      ko: '7일 무료 체험 후 자동 갱신. 장기 기록, AI 플랜, 분석을 제대로 쓰는 선택.',
      en: '7-day trial, then renews yearly. Best for long-term plans, analytics, and history.',
    },
    footnote: { ko: '첫 달 40% 할인 오퍼 포함', en: 'Includes first-month launch offer' },
    ctaLabel: { ko: '7일 무료로 Pro 시작', en: 'Start Pro free for 7 days' },
    highlighted: true,
    providerPriceIds: {
      stripe: 'price_gym_pro_annual',
      toss: 'gym_pro_annual',
    },
  },
  {
    id: 'monthly',
    badge: { ko: '부담 없이', en: 'Flexible' },
    title: { ko: '월간 Pro', en: 'Monthly Pro' },
    price: { ko: '7,900원', en: '$7.99' },
    period: { ko: '/월', en: '/month' },
    monthlyValue: { ko: '언제든 해지 가능', en: 'Cancel anytime' },
    originalPrice: { ko: '첫 달 40% 할인', en: '40% off first month' },
    detail: {
      ko: '먼저 Pro 경험을 가볍게 확인하고 싶은 사용자에게 적합합니다.',
      en: 'Good when you want to feel the Pro experience first.',
    },
    footnote: { ko: '결제 후 즉시 Pro 혜택 적용', en: 'Pro benefits unlock right after checkout' },
    ctaLabel: { ko: '월간 Pro로 시작', en: 'Start monthly Pro' },
    highlighted: false,
    providerPriceIds: {
      stripe: 'price_gym_pro_monthly',
      toss: 'gym_pro_monthly',
    },
  },
]

export const PREMIUM_OUTCOMES = [
  {
    title: { ko: '오늘 뭘 해야 할지 바로 알게 됩니다', en: 'Know exactly what to train today' },
    body: {
      ko: '체력 테스트와 최근 기록을 바탕으로 강도, 회복일, 다음 핵심 운동을 자동으로 정리합니다.',
      en: 'Your test result and recent logs turn into intensity, recovery, and the next key session.',
    },
  },
  {
    title: { ko: '내 몸이 좋아지는 이유가 보입니다', en: 'See why your body is changing' },
    body: {
      ko: '볼륨, XP, 스트릭, 1RM 예측, 회복 신호가 한 화면에 모여 정체 구간을 더 빨리 잡습니다.',
      en: 'Volume, XP, streak, 1RM estimates, and recovery signals help reveal plateaus sooner.',
    },
  },
  {
    title: { ko: '운동 기록이 자랑할 만한 결과물이 됩니다', en: 'Turn effort into something shareable' },
    body: {
      ko: '카톡과 인스타에 바로 올릴 수 있는 Pro 성장 카드로 꾸준함을 시각적으로 남깁니다.',
      en: 'Pro cards make your consistency look polished enough for KakaoTalk, Instagram, and groups.',
    },
  },
]

export const PREMIUM_TRANSFORMATION_TIMELINE = [
  {
    point: { ko: '오늘 밤', en: 'Tonight' },
    title: { ko: '내일 할 운동이 이미 정해집니다', en: 'Tomorrow is already planned' },
    body: {
      ko: '기록을 보고 강도와 회복을 계산해 다음 운동을 바로 제안합니다.',
      en: 'Your logs become the next workout with intensity and recovery built in.',
    },
  },
  {
    point: { ko: '7일 후', en: 'After 7 days' },
    title: { ko: '운동 루틴이 흐트러지는 구간을 잡습니다', en: 'Catch the moments your routine slips' },
    body: {
      ko: 'XP, 스트릭, 회복 신호로 이번 주에 밀어붙일지 쉬어갈지 구분합니다.',
      en: 'XP, streak, and recovery signals show whether to push or back off.',
    },
  },
  {
    point: { ko: '4주 후', en: 'After 4 weeks' },
    title: { ko: '내 몸이 바뀐 이유를 설명할 수 있습니다', en: 'You can explain why your body changed' },
    body: {
      ko: '볼륨, 1RM 예측, 체중 흐름, 공유 카드가 꾸준함을 결과로 보여줍니다.',
      en: 'Volume, 1RM estimates, weight trend, and cards turn consistency into proof.',
    },
  },
]

export const PREMIUM_FEATURE_SPOTLIGHTS = [
  {
    context: PREMIUM_CONTEXT.AI_PLAN,
    label: { ko: 'AI 플랜', en: 'AI Plan' },
    title: { ko: '운동 루틴을 매주 새로 짜주는 개인 코치', en: 'A personal coach that replans every week' },
    body: {
      ko: '테스트 결과와 최근 기록을 바탕으로 이번 주 핵심 운동, 회복일, 점진 과부하 목표를 제안합니다.',
      en: 'Builds your key sessions, recovery days, and overload targets from tests and recent logs.',
    },
    proof: { ko: '예: 금요일 핵심 세트만 +6%', en: 'Example: +6% only on Friday key sets' },
  },
  {
    context: PREMIUM_CONTEXT.ANALYTICS,
    label: { ko: '고급 분석', en: 'Analytics' },
    title: { ko: '감이 아니라 데이터로 조절하는 성장 속도', en: 'Growth paced by data, not guesswork' },
    body: {
      ko: '볼륨, XP, 스트릭, 1RM 예측, 회복 점수를 함께 보여줘 정체와 과훈련을 더 빨리 알아차립니다.',
      en: 'Volume, XP, streak, 1RM estimates, and recovery score reveal plateaus and overtraining sooner.',
    },
    proof: { ko: '예: 회복 점수 낮음 → 코어/가벼운 유산소 추천', en: 'Example: low recovery → core/light cardio' },
  },
  {
    context: PREMIUM_CONTEXT.SHARE_CARDS,
    label: { ko: '공유 카드', en: 'Share Cards' },
    title: { ko: '노력이 남에게도 보이는 예쁜 결과물', en: 'A beautiful artifact of your effort' },
    body: {
      ko: '레벨, XP, 스트릭, 체중 변화를 카톡과 인스타에 바로 올릴 수 있는 Pro 카드로 만듭니다.',
      en: 'Turns level, XP, streak, and weight change into a Pro card for social sharing.',
    },
    proof: { ko: '예: 이번 주 4/5 달성 카드 생성', en: 'Example: 4/5 this week card' },
  },
  {
    context: PREMIUM_CONTEXT.PRO_COMMUNITY,
    label: { ko: 'Pro 커뮤니티', en: 'Pro Community' },
    title: { ko: '꾸준한 사람들 사이에서 받는 압력과 응원', en: 'Accountability with people who show up' },
    body: {
      ko: 'Pro 배지, 전용 리더보드, 비공개 챌린지로 혼자 버티는 운동을 보이고 응원받는 루틴으로 바꿉니다.',
      en: 'Pro badge, leaderboard, and private challenges turn solo effort into visible commitment.',
    },
    proof: { ko: '예: 친구 5명과 4주 챌린지', en: 'Example: 4-week challenge with 5 friends' },
  },
]

export const PREMIUM_PROOF_POINTS = [
  {
    value: { ko: '30초', en: '30 sec' },
    label: { ko: '다음 운동 결정 시간', en: 'to pick the next workout' },
  },
  {
    value: { ko: '4주', en: '4 weeks' },
    label: { ko: '변화를 읽는 첫 리포트', en: 'to your first change report' },
  },
  {
    value: { ko: '무제한', en: 'Unlimited' },
    label: { ko: '기록과 성장 카드', en: 'logs and progress cards' },
  },
]

export const PREMIUM_RISK_REVERSALS = [
  {
    title: { ko: '7일 무료 체험', en: '7-day free trial' },
    body: { ko: '내 루틴에 맞는지 먼저 확인하세요.', en: 'Check whether it fits your routine first.' },
  },
  {
    title: { ko: '언제든 해지 가능', en: 'Cancel anytime' },
    body: { ko: '설정에서 구독을 바로 관리할 수 있어요.', en: 'Manage the subscription from settings.' },
  },
  {
    title: { ko: '결제 후 즉시 적용', en: 'Instant unlock' },
    body: { ko: 'Pro 배지, AI 플랜, 무제한 기록이 바로 열립니다.', en: 'Pro badge, AI plan, and unlimited logs unlock right away.' },
  },
]

export const PREMIUM_TRIGGER_MOMENTS = {
  [PREMIUM_CONTEXT.GENERAL]: {
    label: { ko: '업그레이드 타이밍', en: 'Upgrade moment' },
    title: { ko: '지금 Pro를 열면 다음 운동이 바로 달라집니다', en: 'Open Pro now and your next workout changes immediately' },
    body: {
      ko: '기록을 남기는 순간에 코칭과 분석이 붙어야 꾸준함이 끊기지 않습니다.',
      en: 'Coaching and analytics work best when they attach to the moment you log.',
    },
    ctaHint: { ko: '연간 Pro로 가장 낮은 가격에 시작', en: 'Start annual Pro at the lowest price' },
  },
  [PREMIUM_CONTEXT.AI_PLAN]: {
    label: { ko: 'AI 플랜을 열려던 순간', en: 'You were opening AI Plan' },
    title: { ko: '방금 보려던 건 다음 운동의 답입니다', en: 'That was the answer to your next workout' },
    body: {
      ko: '테스트 결과와 최근 기록을 합쳐 오늘의 강도, 회복, 다음 핵심 세트를 바로 정합니다.',
      en: 'It combines your test and recent logs to decide today’s intensity, recovery, and key sets.',
    },
    ctaHint: { ko: '7일 무료로 이번 주 플랜 받기', en: 'Get this week’s plan with a 7-day trial' },
  },
  [PREMIUM_CONTEXT.ANALYTICS]: {
    label: { ko: '분석을 확인하려던 순간', en: 'You were checking analytics' },
    title: { ko: '내 몸이 왜 바뀌는지 지금 확인하세요', en: 'See why your body is changing now' },
    body: {
      ko: '볼륨, XP, 회복, 1RM 예측을 함께 보면 무리할 때와 쉬어야 할 때가 분명해집니다.',
      en: 'Volume, XP, recovery, and 1RM estimates make push-or-rest decisions clearer.',
    },
    ctaHint: { ko: '이번 주 리포트까지 바로 열기', en: 'Unlock this week’s report now' },
  },
  [PREMIUM_CONTEXT.SHARE_CARDS]: {
    label: { ko: '공유 카드를 만들려던 순간', en: 'You were creating a share card' },
    title: { ko: '지금 기록을 자랑하고 싶은 결과물로 바꾸세요', en: 'Turn this workout into something worth showing' },
    body: {
      ko: '레벨, XP, 스트릭, 체중 변화를 한 장의 Pro 카드로 만들어 카톡과 인스타에 바로 공유합니다.',
      en: 'Turn level, XP, streak, and weight progress into a polished Pro card for social sharing.',
    },
    ctaHint: { ko: '첫 Pro 카드 생성하고 공유하기', en: 'Create and share your first Pro card' },
  },
  [PREMIUM_CONTEXT.UNLIMITED]: {
    label: { ko: '기록 제한에 도달한 순간', en: 'You hit the log limit' },
    title: { ko: '여기서 멈추면 변화의 흐름이 끊깁니다', en: 'Stopping here breaks the story of your progress' },
    body: {
      ko: `Free는 운동 기록 ${FREE_WORKOUT_LOG_LIMIT}개까지 저장됩니다. Pro는 오래 쌓인 기록을 분석과 공유 카드로 계속 살립니다.`,
      en: `Free saves ${FREE_WORKOUT_LOG_LIMIT} workouts. Pro keeps long-term history alive through analytics and share cards.`,
    },
    ctaHint: { ko: '무제한 히스토리 열기', en: 'Unlock unlimited history' },
  },
  [PREMIUM_CONTEXT.PRO_COMMUNITY]: {
    label: { ko: 'Pro 클럽을 보려던 순간', en: 'You were opening Pro Club' },
    title: { ko: '혼자 버티는 운동을 보이고 응원받는 루틴으로', en: 'Turn solo effort into visible accountability' },
    body: {
      ko: 'Pro 배지, 전용 리더보드, 비공개 챌린지로 꾸준한 사람들 사이에 들어갑니다.',
      en: 'Pro badge, leaderboard, and private challenges place you among people who keep showing up.',
    },
    ctaHint: { ko: 'Pro 클럽 입장하기', en: 'Enter Pro Club' },
  },
}

export const PREMIUM_BENEFITS = [
  {
    title: { ko: 'AI 개인 맞춤 운동 플랜', en: 'AI personalized plan' },
    body: {
      ko: '이번 주 운동, 회복일, 점진 과부하 목표까지 자동으로 제안합니다.',
      en: 'Plans this week, recovery days, and progressive overload targets.',
    },
  },
  {
    title: { ko: '고급 분석 대시보드', en: 'Advanced analytics' },
    body: {
      ko: '볼륨 변화, XP 흐름, 1RM 예측, 회복 점수를 한 번에 확인합니다.',
      en: 'Reads volume, XP, 1RM estimates, and recovery in one place.',
    },
  },
  {
    title: { ko: '프리미엄 공유 카드', en: 'Premium share cards' },
    body: {
      ko: '운동 기록을 지인에게 보여주고 싶은 고급 이미지로 바꿉니다.',
      en: 'Turns workouts into polished images worth sharing.',
    },
  },
  {
    title: { ko: '무제한 기록 + 광고 제거', en: 'Unlimited logs + no ads' },
    body: {
      ko: '기록이 많아져도 막히지 않고, 피드는 운동 인증에만 집중합니다.',
      en: 'No history cap, no feed ads, just your training proof.',
    },
  },
  {
    title: { ko: 'Pro 배지와 전용 클럽', en: 'Pro badge and club' },
    body: {
      ko: '프로필, 리더보드, 비공개 챌린지에서 Pro 멤버십이 드러납니다.',
      en: 'Pro status shows on profiles, boards, and private challenges.',
    },
  },
]

export const PREMIUM_FEATURE_TABLE = [
  {
    category: { ko: '운동 방향', en: 'Training direction' },
    free: { ko: '오늘 추천 운동만 확인', en: 'Today recommendation' },
    pro: { ko: '주간/월간 AI 플랜 + 회복일 자동 조정', en: 'Weekly/monthly AI plan + recovery adjustment' },
  },
  {
    category: { ko: '성장 분석', en: 'Growth analytics' },
    free: { ko: '기본 기록과 요약', en: 'Basic logs and summaries' },
    pro: { ko: '볼륨, XP, 스트릭, 1RM, 정체 구간 분석', en: 'Volume, XP, streak, 1RM, plateau insights' },
  },
  {
    category: { ko: '기록 보관', en: 'History' },
    free: { ko: `운동 기록 ${FREE_WORKOUT_LOG_LIMIT}개까지`, en: `${FREE_WORKOUT_LOG_LIMIT} saved workouts` },
    pro: { ko: '무제한 기록과 장기 히스토리', en: 'Unlimited logs and long-term history' },
  },
  {
    category: { ko: '공유', en: 'Sharing' },
    free: { ko: '일반 피드 공유', en: 'Basic feed sharing' },
    pro: { ko: '인스타/카톡용 Pro 성장 카드', en: 'Pro progress cards for social sharing' },
  },
  {
    category: { ko: '커뮤니티', en: 'Community' },
    free: { ko: '공개 피드와 기본 랭킹', en: 'Public feed and core ranking' },
    pro: { ko: 'Pro 배지, 전용 리더보드, 비공개 챌린지', en: 'Pro badge, leaderboard, private challenges' },
  },
]

export const PREMIUM_ACTIVATION_STEPS = [
  {
    title: { ko: '결제 완료 즉시', en: 'Right after checkout' },
    body: {
      ko: 'Pro 배지와 무제한 기록이 열립니다.',
      en: 'Pro badge and unlimited logging unlock.',
    },
  },
  {
    title: { ko: '첫 운동 기록 후', en: 'After your first Pro log' },
    body: {
      ko: 'AI가 이번 주 플랜과 회복 신호를 다시 계산합니다.',
      en: 'AI recalculates your weekly plan and recovery signals.',
    },
  },
  {
    title: { ko: '이번 주 말', en: 'At the end of this week' },
    body: {
      ko: '볼륨, XP, 스트릭 변화가 Pro 리포트로 정리됩니다.',
      en: 'Volume, XP, and streak changes become a Pro report.',
    },
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
    couponCode: PREMIUM_LAUNCH_OFFER.code,
    successUrlPath: '/#/profile?billing=success',
    cancelUrlPath: '/#/profile?billing=cancel',
  }
}

export function getPaywallTriggerCopy(context, language = 'ko') {
  const selected = PREMIUM_TRIGGER_MOMENTS[context] ?? PREMIUM_TRIGGER_MOMENTS[PREMIUM_CONTEXT.GENERAL]
  const pick = (value) => value?.[language] ?? value?.ko ?? value?.en ?? ''

  return {
    label: pick(selected.label),
    title: pick(selected.title),
    body: pick(selected.body),
    ctaHint: pick(selected.ctaHint),
  }
}

export function getPaywallCopy(context, language = 'ko') {
  const copyMap = {
    [PREMIUM_CONTEXT.GENERAL]: {
      kicker: { ko: 'Gym Community Pro', en: 'Gym Community Pro' },
      title: {
        ko: '기록만 쌓던 운동을, 결과가 보이는 루틴으로',
        en: 'Turn workout logs into a routine that visibly changes you',
      },
      body: {
        ko: 'AI 플랜, 고급 분석, Pro 성장 카드가 매일의 운동을 다음 행동으로 연결합니다.',
        en: 'AI plans, advanced analytics, and Pro cards connect every workout to your next action.',
      },
      promise: {
        ko: '다음 운동을 고민하는 시간을 줄이고, 꾸준함이 보이게 만듭니다.',
        en: 'Spend less time guessing and make consistency visible.',
      },
    },
    [PREMIUM_CONTEXT.AI_PLAN]: {
      kicker: { ko: 'Pro AI 플랜', en: 'Pro AI Plan' },
      title: {
        ko: '오늘 뭐 할지 고민하지 않아도 됩니다',
        en: 'Stop guessing what to train next',
      },
      body: {
        ko: '체력 테스트, 최근 운동, 목표를 분석해 이번 주 강도와 회복일까지 자동으로 짜줍니다.',
        en: 'Your test result, recent workouts, and goal become a weekly plan with intensity and recovery.',
      },
      promise: {
        ko: '내 수준에 맞는 다음 세트가 보이면, 운동을 미루기 훨씬 어려워집니다.',
        en: 'When the next session is already tailored to you, skipping gets harder.',
      },
    },
    [PREMIUM_CONTEXT.ANALYTICS]: {
      kicker: { ko: 'Pro 분석', en: 'Pro Analytics' },
      title: {
        ko: '몸이 바뀌는 이유를 숫자로 보세요',
        en: 'See why your fitness is improving',
      },
      body: {
        ko: '볼륨, XP, 스트릭, 체중 변화, 1RM 예측과 회복 신호를 한 화면에서 읽습니다.',
        en: 'Read volume, XP, streak, weight change, 1RM estimates, and recovery signals in one view.',
      },
      promise: {
        ko: '감으로 하는 운동에서 벗어나, 올라갈 때와 쉬어야 할 때를 구분합니다.',
        en: 'Move beyond guesswork and know when to push or recover.',
      },
    },
    [PREMIUM_CONTEXT.SHARE_CARDS]: {
      kicker: { ko: 'Pro 공유 카드', en: 'Pro Share Cards' },
      title: {
        ko: '운동 기록이 자랑하고 싶은 결과물이 됩니다',
        en: 'Create workout stories worth sharing',
      },
      body: {
        ko: '레벨, XP, 스트릭, 체중 변화를 한 장의 고급 카드로 만들어 카톡과 인스타에 바로 공유합니다.',
        en: 'Turn level, XP, streak, and weight progress into a polished card for social sharing.',
      },
      promise: {
        ko: '나만 보는 기록을, 계속하게 만드는 작은 자랑거리로 바꿉니다.',
        en: 'Turn private effort into a visible reason to keep going.',
      },
    },
    [PREMIUM_CONTEXT.UNLIMITED]: {
      kicker: { ko: 'Pro 무제한 기록', en: 'Pro Unlimited' },
      title: {
        ko: '기록은 쌓일수록 더 비싸집니다',
        en: 'Your logs get more valuable over time',
      },
      body: {
        ko: '기록 제한과 광고를 제거하고 장기 히스토리, 분석, 공유 카드를 계속 사용할 수 있습니다.',
        en: 'Remove log caps and ads while keeping long-term history, analytics, and share cards.',
      },
      promise: {
        ko: '한 달 뒤, 석 달 뒤에도 내 변화가 끊기지 않게 남습니다.',
        en: 'Your progress stays intact one month, three months, and beyond.',
      },
    },
    [PREMIUM_CONTEXT.PRO_COMMUNITY]: {
      kicker: { ko: 'Pro 클럽', en: 'Pro Club' },
      title: {
        ko: '꾸준한 사람들 사이에 들어가세요',
        en: 'Go further with people who keep showing up',
      },
      body: {
        ko: 'Pro 배지, 전용 리더보드, 비공개 챌린지와 소모임으로 운동을 더 오래 이어갑니다.',
        en: 'Unlock a Pro badge, dedicated leaderboard, private challenges, and tighter training circles.',
      },
      promise: {
        ko: '혼자 버티는 운동보다, 보이고 응원받는 운동이 오래 갑니다.',
        en: 'Training lasts longer when effort is seen and supported.',
      },
    },
    [PREMIUM_CONTEXT.REPORTS]: {
      kicker: { ko: 'Pro 리포트', en: 'Pro Reports' },
      title: {
        ko: '숫자만 쌓지 말고, 변화를 읽어보세요',
        en: 'Read the change, not just the numbers',
      },
      body: {
        ko: '주간/월간 리포트와 패턴 분석으로 운동, 체중, XP 변화를 더 깊게 볼 수 있어요.',
        en: 'Go deeper on workouts, weight, and XP with weekly and monthly reports plus pattern insights.',
      },
      promise: {
        ko: '이번 주가 잘된 이유와 다음 주에 바꿀 점이 선명해집니다.',
        en: 'See what worked this week and what should change next week.',
      },
    },
    [PREMIUM_CONTEXT.REMINDERS]: {
      kicker: { ko: 'Pro 리마인더', en: 'Pro Reminders' },
      title: {
        ko: '내 생활 패턴에 맞는 리마인더로 바꾸세요',
        en: 'Shape reminders around your real routine',
      },
      body: {
        ko: '요일별 시간, 다시 알림, 목표 미달성 알림으로 놓치기 쉬운 운동도 챙깁니다.',
        en: 'Use weekday timing, retry nudges, and missed-goal alerts to catch workouts that slip away.',
      },
      promise: {
        ko: '의지보다 시스템이 먼저 움직이게 만듭니다.',
        en: 'Let the system move before willpower has to.',
      },
    },
    [PREMIUM_CONTEXT.CHALLENGES]: {
      kicker: { ko: 'Pro 챌린지', en: 'Pro Challenges' },
      title: {
        ko: '작은 그룹 안에서 더 오래 가세요',
        en: 'Go longer inside a smaller circle',
      },
      body: {
        ko: '비공개 챌린지와 친구 그룹 랭킹으로 가까운 사람들과 더 강한 꾸준함을 만듭니다.',
        en: 'Private challenges and friend-group rankings build stronger consistency with people close to you.',
      },
      promise: {
        ko: '서로의 기록이 다음 운동의 가장 좋은 이유가 됩니다.',
        en: 'Each shared log becomes a better reason for the next workout.',
      },
    },
  }

  const selected = copyMap[context] ?? copyMap[PREMIUM_CONTEXT.GENERAL]
  const pick = (value) => value?.[language] ?? value?.ko ?? value?.en ?? ''

  return {
    kicker: pick(selected.kicker),
    title: pick(selected.title),
    body: pick(selected.body),
    promise: pick(selected.promise),
  }
}
