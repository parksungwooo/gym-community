import { useEffect, useMemo, useRef, useState } from 'react'
import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

const AVATAR_OPTIONS = ['RUN', 'GYM', 'ZEN', 'LIFT', 'CARD', 'FLOW']
const GOAL_OPTIONS = [3, 4, 5, 6]
const FITNESS_TAG_OPTIONS = ['러닝', '웨이트', '다이어트', '벌크업', '초보', '근육 만들기', '체력 향상', '요가']

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
  followStats,
  loading,
  authLoading,
  isAuthenticated,
  canUseCommunity,
  language,
  reminderPermission,
  onSetLanguage,
  onRequestAuth,
  onRequestReminderPermission,
  onSignOut,
  onSaveProfile,
}) {
  const { isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const fileInputRef = useRef(null)
  const isGuest = !isAuthenticated
  const avatarTag = profile?.avatar_emoji || 'RUN'
  const avatarUrl = profile?.avatar_url || ''
  const weeklyGoal = profile?.weekly_goal || 4
  const currentTags = Array.isArray(profile?.fitness_tags) ? profile.fitness_tags : []

  const [draftName, setDraftName] = useState(profile?.display_name ?? '')
  const [draftAvatar, setDraftAvatar] = useState(avatarTag)
  const [draftGoal, setDraftGoal] = useState(weeklyGoal)
  const [draftHeight, setDraftHeight] = useState(profile?.height_cm ?? '')
  const [draftTargetWeight, setDraftTargetWeight] = useState(profile?.target_weight_kg ?? '')
  const [draftBio, setDraftBio] = useState(profile?.bio ?? '')
  const [draftTags, setDraftTags] = useState(currentTags)
  const [draftDefaultShare, setDraftDefaultShare] = useState(profile?.default_share_to_feed !== false)
  const [draftReminderEnabled, setDraftReminderEnabled] = useState(profile?.reminder_enabled === true)
  const [draftReminderTime, setDraftReminderTime] = useState(profile?.reminder_time ?? '19:00')
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(avatarUrl)
  const [draftAvatarFile, setDraftAvatarFile] = useState(undefined)

  useEffect(() => {
    if (!draftAvatarUrl || !draftAvatarUrl.startsWith('blob:')) return undefined

    return () => {
      URL.revokeObjectURL(draftAvatarUrl)
    }
  }, [draftAvatarUrl])

  const activeTagOptions = useMemo(() => [...new Set([...FITNESS_TAG_OPTIONS, ...draftTags])], [draftTags])

  const nicknameMissing = !draftName.trim()
  const latestLevelLabel = latestResult?.level
    ? localizeLevelText(latestResult.level, language)
    : t('아직 테스트 전', 'Not tested yet')

  const heroDisplayName = draftName.trim() || profile?.display_name?.trim() || (
    isGuest ? t('게스트 체험 중', 'Guest Explorer') : user?.email ?? t('회원', 'Member')
  )

  const heroBio = draftBio.trim() || (
    isGuest
      ? t(
          '기록과 커뮤니티를 가볍게 둘러보는 중이에요. 계속 쓰고 싶을 때 로그인하면 됩니다.',
          'Exploring workouts and community features. Log in when you want to keep your progress.',
        )
      : t(
          '프로필은 짧게, 설정은 분명하게 두는 편이 앱을 더 쉽게 쓰는 데 도움이 돼요.',
          'Keeping the profile short and the settings clear makes the app easier to use.',
        )
  )

  const reminderPermissionLabel = reminderPermission === 'granted'
    ? t('브라우저 알림 허용됨', 'Browser alerts enabled')
    : reminderPermission === 'denied'
      ? t('브라우저 알림 차단됨', 'Browser alerts blocked')
      : reminderPermission === 'unsupported'
        ? t('브라우저 알림 미지원', 'Browser alerts unsupported')
        : t('브라우저 알림 미설정', 'Browser alerts not enabled yet')

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSaveProfile({
      displayName: draftName,
      avatarEmoji: draftAvatar,
      avatarUrl: draftAvatarUrl || null,
      avatarFile: draftAvatarFile,
      weeklyGoal: draftGoal,
      heightCm: draftHeight,
      targetWeightKg: draftTargetWeight,
      bio: draftBio,
      fitnessTags: draftTags,
      defaultShareToFeed: draftDefaultShare,
      reminderEnabled: draftReminderEnabled,
      reminderTime: draftReminderTime,
    })
  }

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setDraftAvatarFile(file)
    setDraftAvatarUrl(previewUrl)
    event.target.value = ''
  }

  const clearAvatarImage = () => {
    setDraftAvatarUrl('')
    setDraftAvatarFile(null)
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
      <section className="card profile-settings-hero compact profile-settings-hero-simple">
        <div className="profile-settings-top compact profile-settings-top-simple">
          <div className="profile-photo-stack">
            <UserAvatar
              className="profile-avatar large compact"
              imageUrl={draftAvatarUrl}
              fallback={draftAvatar}
              alt={isEnglish ? 'Profile photo' : '프로필 사진'}
            />
            <div className="profile-photo-actions">
              <button
                type="button"
                className="mini-btn primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {t('사진', 'Photo')}
              </button>
              {!!draftAvatarUrl && (
                <button type="button" className="mini-btn" onClick={clearAvatarImage} disabled={loading}>
                  {t('제거', 'Remove')}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              className="hidden-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="profile-settings-copy">
            <span className="app-section-kicker">{isGuest ? t('게스트 체험 중', 'Guest Trial') : t('프로필', 'Profile')}</span>
            <h2 className="profile-settings-name compact">{heroDisplayName}</h2>
            <p className="subtext compact">{heroBio}</p>

            {!!draftTags.length && (
              <div className="profile-tag-row">
                {draftTags.map((tag) => (
                  <span key={tag} className="profile-tag-pill">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="profile-summary-grid compact profile-summary-grid-simple">
          <SummaryStat label={t('현재 레벨', 'Current level')} value={latestLevelLabel} />
          <SummaryStat label={t('주간 목표', 'Weekly goal')} value={isEnglish ? `${stats.weeklyCount}/${draftGoal}` : `${stats.weeklyCount}/${draftGoal}회`} />
          <SummaryStat label={t('팔로워', 'Followers')} value={String(followStats?.followerCount ?? 0)} />
        </div>
      </section>

      {isGuest && (
        <div className="profile-guest-banner">
          <strong>{t('지금은 게스트 모드로 둘러보는 중이에요.', 'You are exploring in guest mode right now.')}</strong>
          <p>
            {t(
              '운동 기록과 프로필 설정은 둘러볼 수 있고, 계속 쓰고 싶을 때 로그인해서 이어가면 돼요.',
              'You can explore workouts and profile settings now, then log in when you want to keep them.',
            )}
          </p>
          <button type="button" className="primary-btn" onClick={onRequestAuth} disabled={authLoading}>
            {authLoading ? t('열고 있어요', 'Opening...') : t('로그인해서 이어쓰기', 'Log in to keep progress')}
          </button>
        </div>
      )}

      {!isGuest && !canUseCommunity && (
        <div className="profile-guest-banner">
          <strong>{t('커뮤니티를 이용하려면 닉네임이 필요해요.', 'Community access needs a nickname.')}</strong>
          <p>
            {t(
              '닉네임을 저장하면 바로 커뮤니티 탭을 이용할 수 있어요.',
              'Save a nickname first and the community tab will open normally.',
            )}
          </p>
        </div>
      )}

      <form className="profile-settings-stack compact" onSubmit={handleSubmit}>
        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{t('내 정보', 'Identity')}</span>
            <h2 className="app-section-title small">{t('프로필 기본 정보', 'Profile basics')}</h2>
          </div>

          <SettingRow
            label={t('닉네임 (필수)', 'Nickname (Required)')}
            helper={t('프로필을 저장하려면 닉네임이 필요해요.', 'A nickname is required before saving your profile.')}
            compact
          >
            <div className="settings-input-stack">
              <input
                className={`workout-input settings-input compact ${nicknameMissing ? 'invalid' : ''}`}
                type="text"
                maxLength="20"
                required
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder={t('예: 러닝메이트', 'ex: RunningMate')}
                disabled={loading}
              />
              {nicknameMissing && (
                <span className="field-error-text">
                  {t('프로필을 저장하려면 닉네임을 입력해주세요.', 'Enter a nickname to save your profile.')}
                </span>
              )}
            </div>
          </SettingRow>

          <SettingRow
            label={t('프로필 사진', 'Profile photo')}
            helper={t('여기서 올린 사진은 커뮤니티 카드에도 같이 보여요.', 'This photo will also appear on community cards.')}
            compact
          >
            <div className="profile-photo-field">
              <UserAvatar
                className="profile-photo-preview"
                imageUrl={draftAvatarUrl}
                fallback={draftAvatar}
                alt={isEnglish ? 'Profile preview' : '프로필 미리보기'}
              />
              <div className="profile-photo-field-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {t('사진 업로드', 'Upload photo')}
                </button>
                {!!draftAvatarUrl && (
                  <button type="button" className="ghost-btn" onClick={clearAvatarImage} disabled={loading}>
                    {t('사진 제거', 'Remove photo')}
                  </button>
                )}
              </div>
            </div>
          </SettingRow>

          <SettingRow
            label={t('기본 아바타 태그', 'Fallback avatar style')}
            helper={t('프로필 사진이 없을 때 대신 보여주는 태그예요.', 'Shown when a profile photo is not set.')}
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
            label={t('한줄 소개', 'Bio')}
            helper={t('요즘 집중하는 운동 목표를 짧게 적어보세요.', 'Describe your current workout focus in one short line.')}
            compact
          >
            <textarea
              className="workout-textarea settings-textarea compact"
              rows="3"
              maxLength="90"
              value={draftBio}
              onChange={(event) => setDraftBio(event.target.value)}
              placeholder={t('예: 주 3회 운동 습관 만드는 중이에요.', 'ex: Building a steady 3-day workout habit.')}
              disabled={loading}
            />
          </SettingRow>

          <SettingRow
            label={t('운동 태그', 'Workout tags')}
            helper={t('내 운동 스타일을 보여주는 태그를 최대 4개까지 골라보세요.', 'Choose up to four tags that describe your style.')}
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
            <span className="app-section-kicker">{t('기본 설정', 'Preferences')}</span>
            <h2 className="app-section-title small">{t('공개, 목표, 리마인더', 'Sharing, goals, and reminders')}</h2>
          </div>

          <SettingRow
            label={t('키', 'Height')}
            helper={t('BMI 계산에 사용돼요.', 'Used for BMI calculation.')}
            compact
          >
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              step="0.1"
              value={draftHeight}
              onChange={(event) => setDraftHeight(event.target.value)}
              placeholder={t('키 (cm)', 'Height (cm)')}
              disabled={loading}
            />
          </SettingRow>

          <SettingRow
            label={t('목표 체중', 'Target weight')}
            helper={t('체중 목표 진행률 계산에 사용돼요.', 'Used for weight-goal progress tracking.')}
            compact
          >
            <input
              className="workout-input settings-input compact"
              type="number"
              min="1"
              step="0.1"
              value={draftTargetWeight}
              onChange={(event) => setDraftTargetWeight(event.target.value)}
              placeholder={t('목표 체중 (kg)', 'Target weight (kg)')}
              disabled={loading}
            />
          </SettingRow>

          <SettingRow
            label={t('기본 피드 공개', 'Default feed sharing')}
            helper={t('새 운동 기록은 이 공개값으로 시작해요.', 'New workout logs start with this sharing option.')}
            compact
          >
            <button
              type="button"
              className={`toggle-chip ${draftDefaultShare ? 'active' : ''}`}
              onClick={() => setDraftDefaultShare((prev) => !prev)}
              disabled={loading}
            >
              {draftDefaultShare ? t('기본 공개', 'Public by default') : t('기본 비공개', 'Private by default')}
            </button>
          </SettingRow>

          <SettingRow
            label={t('운동 목표', 'Workout target')}
            helper={t('홈 화면 주간 목표에 반영돼요.', 'Used for the challenge target on the home screen.')}
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

          <SettingRow
            label={t('운동 리마인더', 'Workout reminder')}
            helper={t('선택한 시간에 홈 카드와 브라우저 알림으로 다시 알려줘요.', 'Shows a home reminder card and optional browser alert at the time you choose.')}
            compact
          >
            <div className="settings-reminder-stack">
              <button
                type="button"
                className={`toggle-chip ${draftReminderEnabled ? 'active' : ''}`}
                onClick={() => setDraftReminderEnabled((prev) => !prev)}
                disabled={loading}
              >
                {draftReminderEnabled ? t('리마인더 켜짐', 'Reminder on') : t('리마인더 꺼짐', 'Reminder off')}
              </button>

              {draftReminderEnabled && (
                <>
                  <input
                    className="workout-input settings-input compact"
                    type="time"
                    value={draftReminderTime}
                    onChange={(event) => setDraftReminderTime(event.target.value)}
                    disabled={loading}
                  />
                  <div className="settings-reminder-meta">
                    <span>{reminderPermissionLabel}</span>
                    {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' && (
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={onRequestReminderPermission}
                        disabled={loading}
                      >
                        {t('브라우저 알림 허용', 'Allow browser alert')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </SettingRow>

          <p className="subtext compact settings-inline-note">
            {t('체중 기록과 변화 추이는 기록 탭에서 바로 관리할 수 있어요.', 'Weight logging and trends now live in the Records tab.')}
          </p>
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{t('앱', 'App')}</span>
            <h2 className="app-section-title small">{t('언어와 계정', 'Language and account')}</h2>
          </div>

          <SettingRow
            label={t('언어', 'Language')}
            helper={t('앱 전체에 사용할 언어를 선택해주세요.', 'Choose the language for the app.')}
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
            label={t('계정', 'Account')}
            helper={
              isGuest
                ? t('지금은 게스트 체험 모드예요.', 'You are currently using the app in guest mode.')
                : t('연결된 계정으로 로그인된 상태예요.', 'Your connected account is active.')
            }
            compact
          >
            <div className="profile-auth-actions compact">
              {isGuest ? (
                <button
                  type="button"
                  className="secondary-btn settings-signout-btn compact"
                  onClick={onRequestAuth}
                  disabled={authLoading}
                >
                  {authLoading ? t('열고 있어요', 'Opening...') : t('로그인 / 회원가입', 'Log in / Sign up')}
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-btn settings-signout-btn compact"
                  onClick={onSignOut}
                  disabled={authLoading}
                >
                  {authLoading ? t('처리 중...', 'Working...') : t('로그아웃', 'Sign out')}
                </button>
              )}
            </div>
          </SettingRow>
        </section>

        <button type="submit" className="primary-btn settings-save-btn compact" disabled={loading || nicknameMissing}>
          {loading ? t('저장 중...', 'Saving...') : t('설정 저장', 'Save settings')}
        </button>
      </form>
    </section>
  )
}
