import { useI18n } from '../i18n.js'

function getCopy(reason, isEnglish) {
  const copyMap = {
    save_workout: {
      title: isEnglish ? 'Log in to keep this workout.' : '로그인하면 이 기록이 남아요.',
      body: isEnglish ? 'Workout logs save to your account.' : '운동 기록은 계정에 저장돼요.',
    },
    save_weight: {
      title: isEnglish ? 'Log in to keep this weight log.' : '로그인하면 체중 기록이 남아요.',
      body: isEnglish ? 'Weight records save to your account.' : '체중 기록은 계정에 저장돼요.',
    },
    save_profile: {
      title: isEnglish ? 'Log in to save your profile.' : '로그인하면 프로필이 저장돼요.',
      body: isEnglish ? 'Profile changes save to your account.' : '프로필 수정은 계정과 함께 저장돼요.',
    },
    save_routine: {
      title: isEnglish ? 'Log in to keep this routine.' : '로그인하면 이 루틴이 남아요.',
      body: isEnglish ? 'You can reuse routines after login.' : '로그인 후에는 루틴을 다시 쓸 수 있어요.',
    },
    save_test: {
      title: isEnglish ? 'Log in to keep this result.' : '로그인하면 이 결과가 남아요.',
      body: isEnglish ? 'Test results save to your account.' : '레벨 결과는 계정에 저장돼요.',
    },
    follow: {
      title: isEnglish ? 'Log in to follow people' : '팔로우하려면 로그인해주세요',
      body: isEnglish ? 'Following and personal feeds need a login.' : '팔로우와 개인 피드는 로그인 후 열려요.',
    },
    like: {
      title: isEnglish ? 'Log in to like posts' : '좋아요를 누르려면 로그인해주세요',
      body: isEnglish ? 'Reactions are tied to your account.' : '반응은 내 계정 기준으로 남아요.',
    },
    comment: {
      title: isEnglish ? 'Log in to comment' : '댓글을 남기려면 로그인해주세요',
      body: isEnglish ? 'Comments are posted from your account.' : '댓글은 내 계정으로 남아요.',
    },
    report: {
      title: isEnglish ? 'Log in to report content' : '신고하려면 로그인해주세요',
      body: isEnglish ? 'Reports are saved with your account.' : '신고 기록은 계정과 함께 저장돼요.',
    },
    block: {
      title: isEnglish ? 'Log in to block users' : '차단하려면 로그인해주세요',
      body: isEnglish ? 'Blocking changes your personal community view.' : '차단은 내 커뮤니티 화면에 반영돼요.',
    },
    guest_profile: {
      title: isEnglish ? 'Keep going with an account.' : '계정으로 이어서 써볼까요?',
      body: isEnglish ? 'Logs and profile save after login.' : '기록과 프로필은 로그인 후 저장돼요.',
    },
    premium_upgrade: {
      title: isEnglish ? 'Log in to start Pro' : 'Pro를 시작하려면 로그인해주세요',
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
      <section className="auth-modal-card" onClick={(event) => event.stopPropagation()}>
        <span className="auth-modal-kicker">{isEnglish ? 'Account Needed' : '로그인 필요'}</span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>

        <div className="auth-modal-actions">
          <button type="button" className="social-btn google compact" onClick={onGoogleSignIn} disabled={loading}>
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Google'}
          </button>
          <button type="button" className="social-btn kakao compact" onClick={onKakaoSignIn} disabled={loading}>
            {loading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Kakao'}
          </button>
        </div>

        <button type="button" className="ghost-btn auth-modal-close" onClick={onClose} disabled={loading}>
          {isEnglish ? 'Maybe later' : '나중에'}
        </button>
      </section>
    </div>
  )
}
