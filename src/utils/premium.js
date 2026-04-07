export const PREMIUM_CONTEXT = {
  GENERAL: 'general',
  REPORTS: 'reports',
  REMINDERS: 'reminders',
  CHALLENGES: 'challenges',
}

export const PREMIUM_PLANS = [
  {
    id: 'annual',
    badge: { ko: '가장 추천', en: 'Most popular' },
    title: { ko: '연간 Pro', en: 'Annual Pro' },
    price: { ko: '59,000원 / 년', en: '$44.99 / year' },
    detail: { ko: '7일 무료 체험 포함', en: 'Includes a 7-day free trial' },
    footnote: { ko: '월 4,900원 수준', en: 'About $3.75 per month' },
    highlighted: true,
  },
  {
    id: 'monthly',
    badge: null,
    title: { ko: '월간 Pro', en: 'Monthly Pro' },
    price: { ko: '7,900원 / 월', en: '$7.99 / month' },
    detail: { ko: '언제든 해지 가능', en: 'Cancel anytime' },
    footnote: { ko: '가볍게 시작하기 좋아요', en: 'A lighter way to start' },
    highlighted: false,
  },
]

export const PREMIUM_BENEFITS = [
  {
    title: { ko: '주간/월간 리포트', en: 'Weekly and monthly reports' },
    body: {
      ko: '운동, 체중, 칼로리, XP 기록을 한눈에 정리해줘요.',
      en: 'Summarizes workouts, weight, calories, and XP in one place.',
    },
  },
  {
    title: { ko: '고급 리마인더', en: 'Advanced reminders' },
    body: {
      ko: '요일별 설정, 놓쳤을 때 재알림, 목표 미달성 알림까지 지원해요.',
      en: 'Supports weekday schedules, retry nudges, and missed-goal reminders.',
    },
  },
  {
    title: { ko: '비공개 챌린지', en: 'Private challenges' },
    body: {
      ko: '친구끼리만 모여 챌린지와 랭킹을 운영할 수 있어요.',
      en: 'Create small private challenge groups and rankings with friends.',
    },
  },
  {
    title: { ko: '성장 인사이트', en: 'Growth insights' },
    body: {
      ko: '레벨업, 배지, 체중 변화 패턴을 더 깊게 해석해줘요.',
      en: 'Goes deeper on level-ups, badges, and body-change patterns.',
    },
  },
]

export const PREMIUM_FEATURE_TABLE = [
  {
    category: { ko: '기록', en: 'Logging' },
    free: { ko: '운동 기록, 몸무게, 사진 인증, 기본 히스토리', en: 'Workout logs, weight, proof photos, and basic history' },
    pro: { ko: '기록 비교 리포트, 기간별 분석, PDF/이미지 공유', en: 'Comparison reports, time-range analysis, and shareable exports' },
  },
  {
    category: { ko: '리포트', en: 'Reports' },
    free: { ko: '기본 주간 요약과 추이 확인', en: 'Basic weekly summaries and trends' },
    pro: { ko: '주간/월간 리포트, 정체 구간 감지, 패턴 해석', en: 'Weekly/monthly reports, plateau detection, and pattern insights' },
  },
  {
    category: { ko: '리마인더', en: 'Reminders' },
    free: { ko: '기본 리마인더 1개', en: 'One basic reminder' },
    pro: { ko: '요일별 설정, 재알림, 목표 미달성 알림', en: 'Weekday schedules, retry nudges, and missed-goal alerts' },
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
  return (
    profile?.is_pro === true
    || profile?.subscription_tier === 'pro'
    || profile?.plan_tier === 'pro'
  )
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
