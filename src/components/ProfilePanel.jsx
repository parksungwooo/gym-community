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

function MenuButton({ menuKey, label, meta, active, onClick }) {
  return (
    <button
      type="button"
      className={`profile-menu-button ${active ? 'active' : ''}`}
      onClick={onClick}
      data-testid={`profile-menu-${menuKey}`}
    >
      <div className="profile-menu-button-copy">
        <strong>{label}</strong>
        <span>{meta}</span>
      </div>
    </button>
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
  onGoProgress,
  onSaveProfile,
}) {
  const { isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const fileInputRef = useRef(null)
  const nicknameInputRef = useRef(null)
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
  const [activeSection, setActiveSection] = useState('profile')

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
  const heroLevelLabel = latestResult?.level
    ? localizeLevelText(latestResult.level, language)
    : t('미측정', 'No test')

  const heroDisplayName = draftName.trim() || profile?.display_name?.trim() || (
    isGuest ? t('게스트 체험 중', 'Guest Explorer') : user?.email ?? t('회원', 'Member')
  )

  const heroBio = draftBio.trim() || (
    isGuest
      ? t(
          '둘러보는 중이에요.',
          'Looking around.',
        )
      : t(
          '짧아도 충분해요.',
          'Short is enough.',
        )
  )

  const reminderPermissionLabel = reminderPermission === 'granted'
    ? t('알림 허용', 'Alerts on')
    : reminderPermission === 'denied'
      ? t('알림 차단', 'Alerts blocked')
      : reminderPermission === 'unsupported'
        ? t('알림 미지원', 'Alerts unsupported')
        : t('알림 꺼짐', 'Alerts off')

  const hasWorkoutHistory = Boolean(stats?.lastWorkoutDate) || Number(stats?.weeklyCount ?? 0) > 0
  const readySteps = [
    { key: 'account', label: t('로그인', 'Login'), done: !isGuest },
    { key: 'nickname', label: t('닉네임', 'Nickname'), done: !nicknameMissing },
    { key: 'level', label: t('레벨', 'Level'), done: Boolean(latestResult) },
    { key: 'record', label: t('첫 기록', 'First log'), done: hasWorkoutHistory },
  ]
  const readyStepCount = readySteps.filter((step) => step.done).length

  const menuItems = [
    {
      key: 'profile',
      label: t('프로필', 'Profile'),
      meta: t('사진 · 소개', 'Photo · bio'),
    },
    {
      key: 'activity',
      label: t('내 활동', 'My activity'),
      meta: t('목표 · 몸', 'Goal · body'),
    },
    {
      key: 'community',
      label: t('커뮤니티', 'Community'),
      meta: t('공개 · 팔로우', 'Sharing · follows'),
    },
    {
      key: 'settings',
      label: t('설정', 'Settings'),
      meta: t('알림 · 앱', 'Alerts · app'),
    },
  ]

  const activeSectionTitle = menuItems.find((item) => item.key === activeSection)?.label ?? t('프로필', 'Profile')

  const focusNicknameField = () => {
    setActiveSection('profile')
    window.requestAnimationFrame(() => {
      nicknameInputRef.current?.focus()
    })
  }

  const setupCard = (() => {
    if (isGuest) {
      return {
        title: t('로그인하면 기록이 이어져요.', 'Log in to keep your progress.'),
        body: t('운동, 체중, 프로필이 계정에 저장돼요.', 'Workouts, weight, and profile save to your account.'),
        actionLabel: t('로그인', 'Log in'),
        action: onRequestAuth,
      }
    }

    if (nicknameMissing || !canUseCommunity) {
      return {
        title: t('닉네임 저장하면 커뮤니티가 열려요.', 'Save a nickname to open community.'),
        body: t('이름만 저장하면 피드와 메이트를 바로 볼 수 있어요.', 'A nickname is enough for feed and mates.'),
        actionLabel: t('닉네임 입력', 'Add nickname'),
        action: focusNicknameField,
      }
    }

    if (!latestResult) {
      return {
        title: t('레벨 테스트부터 해보세요.', 'Start with the level test.'),
        body: t('기록 탭에서 한 번만 하면 요약이 더 잘 맞아요.', 'One quick check makes the summaries fit better.'),
        actionLabel: t('기록 탭 가기', 'Go to Records'),
        action: onGoProgress,
      }
    }

    if (!hasWorkoutHistory) {
      return {
        title: t('첫 운동 기록부터 시작해요.', 'Start with your first workout log.'),
        body: t('기록 탭 한 번이면 홈과 달력이 채워져요.', 'One log starts filling Home and the calendar.'),
        actionLabel: t('기록 탭 가기', 'Go to Records'),
        action: onGoProgress,
      }
    }

    return null
  })()

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
    <section className="profile-settings-screen compact-profile-screen profile-menu-screen">
      <section className="card profile-settings-hero compact profile-settings-hero-simple">
        <div className="profile-settings-top compact profile-settings-top-simple">
          <div className="profile-photo-stack">
            <UserAvatar
              className="profile-avatar large compact"
              imageUrl={draftAvatarUrl}
              fallback={draftAvatar}
              alt={isEnglish ? 'Profile photo' : '프로필 사진'}
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
          <SummaryStat label={t('레벨', 'Level')} value={heroLevelLabel} />
          <SummaryStat label={t('목표', 'Goal')} value={`${stats.weeklyCount}/${draftGoal}`} />
          <SummaryStat label={t('팔로워', 'Followers')} value={String(followStats?.followerCount ?? 0)} />
        </div>
      </section>

      {setupCard && (
        <section className="card profile-next-step-card compact">
          <div className="app-section-heading compact">
            <div>
              <span className="app-section-kicker">{t('다음', 'Next')}</span>
              <h2 className="app-section-title small">{t('프로필 준비', 'Profile setup')}</h2>
            </div>
            <span className="community-mini-pill accent">{`${readyStepCount}/${readySteps.length}`}</span>
          </div>

          <div className="profile-next-step-copy">
            <strong>{setupCard.title}</strong>
            <p>{setupCard.body}</p>
          </div>

          <div className="profile-next-step-status">
            {readySteps.map((step) => (
              <span key={step.key} className={`profile-next-step-chip ${step.done ? 'done' : ''}`}>
                {step.label}
              </span>
            ))}
          </div>

          <div className="profile-next-step-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={setupCard.action}
              disabled={loading || authLoading}
            >
              {setupCard.actionLabel}
            </button>
          </div>
        </section>
      )}

      <section className="card settings-card compact profile-menu-launcher">
        <div className="app-section-heading compact">
          <div>
            <span className="app-section-kicker">{t('마이페이지', 'My page')}</span>
            <h2 className="app-section-title small">{t('메뉴', 'Menu')}</h2>
          </div>
          <span className="community-mini-pill">{activeSectionTitle}</span>
        </div>

        <div className="profile-menu-grid">
          {menuItems.map((item) => (
            <MenuButton
              key={item.key}
              menuKey={item.key}
              label={item.label}
              meta={item.meta}
              active={activeSection === item.key}
              onClick={() => setActiveSection(item.key)}
            />
          ))}
        </div>
      </section>

      <form className="profile-settings-stack compact" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          className="hidden-file-input"
          type="file"
          accept="image/*"
          onChange={handleAvatarFileChange}
        />

        {activeSection === 'profile' && (
          <section className="card settings-card compact">
            <div className="settings-card-header compact">
              <span className="app-section-kicker">{t('내 정보', 'Identity')}</span>
              <h2 className="app-section-title small">{t('프로필 기본 정보', 'Profile basics')}</h2>
            </div>

            <SettingRow
              label={t('닉네임', 'Nickname')}
              helper={t('저장에 필요해요.', 'Needed to save.')}
              compact
            >
              <div className="settings-input-stack">
                <input
                  ref={nicknameInputRef}
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
                    {t('닉네임을 입력해 주세요.', 'Enter a nickname.')}
                  </span>
                )}
              </div>
            </SettingRow>

            <SettingRow
              label={t('프로필 사진', 'Profile photo')}
              helper={t('커뮤니티에도 보여요.', 'Shows in community.')}
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
                      {t('삭제', 'Remove')}
                    </button>
                  )}
                </div>
              </div>
            </SettingRow>

            <SettingRow
              label={t('기본 아바타', 'Avatar tag')}
              helper={t('사진 없을 때 보여요.', 'Used without a photo.')}
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
              helper={t('한 줄이면 돼요.', 'One short line.')}
              compact
            >
              <textarea
                className="workout-textarea settings-textarea compact"
                rows="3"
                maxLength="90"
                value={draftBio}
                onChange={(event) => setDraftBio(event.target.value)}
                placeholder={t('예: 주 3회 운동 중', 'ex: 3 workouts a week')}
                disabled={loading}
              />
            </SettingRow>

            <SettingRow
              label={t('운동 태그', 'Workout tags')}
              helper={t('최대 4개', 'Up to 4.')}
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
        )}

        {activeSection === 'activity' && (
          <section className="card settings-card compact">
            <div className="settings-card-header compact">
              <span className="app-section-kicker">{t('내 활동', 'Activity')}</span>
              <h2 className="app-section-title small">{t('목표', 'Goals')}</h2>
            </div>

            <div className="profile-summary-grid compact profile-menu-summary-grid">
              <SummaryStat label={t('현재 레벨', 'Current level')} value={latestLevelLabel} />
              <SummaryStat label={t('주간 목표', 'Weekly goal')} value={isEnglish ? `${stats.weeklyCount}/${draftGoal}` : `${stats.weeklyCount}/${draftGoal}회`} />
              <SummaryStat label={t('팔로잉', 'Following')} value={String(followStats?.followingCount ?? 0)} />
            </div>

            <SettingRow
              label={t('키', 'Height')}
              helper={t('BMI용', 'For BMI.')}
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
              helper={t('진행률용', 'For progress.')}
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
              label={t('운동 목표', 'Workout target')}
              helper={t('홈에 보여요.', 'Shown on Home.')}
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

            <p className="subtext compact settings-inline-note">
              {t('체중 기록은 기록 탭', 'Log weight in Records.')}
            </p>
          </section>
        )}

        {activeSection === 'community' && (
          <section className="card settings-card compact">
            <div className="settings-card-header compact">
              <span className="app-section-kicker">{t('커뮤니티', 'Community')}</span>
              <h2 className="app-section-title small">{t('공개', 'Sharing')}</h2>
            </div>

            <div className="profile-summary-grid compact profile-menu-summary-grid">
              <SummaryStat label={t('팔로워', 'Followers')} value={String(followStats?.followerCount ?? 0)} />
              <SummaryStat label={t('팔로잉', 'Following')} value={String(followStats?.followingCount ?? 0)} />
              <SummaryStat label={t('닉네임 상태', 'Nickname')} value={nicknameMissing ? t('필요', 'Required') : t('완료', 'Ready')} />
            </div>

            <SettingRow
              label={t('기본 피드 공개', 'Default feed sharing')}
              helper={t('새 기록 기본값', 'Default for new logs.')}
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

            <div className="profile-menu-note-card">
              <strong>{t('닉네임과 사진이 보여요.', 'Nickname and photo show.')}</strong>
              <p>{t('짧을수록 좋아요.', 'Short looks better.')}</p>
            </div>
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="card settings-card compact">
            <div className="settings-card-header compact">
              <span className="app-section-kicker">{t('설정', 'Settings')}</span>
              <h2 className="app-section-title small">{t('설정', 'Settings')}</h2>
            </div>

            <SettingRow
              label={t('운동 리마인더', 'Workout reminder')}
              helper={t('그 시간에 알려줘요.', 'Alerts at that time.')}
              compact
            >
              <div className="settings-reminder-stack">
                <button
                  type="button"
                  className={`toggle-chip ${draftReminderEnabled ? 'active' : ''}`}
                  onClick={() => setDraftReminderEnabled((prev) => !prev)}
                  disabled={loading}
                >
                  {draftReminderEnabled ? t('켜짐', 'On') : t('꺼짐', 'Off')}
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
                          {t('허용', 'Allow')}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </SettingRow>

            <SettingRow
              label={t('언어', 'Language')}
              helper={t('앱 언어', 'App language.')}
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
                  ? t('게스트 모드', 'Guest mode.')
                  : t('로그인됨', 'Signed in.')
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
                    {authLoading ? t('여는 중', 'Opening') : t('로그인', 'Log in')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secondary-btn settings-signout-btn compact"
                    onClick={onSignOut}
                    disabled={authLoading}
                  >
                    {authLoading ? t('처리 중', 'Working') : t('로그아웃', 'Sign out')}
                  </button>
                )}
              </div>
            </SettingRow>
          </section>
        )}

        <button type="submit" className="primary-btn settings-save-btn compact" disabled={loading || nicknameMissing}>
          {loading ? t('저장 중...', 'Saving...') : t('저장', 'Save')}
        </button>
      </form>
    </section>
  )
}
