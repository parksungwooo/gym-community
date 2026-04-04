import { useEffect, useState } from 'react'
import { getBadgeLabel, useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

const AVATAR_OPTIONS = ['RUN', 'GYM', 'ZEN', 'LIFT', 'CARD', 'FLOW']
const GOAL_OPTIONS = [3, 4, 5, 6]

function SettingRow({ label, helper, compact = false, children }) {
  return (
    <section className={`settings-row ${compact ? 'compact' : ''}`}>
      <div className="settings-row-copy">
        <strong>{label}</strong>
        {helper ? <span>{helper}</span> : null}
      </div>
      <div className="settings-row-control">{children}</div>
    </section>
  )
}

function SummaryStat({ label, value }) {
  return (
    <article className="profile-summary-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

export default function ProfilePanel({
  user,
  profile,
  latestResult,
  stats,
  badges,
  challenge,
  loading,
  authLoading,
  language,
  onSetLanguage,
  onGoogleSignIn,
  onKakaoSignIn,
  onSignOut,
  onSaveProfile,
}) {
  const { isEnglish } = useI18n()
  const isGuest = user?.is_anonymous
  const fallbackName = isGuest
    ? (isEnglish ? 'Guest User' : '게스트 사용자')
    : user?.email ?? (isEnglish ? 'Signed-in User' : '로그인 사용자')
  const displayName = profile?.display_name || fallbackName
  const avatarTag = profile?.avatar_emoji || 'RUN'
  const weeklyGoal = profile?.weekly_goal || 4
  const featuredBadge = getBadgeLabel(badges[badges.length - 1] ?? 'starter', language)

  const [draftName, setDraftName] = useState(displayName)
  const [draftAvatar, setDraftAvatar] = useState(avatarTag)
  const [draftGoal, setDraftGoal] = useState(weeklyGoal)

  useEffect(() => {
    setDraftName(displayName)
  }, [displayName])

  useEffect(() => {
    setDraftAvatar(avatarTag)
  }, [avatarTag])

  useEffect(() => {
    setDraftGoal(weeklyGoal)
  }, [weeklyGoal])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSaveProfile({
      displayName: draftName,
      avatarEmoji: draftAvatar,
      weeklyGoal: draftGoal,
    })
  }

  return (
    <section className="profile-settings-screen compact-profile-screen">
      <section className="card profile-settings-hero compact">
        <div className="profile-settings-top compact">
          <div className="profile-avatar large compact">{draftAvatar}</div>
          <div className="profile-settings-copy">
            <span className="app-section-kicker">{isEnglish ? 'Settings' : '설정'}</span>
            <h2 className="profile-settings-name compact">{displayName}</h2>
            <p className="subtext compact">
              {isGuest
                ? (isEnglish
                    ? 'Stay in guest mode, or connect an account whenever you want.'
                    : '지금은 게스트 모드예요. 원할 때 계정을 연결할 수 있어요.')
                : (isEnglish
                    ? 'Keep your profile, language, and goal in one tidy place.'
                    : '프로필, 언어, 목표를 한 곳에서 간단하게 관리해보세요.')}
            </p>
          </div>
        </div>

        <div className="profile-summary-grid compact">
          <SummaryStat
            label={isEnglish ? 'Level' : '레벨'}
            value={latestResult?.level ? localizeLevelText(latestResult.level, language) : (isEnglish ? 'Not tested' : '아직 측정 전')}
          />
          <SummaryStat
            label={isEnglish ? 'This Week' : '이번 주'}
            value={isEnglish ? `${stats.weeklyCount}/${weeklyGoal}` : `${stats.weeklyCount}/${weeklyGoal}회`}
          />
          <SummaryStat
            label={isEnglish ? 'Badge' : '배지'}
            value={featuredBadge}
          />
        </div>
      </section>

      <section className="card settings-card compact">
        <div className="settings-card-header compact">
          <span className="app-section-kicker">{isEnglish ? 'App' : '앱'}</span>
          <h2 className="app-section-title small">{isEnglish ? 'Language & Account' : '언어 및 계정'}</h2>
        </div>

        <SettingRow
          label={isEnglish ? 'Language' : '언어'}
          helper={isEnglish ? 'Choose the app language.' : '앱에서 사용할 언어를 선택하세요.'}
          compact
        >
          <div className="language-switcher settings-language-switcher segmented-language-switcher">
            <button
              type="button"
              className={`lang-btn ${language === 'ko' ? 'active' : ''}`}
              onClick={() => onSetLanguage('ko')}
            >
              한국어
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => onSetLanguage('en')}
            >
              English
            </button>
          </div>
        </SettingRow>

        <SettingRow
          label={isEnglish ? 'Account' : '계정'}
          helper={
            isGuest
              ? (isEnglish ? 'You are currently using guest mode.' : '현재는 게스트 모드로 사용 중이에요.')
              : (isEnglish ? 'Your connected account is active.' : '연결된 계정으로 사용 중이에요.')
          }
          compact
        >
          <div className="profile-auth-actions compact">
            {isGuest ? (
              <>
                <button type="button" className="social-btn google compact" onClick={onGoogleSignIn} disabled={authLoading}>
                  {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Google'}
                </button>
                <button type="button" className="social-btn kakao compact" onClick={onKakaoSignIn} disabled={authLoading}>
                  {authLoading ? (isEnglish ? 'Connecting...' : '연결 중...') : 'Kakao'}
                </button>
              </>
            ) : (
              <button type="button" className="secondary-btn settings-signout-btn compact" onClick={onSignOut} disabled={authLoading}>
                {authLoading ? (isEnglish ? 'Working...' : '처리 중...') : (isEnglish ? 'Sign out' : '로그아웃')}
              </button>
            )}
          </div>
        </SettingRow>
      </section>

      <form className="profile-settings-stack compact" onSubmit={handleSubmit}>
        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{isEnglish ? 'Profile' : '프로필'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Basic Settings' : '기본 설정'}</h2>
          </div>

          <SettingRow
            label={isEnglish ? 'Nickname' : '닉네임'}
            helper={isEnglish ? 'Shown in the community and feed.' : '커뮤니티와 피드에 표시돼요.'}
            compact
          >
            <input
              className="workout-input settings-input compact"
              type="text"
              maxLength="20"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={isEnglish ? 'ex: RunningMate' : '예: 러닝메이트'}
              disabled={loading}
            />
          </SettingRow>

          <SettingRow
            label={isEnglish ? 'Avatar Style' : '아바타 스타일'}
            helper={isEnglish ? 'Pick the tag that fits your vibe.' : '내 분위기에 맞는 태그를 골라보세요.'}
            compact
          >
            <div className="avatar-grid settings-avatar-grid compact">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`avatar-btn compact ${draftAvatar === item ? 'active' : ''}`}
                  onClick={() => setDraftAvatar(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>
          </SettingRow>
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{isEnglish ? 'Goal' : '목표'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Weekly Goal' : '주간 목표'}</h2>
          </div>

          <SettingRow
            label={isEnglish ? 'Workout Target' : '운동 목표'}
            helper={isEnglish ? 'This sets the challenge target on the home screen.' : '홈 화면 챌린지 목표를 이 기준으로 맞춰요.'}
            compact
          >
            <div className="goal-chip-row settings-goal-row compact">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={`goal-chip compact ${draftGoal === goal ? 'active' : ''}`}
                  onClick={() => setDraftGoal(goal)}
                  disabled={loading}
                >
                  {isEnglish ? `${goal}/week` : `주 ${goal}회`}
                </button>
              ))}
            </div>
          </SettingRow>

          <div className="settings-goal-summary compact">
            <span>{isEnglish ? 'Current challenge' : '현재 챌린지'}</span>
            <strong>{isEnglish ? `${challenge.current}/${challenge.goal} complete` : `${challenge.current}/${challenge.goal} 완료`}</strong>
          </div>
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{isEnglish ? 'Note' : '메모'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Latest Workout Note' : '최근 운동 메모'}</h2>
          </div>
          <p className="profile-note settings-note compact">
            {stats.lastWorkoutNote ?? (isEnglish ? 'No workout note saved yet.' : '아직 저장된 운동 메모가 없어요.')}
          </p>
        </section>

        <button type="submit" className="primary-btn settings-save-btn compact" disabled={loading}>
          {loading ? (isEnglish ? 'Saving...' : '저장 중...') : (isEnglish ? 'Save Settings' : '설정 저장')}
        </button>
      </form>
    </section>
  )
}
