import { useI18n } from '../i18n.js'

export default function AuthPanel({
  user,
  authLoading,
  onGoogleSignIn,
  onKakaoSignIn,
  onNaverSignIn,
  onSignOut,
}) {
  const { isEnglish } = useI18n()
  const isGuest = user?.is_anonymous

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Account' : '계정 연결'}</h2>
      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {isGuest
          ? isEnglish
            ? 'You are using guest mode. Connect an account whenever you want.'
            : '게스트로 사용 중이에요. 필요할 때 계정을 연결하면 됩니다.'
          : isEnglish
            ? 'Your account is connected.'
            : '계정이 연결되어 있어요.'}
      </p>

      <div className="grid gap-2">
        <button
          type="button"
          className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          onClick={onNaverSignIn}
          disabled={authLoading}
        >
          {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : isEnglish ? 'Continue with Naver' : '네이버로 시작'}
        </button>
        <button
          type="button"
          className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
          onClick={onGoogleSignIn}
          disabled={authLoading}
        >
          {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : isEnglish ? 'Continue with Google' : '구글로 시작'}
        </button>
        <button
          type="button"
          className="min-h-12 rounded-lg bg-yellow-300 px-4 text-sm font-black text-gray-950 shadow-sm transition hover:bg-yellow-200 disabled:opacity-50"
          onClick={onKakaoSignIn}
          disabled={authLoading}
        >
          {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : isEnglish ? 'Continue with Kakao' : '카카오로 시작'}
        </button>
      </div>

      {!isGuest && (
        <button type="button" className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10" onClick={onSignOut} disabled={authLoading}>
          {isEnglish ? 'Sign out' : '로그아웃'}
        </button>
      )}
    </section>
  )
}

