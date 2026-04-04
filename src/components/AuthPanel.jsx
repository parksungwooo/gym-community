import { useI18n } from '../i18n.js'

export default function AuthPanel({
  user,
  authLoading,
  onGoogleSignIn,
  onKakaoSignIn,
  onSignOut,
}) {
  const { isEnglish } = useI18n()
  const isGuest = user?.is_anonymous

  return (
    <section className="card auth-card">
      <h2>{isEnglish ? 'Account' : '계정 연결'}</h2>
      <p className="subtext">
        {isGuest
          ? isEnglish
            ? 'You are using guest mode. Connect an account whenever you want.'
            : '게스트로 사용 중이에요. 필요할 때 계정을 연결하면 됩니다.'
          : isEnglish
            ? 'Your account is connected.'
            : '계정이 연결되어 있어요.'}
      </p>

      <div className="social-grid">
        <button
          type="button"
          className="social-btn google"
          onClick={onGoogleSignIn}
          disabled={authLoading}
        >
          {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : isEnglish ? 'Continue with Google' : '구글로 시작'}
        </button>
        <button
          type="button"
          className="social-btn kakao"
          onClick={onKakaoSignIn}
          disabled={authLoading}
        >
          {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : isEnglish ? 'Continue with Kakao' : '카카오로 시작'}
        </button>
      </div>

      {!isGuest && (
        <button type="button" className="secondary-btn" onClick={onSignOut} disabled={authLoading}>
          {isEnglish ? 'Sign out' : '로그아웃'}
        </button>
      )}
    </section>
  )
}

