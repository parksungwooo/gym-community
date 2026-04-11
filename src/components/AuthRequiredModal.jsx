import { useI18n } from '../i18n.js'

function getCopy(reason, isEnglish) {
  const copyMap = {
    save_workout: {
      title: isEnglish ? 'Save it to your account.' : '기록을 이어가요.',
      body: isEnglish ? 'Your workout stays safe.' : '운동 기록을 안전하게 보관해요.',
    },
    save_weight: {
      title: isEnglish ? 'Keep your weight trend.' : '체중 흐름을 남겨요.',
      body: isEnglish ? 'Your body data stays safe.' : '변화를 안전하게 보관해요.',
    },
    save_profile: {
      title: isEnglish ? 'Save your profile.' : '프로필을 저장해요.',
      body: isEnglish ? 'Goals and settings stay synced.' : '목표와 설정이 이어져요.',
    },
    save_routine: {
      title: isEnglish ? 'Save this routine.' : '이 루틴 저장하기.',
      body: isEnglish ? 'Use it again in one tap.' : '다음엔 한 번에 시작해요.',
    },
    save_test: {
      title: isEnglish ? 'Save your level.' : '내 레벨 저장하기.',
      body: isEnglish ? 'Recommendations get sharper.' : '다음 추천이 더 정확해져요.',
    },
    follow: {
      title: isEnglish ? 'Log in to follow.' : '팔로우하려면 로그인.',
      body: isEnglish ? 'Build your own crew feed.' : '내 피드를 직접 키워요.',
    },
    like: {
      title: isEnglish ? 'Log in to cheer.' : '응원하려면 로그인.',
      body: isEnglish ? 'Your support stays visible.' : '내 응원이 남아요.',
    },
    comment: {
      title: isEnglish ? 'Log in to comment.' : '댓글은 로그인 후에.',
      body: isEnglish ? 'Cheer from your account.' : '내 이름으로 응원해요.',
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
      title: isEnglish ? 'Keep going with an account.' : '계정으로 이어가요.',
      body: isEnglish ? 'Logs and profile stay safe.' : '기록과 프로필을 보관해요.',
    },
    guest_sync: {
      title: isEnglish ? 'Sync your saved workouts.' : '저장한 기록 옮기기.',
      body: isEnglish ? 'Local logs stay here until login.' : '로그인하면 계정으로 옮겨요.',
    },
    premium_upgrade: {
      title: isEnglish ? 'Log in to start Pro.' : 'Pro는 로그인 후 시작.',
      body: isEnglish ? 'Your upgrade follows your account.' : '업그레이드가 계정에 연결돼요.',
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
  onNaverSignIn,
}) {
  const { isEnglish } = useI18n()

  if (!open) return null

  const copy = getCopy(reason, isEnglish)

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" data-testid="auth-required-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-xl font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClose} aria-label={isEnglish ? 'Close' : '닫기'}>&times;</button>
        <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Account' : '계정 연결'}</span>
        <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{copy.title}</h2>
        <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{copy.body}</p>

        <div className="grid gap-2">
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            data-testid="auth-naver"
            onClick={onNaverSignIn}
            disabled={loading}
          >
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : isEnglish ? 'Continue with Naver' : '네이버로 시작'}
          </button>
          <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10" data-testid="auth-google" onClick={onGoogleSignIn} disabled={loading}>
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Google'}
          </button>
          <button type="button" className="min-h-12 rounded-lg bg-yellow-300 px-4 text-sm font-black text-gray-950 shadow-sm transition hover:bg-yellow-200 disabled:opacity-50" onClick={onKakaoSignIn} disabled={loading}>
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Kakao'}
          </button>
          </div>
        </div>

        <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" data-testid="auth-modal-close" onClick={onClose} disabled={loading}>
          {isEnglish ? 'Maybe later' : '나중에'}
        </button>
      </section>
    </div>
  )
}
