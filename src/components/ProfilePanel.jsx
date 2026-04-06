import { useEffect, useMemo, useState } from 'react'
import { getBadgeLabel, useI18n } from '../i18n.js'
import { getBmiCategory } from '../utils/bodyMetrics'
import { localizeLevelText } from '../utils/level'

const AVATAR_OPTIONS = ['RUN', 'GYM', 'ZEN', 'LIFT', 'CARD', 'FLOW']
const GOAL_OPTIONS = [3, 4, 5, 6]
const FITNESS_TAG_OPTIONS = ['러닝', '웨이트', '다이어트', '벌크업', '초보', '습관 만들기', '체력 향상', '홈트']

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

function ProgressPill({ label, value, accent = 'default' }) {
  return (
    <article className={`profile-progress-pill ${accent}`}>
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
  followStats,
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
  const currentTags = Array.isArray(profile?.fitness_tags) ? profile.fitness_tags : []
  const goalProgressLabel = bodyMetrics?.goalProgressPercent != null ? `${bodyMetrics.goalProgressPercent}%` : '--'
  const bodyStatusLabel = bodyMetrics?.bmi != null
    ? `${bodyMetrics.bmi} · ${getBmiCategory(bodyMetrics.bmi, isEnglish)}`
    : (isEnglish ? 'Set body data' : '바디 정보 설정')

  const [draftName, setDraftName] = useState(displayName)
  const [draftAvatar, setDraftAvatar] = useState(avatarTag)
  const [draftGoal, setDraftGoal] = useState(weeklyGoal)
  const [draftHeight, setDraftHeight] = useState(profile?.height_cm ?? '')
  const [draftTargetWeight, setDraftTargetWeight] = useState(profile?.target_weight_kg ?? '')
  const [draftWeight, setDraftWeight] = useState(bodyMetrics?.latestWeightKg ?? '')
  const [draftBio, setDraftBio] = useState(profile?.bio ?? '')
  const [draftTags, setDraftTags] = useState(currentTags)
  const [draftDefaultShare, setDraftDefaultShare] = useState(profile?.default_share_to_feed !== false)

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
    setDraftBio(profile?.bio ?? '')
    setDraftTags(currentTags)
    setDraftDefaultShare(profile?.default_share_to_feed !== false)
  }, [profile?.height_cm, profile?.target_weight_kg, profile?.bio, profile?.default_share_to_feed, currentTags])

  useEffect(() => {
    setDraftWeight(bodyMetrics?.latestWeightKg ?? '')
  }, [bodyMetrics?.latestWeightKg])

  const activeTagOptions = useMemo(
    () => [...new Set([...FITNESS_TAG_OPTIONS, ...draftTags])],
    [draftTags],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSaveProfile({
      displayName: draftName,
      avatarEmoji: draftAvatar,
      weeklyGoal: draftGoal,
      heightCm: draftHeight,
      targetWeightKg: draftTargetWeight,
      bio: draftBio,
      fitnessTags: draftTags,
      defaultShareToFeed: draftDefaultShare,
    })
  }

  const handleWeightSubmit = async (event) => {
    event.preventDefault()
    await onSaveWeight(draftWeight)
  }

  const toggleTag = (tag) => {
    setDraftTags((prev) => {
      if (prev.includes(tag)) return prev.filter((item) => item !== tag)
      if (prev.length >= 4) return prev
      return [...prev, tag]
    })
  }

  return (
    <section className="profile-settings-screen compact-profile-screen">
      <section className="card profile-settings-hero compact profile-hero-upgraded">
        <div className="profile-settings-top compact">
          <div className="profile-avatar large compact">{draftAvatar}</div>
          <div className="profile-settings-copy">
            <span className="app-section-kicker">{isEnglish ? 'Profile Hub' : '프로필 허브'}</span>
            <h2 className="profile-settings-name compact">{displayName}</h2>
            <p className="subtext compact">
              {profile?.bio?.trim()
                ? profile.bio
                : isGuest
                  ? (isEnglish ? 'Start with guest mode, then shape your profile as you go.' : '게스트 모드로 시작하고, 천천히 내 프로필을 채워가보세요.')
                  : (isEnglish ? 'Add a short intro and tags so your page feels more like you.' : '한줄 소개와 태그를 더하면 내 페이지가 훨씬 살아나요.')}
            </p>
          </div>
        </div>

        {!!currentTags.length && (
          <div className="profile-tag-row">
            {currentTags.map((tag) => (
              <span key={tag} className="profile-tag-pill">{tag}</span>
            ))}
          </div>
        )}

        <div className="profile-progress-strip">
          <ProgressPill
            label={isEnglish ? 'Weekly Goal' : '주간 목표'}
            value={isEnglish ? `${stats.weeklyCount}/${weeklyGoal}` : `${stats.weeklyCount}/${weeklyGoal}회`}
            accent="cool"
          />
          <ProgressPill
            label={isEnglish ? 'Streak' : '연속 기록'}
            value={isEnglish ? `${stats.streak} days` : `${stats.streak}일`}
            accent="warm"
          />
          <ProgressPill
            label={isEnglish ? 'Body Goal' : '체중 목표'}
            value={goalProgressLabel}
          />
          <ProgressPill
            label={isEnglish ? 'Share Default' : '기본 공개'}
            value={draftDefaultShare ? (isEnglish ? 'Public' : '공개') : (isEnglish ? 'Private' : '비공개')}
          />
        </div>

        <div className="profile-summary-grid compact">
          <SummaryStat
            label={isEnglish ? 'Level' : '레벨'}
            value={latestResult?.level ? localizeLevelText(latestResult.level, language) : (isEnglish ? 'Not tested' : '측정 전')}
          />
          <SummaryStat
            label={isEnglish ? 'Body' : '몸 상태'}
            value={bodyStatusLabel}
          />
          <SummaryStat
            label={isEnglish ? 'Weight' : '체중'}
            value={bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'}
          />
          <SummaryStat
            label={isEnglish ? 'Followers' : '팔로워'}
            value={String(followStats?.followerCount ?? 0)}
          />
          <SummaryStat
            label={isEnglish ? 'Following' : '팔로잉'}
            value={String(followStats?.followingCount ?? 0)}
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
          <strong>{bodyStatusLabel}</strong>
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
            <button type="button" className={`lang-btn ${language === 'ko' ? 'active' : ''}`} onClick={() => onSetLanguage('ko')}>한국어</button>
            <button type="button" className={`lang-btn ${language === 'en' ? 'active' : ''}`} onClick={() => onSetLanguage('en')}>English</button>
          </div>
        </SettingRow>

        <SettingRow
          label={isEnglish ? 'Account' : '계정'}
          helper={isGuest ? (isEnglish ? 'You are currently using guest mode.' : '현재는 게스트 모드로 사용 중이에요.') : (isEnglish ? 'Your connected account is active.' : '연결된 계정으로 사용 중이에요.')}
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
            <span className="app-section-kicker">{isEnglish ? 'Identity' : '정체성'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Profile Basics' : '프로필 기본값'}</h2>
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
            label={isEnglish ? 'Bio' : '한줄 소개'}
            helper={isEnglish ? 'One short line that describes your current focus.' : '지금의 운동 방향을 짧게 소개해보세요.'}
            compact
          >
            <textarea
              className="workout-textarea settings-textarea compact"
              rows="3"
              maxLength="90"
              value={draftBio}
              onChange={(event) => setDraftBio(event.target.value)}
              placeholder={isEnglish ? 'ex: Building a steady 3-day workout habit.' : '예: 주 3회 운동 습관을 만드는 중이에요.'}
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

          <SettingRow
            label={isEnglish ? 'Workout Tags' : '운동 태그'}
            helper={isEnglish ? 'Choose up to 4 tags that describe your style.' : '내 스타일을 보여주는 태그를 최대 4개까지 골라보세요.'}
            compact
          >
            <div className="profile-tag-selector">
              {activeTagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip ${draftTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                  disabled={loading || (!draftTags.includes(tag) && draftTags.length >= 4)}
                >
                  {tag}
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

          <SettingRow label={isEnglish ? 'Height' : '키'} helper={isEnglish ? 'Used for BMI calculation.' : 'BMI 계산에 사용돼요.'} compact>
            <input className="workout-input settings-input compact" type="number" min="1" step="0.1" value={draftHeight} onChange={(event) => setDraftHeight(event.target.value)} placeholder={isEnglish ? 'Height (cm)' : '키 (cm)'} disabled={loading} />
          </SettingRow>

          <SettingRow label={isEnglish ? 'Target Weight' : '목표 체중'} helper={isEnglish ? 'Used for progress tracking.' : '진행률 계산에 사용돼요.'} compact>
            <input className="workout-input settings-input compact" type="number" min="1" step="0.1" value={draftTargetWeight} onChange={(event) => setDraftTargetWeight(event.target.value)} placeholder={isEnglish ? 'Target weight (kg)' : '목표 체중 (kg)'} disabled={loading} />
          </SettingRow>
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{isEnglish ? 'Defaults' : '기본값'}</span>
            <h2 className="app-section-title small">{isEnglish ? 'Sharing & Goals' : '공개와 목표'}</h2>
          </div>

          <SettingRow
            label={isEnglish ? 'Default Feed Sharing' : '기본 피드 공개'}
            helper={isEnglish ? 'New workout logs will start with this sharing option.' : '새 운동 기록 작성 시 이 공개값이 기본으로 들어가요.'}
            compact
          >
            <button
              type="button"
              className={`toggle-chip ${draftDefaultShare ? 'active' : ''}`}
              onClick={() => setDraftDefaultShare((prev) => !prev)}
              disabled={loading}
            >
              {draftDefaultShare ? (isEnglish ? 'Public by default' : '기본 공개') : (isEnglish ? 'Private by default' : '기본 비공개')}
            </button>
          </SettingRow>

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
