export function getTodayDateString() {
  return new Date().toLocaleDateString('sv-SE')
}

export function getCurrentWeekKey() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toLocaleDateString('sv-SE')
}

export function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

export function isTransientInitDelayMessage(message) {
  if (!message) return false

  return [
    '__user_setup_delay__',
    '__login_init_delay__',
    '사용자 정보를 준비하고 있어요.',
    '로그인이 조금 늦어지고 있어요. 네트워크를 확인해 주세요.',
    'User setup is taking too long.',
    'Login initialization is taking too long. Please check your network.',
  ].includes(message)
}

export function getActionableErrorMessage(error, fallbackMessage, isEnglish) {
  const rawMessage = error?.message ?? ''
  const normalized = rawMessage.toLowerCase()

  const schemaHints = [
    'schema cache',
    'does not exist',
    'could not find the table',
    'could not find the function',
    'relation',
    'column ',
    'function ',
  ]

  if (schemaHints.some((hint) => normalized.includes(hint))) {
    return isEnglish
      ? 'Supabase setup is incomplete. Run supabase/schema.sql, then supabase/verify.sql, and refresh the app.'
      : 'Supabase 설정이 아직 덜 끝났어요. `supabase/schema.sql` 실행 후 `supabase/verify.sql`로 확인하고 새로고침해 주세요.'
  }

  if (normalized.includes('permission') || normalized.includes('row-level security') || normalized.includes('rls')) {
    return isEnglish
      ? 'Access was blocked by Supabase permissions. Check the RLS policies in supabase/schema.sql.'
      : 'Supabase 권한 정책 때문에 요청이 막혔어요. `supabase/schema.sql`의 RLS 정책을 확인해 주세요.'
  }

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror') || normalized.includes('network request failed')) {
    return isEnglish
      ? 'Network connection is unstable. Check your internet and try again.'
      : '네트워크가 불안정해요. 연결을 확인한 뒤 다시 시도해 주세요.'
  }

  if (
    normalized.includes('indexeddb')
    || normalized.includes('quotaexceeded')
    || normalized.includes('versionerror')
    || normalized.includes('invalidstateerror')
  ) {
    return isEnglish
      ? 'Local storage is unavailable on this device. Log in to save this workout to your account.'
      : '이 기기에서는 임시 저장을 사용할 수 없어요. 로그인 후 저장해 주세요.'
  }

  if (isTransientInitDelayMessage(rawMessage)) {
    return rawMessage
  }

  return rawMessage || fallbackMessage
}
