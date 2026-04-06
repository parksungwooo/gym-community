import { useI18n } from '../i18n.js'

function getCopy(reason, isEnglish) {
  const copyMap = {
    save_workout: {
      title: isEnglish ? 'Log in to save your workout' : '운동 기록을 저장하려면 로그인해주세요',
      body: isEnglish ? 'Your workout log, calories, photos, and weekly progress need an account.' : '운동 기록, 예상 칼로리, 사진, 주간 진행률은 계정에 저장돼요.',
    },
    save_weight: {
      title: isEnglish ? 'Log in to save your weight' : '몸무게를 기록하려면 로그인해주세요',
      body: isEnglish ? 'Weight history and body changes are tracked on your account.' : '체중 변화 추이와 바디 기록은 계정과 연결되어 저장됩니다.',
    },
    save_profile: {
      title: isEnglish ? 'Log in to save your profile' : '프로필을 저장하려면 로그인해주세요',
      body: isEnglish ? 'Your intro, workout tags, and default sharing settings need an account.' : '한 줄 소개, 운동 태그, 기본 공개 설정은 계정과 함께 저장돼요.',
    },
    save_routine: {
      title: isEnglish ? 'Log in to save your routine' : '루틴을 저장하려면 로그인해주세요',
      body: isEnglish ? 'Saved routines stay on your account so you can reuse them later.' : '저장한 루틴은 계정에 붙어서 나중에도 바로 다시 쓸 수 있어요.',
    },
    save_test: {
      title: isEnglish ? 'Log in to save your test result' : '테스트 결과를 저장하려면 로그인해주세요',
      body: isEnglish ? 'Your level history and badge progress are saved to your account.' : '레벨 기록과 배지 진행 상황은 계정에 저장됩니다.',
    },
    follow: {
      title: isEnglish ? 'Log in to follow people' : '팔로우하려면 로그인해주세요',
      body: isEnglish ? 'Follow relationships and your personalized feed need an account.' : '팔로우 관계와 나만의 피드는 계정이 있어야 만들 수 있어요.',
    },
    like: {
      title: isEnglish ? 'Log in to like posts' : '좋아요를 누르려면 로그인해주세요',
      body: isEnglish ? 'Community reactions are saved to your account.' : '커뮤니티 반응은 내 계정 기준으로 기록돼요.',
    },
    comment: {
      title: isEnglish ? 'Log in to comment' : '댓글을 남기려면 로그인해주세요',
      body: isEnglish ? 'Comments are posted from your account so others can recognize you.' : '댓글은 내 계정으로 남겨져서 다른 사람이 나를 알아볼 수 있어요.',
    },
    report: {
      title: isEnglish ? 'Log in to report content' : '신고하려면 로그인해주세요',
      body: isEnglish ? 'Reports are attached to your account so safety actions can be reviewed properly.' : '신고 내역은 계정과 연결되어야 안전 조치를 제대로 검토할 수 있어요.',
    },
    block: {
      title: isEnglish ? 'Log in to block users' : '차단하려면 로그인해주세요',
      body: isEnglish ? 'Blocking someone personalizes your community experience and needs an account.' : '차단은 내 커뮤니티 화면을 개인화하는 기능이라 계정이 필요해요.',
    },
    guest_profile: {
      title: isEnglish ? 'Keep going with a real account' : '이제 계정으로 이어서 써볼까요?',
      body: isEnglish ? 'You can keep exploring as a guest, but saving records and building your profile needs a login.' : '게스트로 둘러보는 건 가능하지만, 기록 저장과 프로필 관리는 로그인이 필요해요.',
    },
    premium_upgrade: {
      title: isEnglish ? 'Log in to start Pro' : 'Pro를 시작하려면 로그인해주세요',
      body: isEnglish ? 'Plans, reports, and challenge perks are tied to your account, so log in first before upgrading.' : '요금제, 리포트, 챌린지 혜택은 계정과 연결되므로 업그레이드 전에 먼저 로그인해야 해요.',
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
          {isEnglish ? 'Keep Exploring' : '계속 둘러보기'}
        </button>
      </section>
    </div>
  )
}
