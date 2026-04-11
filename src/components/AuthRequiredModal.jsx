import { useI18n } from '../i18n.js'

function getCopy(reason, isEnglish) {
  const copyMap = {
    save_workout: {
      title: isEnglish ? 'Log in to keep this workout.' : '로그인하면 기록이 이어져요.',
      body: isEnglish ? 'Workout logs save to your account.' : '운동 기록을 안전하게 보관해요.',
    },
    save_weight: {
      title: isEnglish ? 'Log in to keep this weight log.' : '로그인하면 체중 흐름이 남아요.',
      body: isEnglish ? 'Weight records save to your account.' : '체중 변화를 안전하게 보관해요.',
    },
    save_profile: {
      title: isEnglish ? 'Log in to save your profile.' : '로그인하면 프로필이 저장돼요.',
      body: isEnglish ? 'Profile changes save to your account.' : '프로필과 설정을 안전하게 보관해요.',
    },
    save_routine: {
      title: isEnglish ? 'Log in to keep this routine.' : '로그인하면 루틴을 저장해요.',
      body: isEnglish ? 'You can reuse routines after login.' : '자주 하는 조합을 다시 쓸 수 있어요.',
    },
    save_test: {
      title: isEnglish ? 'Log in to keep this result.' : '로그인하면 레벨이 저장돼요.',
      body: isEnglish ? 'Test results save to your account.' : '다음 추천이 더 정확해져요.',
    },
    follow: {
      title: isEnglish ? 'Log in to follow people' : '팔로우하려면 로그인이 필요해요',
      body: isEnglish ? 'Following and personal feeds need a login.' : '내 피드를 개인화할 수 있어요.',
    },
    like: {
      title: isEnglish ? 'Log in to like posts' : '응원하려면 로그인이 필요해요',
      body: isEnglish ? 'Reactions are tied to your account.' : '좋아요가 내 계정으로 남아요.',
    },
    comment: {
      title: isEnglish ? 'Log in to comment' : '댓글을 남기려면 로그인이 필요해요',
      body: isEnglish ? 'Comments are posted from your account.' : '댓글은 내 계정으로 남아요.',
    },
    report: {
      title: isEnglish ? 'Log in to report content' : '신고하려면 로그인이 필요해요',
      body: isEnglish ? 'Reports are saved with your account.' : '안전한 커뮤니티를 위해 필요해요.',
    },
    block: {
      title: isEnglish ? 'Log in to block users' : '차단하려면 로그인이 필요해요',
      body: isEnglish ? 'Blocking changes your personal community view.' : '내 피드에 바로 반영돼요.',
    },
    guest_profile: {
      title: isEnglish ? 'Keep going with an account.' : '계정으로 이어서 써볼까요?',
      body: isEnglish ? 'Logs and profile save after login.' : '기록과 프로필을 안전하게 보관해요.',
    },
    guest_sync: {
      title: isEnglish ? 'Log in to sync saved workouts.' : '\uC800\uC7A5\uD55C \uC6B4\uB3D9 \uAE30\uB85D\uC744 \uB3D9\uAE30\uD654\uD558\uB824\uBA74 \uB85C\uADF8\uC778\uD558\uC138\uC694.',
      body: isEnglish ? 'Local workouts stay on this device until you sign in.' : '\uB85C\uADF8\uC778\uD558\uAE30 \uC804\uAE4C\uC9C0 \uB85C\uCEEC \uC6B4\uB3D9 \uAE30\uB85D\uC740 \uC774 \uAE30\uAE30\uC5D0 \uBA38\uBB34\uB985\uB2C8\uB2E4.',
    },
    premium_upgrade: {
      title: isEnglish ? 'Log in to start Pro' : 'Pro를 시작하려면 로그인이 필요해요',
      body: isEnglish ? 'Upgrades are tied to your account.' : '업그레이드는 계정과 연결돼요.',
    },
  }

  return copyMap[reason] ?? copyMap.guest_profile
}

export default function AuthRequiredModal({
  open,
  reason,
  loading,
  onClose,
  onGoogleSignIn,
  onKakaoSignIn,
}) {
  const { isEnglish } = useI18n()

  if (!open) return null

  const copy = getCopy(reason, isEnglish)

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" data-testid="auth-required-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose} aria-label={isEnglish ? 'Close' : '닫기'}>&times;</button>
        <span className="auth-modal-kicker">{isEnglish ? 'Account Needed' : '로그인 필요'}</span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>

        <div className="auth-modal-actions">
          <button type="button" className="social-btn google compact" data-testid="auth-google" onClick={onGoogleSignIn} disabled={loading}>
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Google'}
          </button>
          <button type="button" className="social-btn kakao compact" onClick={onKakaoSignIn} disabled={loading}>
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Kakao'}
          </button>
        </div>

        <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-600 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white" data-testid="auth-modal-close" onClick={onClose} disabled={loading}>
          {isEnglish ? 'Maybe later' : '나중에'}
        </button>
      </section>
    </div>
  )
}
