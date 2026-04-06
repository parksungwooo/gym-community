import { useEffect, useState } from 'react'
import { getBadgeLabel, useI18n } from '../i18n.js'
import { getBmiCategory } from '../utils/bodyMetrics'
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
  bodyMetrics,
  loading,
  authLoading,
  language,
  onSetLanguage,
  onGoogleSignIn,
  onKakaoSignIn,
  onSignOut,
  onSaveProfile,
  onSaveWeight,
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
  const [draftHeight, setDraftHeight] = useState(profile?.height_cm ?? '')
  const [draftTargetWeight, setDraftTargetWeight] = useState(profile?.target_weight_kg ?? '')
  const [draftWeight, setDraftWeight] = useState(bodyMetrics?.latestWeightKg ?? '')

  useEffect(() => {
    setDraftName(displayName)
  }, [displayName])

  useEffect(() => {
    setDraftAvatar(avatarTag)
  }, [avatarTag])

  useEffect(() => {
    setDraftGoal(weeklyGoal)
  }, [weeklyGoal])

  useEffect(() => {
    setDraftHeight(profile?.height_cm ?? '')
    setDraftTargetWeight(profile?.target_weight_kg ?? '')
  }, [profile?.height_cm, profile?.target_weight_kg])

  useEffect(() => {
    setDraftWeight(bodyMetrics?.latestWeightKg ?? '')
  }, [bodyMetrics?.latestWeightKg])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSaveProfile({
      displayName: draftName,
      avatarEmoji: draftAvatar,
      weeklyGoal: draftGoal,
      heightCm: draftHeight,
      targetWeightKg: draftTargetWeight,
    })
  }

  const handleWeightSubmit = async (event) => {
    event.preventDefault()
    await onSaveWeight(draftWeight)
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
                    ? 'Keep your profile, body data, and goals in one tidy place.'
                    : '프로필, 체형 데이터, 목표를 한곳에서 관리해보세요.')}
            </p>
          </div>
        </div>

        <div className="profile-summary-grid compact">
          <SummaryStat
            label={isEnglish ? 'Level' : '레벨'}
            value={latestResult?.level ? localizeLevelText(latestResult.level, language) : (isEnglish ? 'Not tested' : '측정 전')}
          />
          <SummaryStat
            label={isEnglish ? 'This Week' : '이번 주'}
            value={isEnglish ? `${stats.weeklyCount}/${weeklyGoal}` : `${stats.weeklyCount}/${weeklyGoal}회`}
          />
          <SummaryStat
            label={isEnglish ? 'BMI' : 'BMI'}
            value={bodyMetrics?.bmi != null ? `${bodyMetrics.bmi}` : (isEnglish ? 'Pending' : '대기 중')}
          />
          <SummaryStat
            label={isEnglish ? 'Weight' : '체중'}
            value={bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'}
          />
          <SummaryStat
            label={isEnglish ? 'Goal' : '목표'}
            value={bodyMetrics?.targetWeightKg != null ? `${bodyMetrics.targetWeightKg} kg` : '--'}
          />
          <SummaryStat
            label={isEnglish ? 'Badge' : '배지'}
            value={featuredBadge}
          />
        </div>
      </section>

      <section className="card settings-card compact">
        <div className="settings-card-header compact">
          <span className="app-section-kicker">{isEnglish ? 'Body' : '바디'}</span>
          <h2 className="app-section-title small">{isEnglish ? 'Weight Tracking' : '체중 관리'}</h2>
        </div>

        <form className="weight-log-form" onSubmit={handleWeightSubmit}>
          <div className="weight-log-row">
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              step="0.1"
              value={draftWeight}
              onChange={(event) => setDraftWeight(event.target.value)}
              placeholder={isEnglish ? 'Current weight (kg)' : '현재 몸무게 (kg)'}
              disabled={loading}
            />
            <button type="submit" className="secondary-btn weight-log-btn" disabled={loading}>
              {loading ? (isEnglish ? 'Saving...' : '저장 중...') : (isEnglish ? 'Save Weight' : '몸무게 저장')}
            </button>
          </div>
        </form>

        <div className="settings-goal-summary compact body-summary">
          <span>{isEnglish ? 'Current body status' : '현재 몸 상태'}</span>
          <strong>
            {bodyMetrics?.bmi != null
              ? `${bodyMetrics.bmi} · ${getBmiCategory(bodyMetrics.bmi, isEnglish)}`
              : (isEnglish ? 'Add height + weight to calculate BMI' : '키와 몸무게를 입력하면 BMI가 계산돼요')}
          </strong>
        </div>
      </section>

      <section className="card settings-card compact">
        <div className="settings-card-header compact">
          <span className="app-section-kicker">{isEnglish ? 'App' : '앱'}</span>
          <h2 className="app-section-title small">{isEnglish ? 'Language & Account' : '언어와 계정'}</h2>
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
            <span className="app-section-kicker">{isEnglish ? 'Body Goal' : '체형 목표'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Health Profile' : '건강 프로필'}</h2>
          </div>

          <SettingRow
            label={isEnglish ? 'Height' : '키'}
            helper={isEnglish ? 'Used for BMI calculation.' : 'BMI 계산에 사용돼요.'}
            compact
          >
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              step="0.1"
              value={draftHeight}
              onChange={(event) => setDraftHeight(event.target.value)}
              placeholder={isEnglish ? 'Height (cm)' : '키 (cm)'}
              disabled={loading}
            />
          </SettingRow>

          <SettingRow
            label={isEnglish ? 'Target Weight' : '목표 체중'}
            helper={isEnglish ? 'Used for progress tracking.' : '진행률 계산에 사용돼요.'}
            compact
          >
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              step="0.1"
              value={draftTargetWeight}
              onChange={(event) => setDraftTargetWeight(event.target.value)}
              placeholder={isEnglish ? 'Target weight (kg)' : '목표 체중 (kg)'}
              disabled={loading}
            />
          </SettingRow>
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{isEnglish ? 'Goal' : '목표'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Weekly Goal' : '주간 목표'}</h2>
          </div>

          <SettingRow
            label={isEnglish ? 'Workout Target' : '운동 목표'}
            helper={isEnglish ? 'This sets the challenge target on the home screen.' : '홈 화면 챌린지 목표로 사용돼요.'}
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
