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
    '사용자 정보를 준비하는 데 시간이 더 필요합니다.',
    '로그인 초기화가 지연되고 있어요. 네트워크를 확인해주세요.',
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
      : 'Supabase 설정이 아직 완전하지 않아요. `supabase/schema.sql` 실행 후 `supabase/verify.sql`로 확인하고 앱을 새로고침해주세요.'
  }

  if (normalized.includes('permission') || normalized.includes('row-level security') || normalized.includes('rls')) {
    return isEnglish
      ? 'Access was blocked by Supabase permissions. Check the RLS policies in supabase/schema.sql.'
      : 'Supabase 권한 정책 때문에 요청이 막혔어요. `supabase/schema.sql`의 RLS 정책을 확인해주세요.'
  }

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror') || normalized.includes('network request failed')) {
    return isEnglish
      ? 'Network connection is unstable. Check your internet and try again.'
      : '네트워크 연결이 불안정해요. 인터넷 상태를 확인한 뒤 다시 시도해주세요.'
  }

  if (
    normalized.includes('indexeddb')
    || normalized.includes('quotaexceeded')
    || normalized.includes('versionerror')
    || normalized.includes('invalidstateerror')
  ) {
    return isEnglish
      ? 'Local storage is unavailable on this device. Log in to save this workout to your account.'
      : '이 기기에서는 로컬 저장을 사용할 수 없어요. 로그인해서 운동 기록을 계정에 저장해주세요.'
  }

  if (isTransientInitDelayMessage(rawMessage)) {
    return rawMessage
  }

  return rawMessage || fallbackMessage
}
