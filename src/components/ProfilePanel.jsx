import { useEffect, useMemo, useRef, useState } from 'react'
import UserAvatar from './UserAvatar'
import { getBadgeLabel, useI18n } from '../i18n.js'
import { getActivityLevelProgress } from '../utils/activityLevel'
import { getBmiCategory } from '../utils/bodyMetrics'
import { localizeLevelText } from '../utils/level'
import { PREMIUM_CONTEXT } from '../utils/premium'

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
  activitySummary,
  achievementBadges = [],
  challenge,
  bodyMetrics,
  followStats,
  loading,
  authLoading,
  isAuthenticated,
  canUseCommunity,
  language,
  reminderPermission,
  isPro,
  onOpenPaywall,
  onSetLanguage,
  onRequestAuth,
  onRequestReminderPermission,
  onSignOut,
  onSaveProfile,
  onSaveWeight,
}) {
  const { isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const fileInputRef = useRef(null)
  const isGuest = !isAuthenticated
  const avatarTag = profile?.avatar_emoji || 'RUN'
  const avatarUrl = profile?.avatar_url || ''
  const weeklyGoal = profile?.weekly_goal || 4
  const currentTags = Array.isArray(profile?.fitness_tags) ? profile.fitness_tags : []
  const featuredBadge = getBadgeLabel(badges[badges.length - 1] ?? 'starter', language)

  const [draftName, setDraftName] = useState(profile?.display_name ?? '')
  const [draftAvatar, setDraftAvatar] = useState(avatarTag)
  const [draftGoal, setDraftGoal] = useState(weeklyGoal)
  const [draftHeight, setDraftHeight] = useState(profile?.height_cm ?? '')
  const [draftTargetWeight, setDraftTargetWeight] = useState(profile?.target_weight_kg ?? '')
  const [draftWeight, setDraftWeight] = useState(bodyMetrics?.latestWeightKg ?? '')
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

  const activeTagOptions = useMemo(
    () => [...new Set([...FITNESS_TAG_OPTIONS, ...draftTags])],
    [draftTags],
  )

  const nicknameMissing = !draftName.trim()
  const activityProgress = getActivityLevelProgress(activitySummary?.totalXp ?? 0)
  const activityBadgeKeys = achievementBadges.slice(0, 4).map((item) => item.badge_key)
  const featuredActivityBadge = activityBadgeKeys[0]
    ? getBadgeLabel(activityBadgeKeys[0], language)
    : featuredBadge

  const heroDisplayName = draftName.trim() || profile?.display_name?.trim() || (
    isGuest
      ? t('게스트 체험 중', 'Guest Explorer')
      : user?.email ?? t('회원', 'Member')
  )

  const heroBio = draftBio.trim() || (
    isGuest
      ? t(
        '운동 기록과 커뮤니티를 가볍게 둘러보는 중이에요. 저장이 필요할 때 로그인하면 됩니다.',
        'Exploring workouts and community features. Log in when you want to keep your progress.',
      )
      : t(
        '한 줄 소개와 태그를 채우면 다른 사람들이 나를 더 빨리 알아봐요.',
        'A short intro and a few tags make your profile easier to recognize.',
      )
  )

  const bodyStatusLabel = bodyMetrics?.bmi != null
    ? `${bodyMetrics.bmi} BMI · ${getBmiCategory(bodyMetrics.bmi, isEnglish)}`
    : t('키와 몸무게를 입력하면 BMI가 계산돼요.', 'Add height and weight to unlock BMI.')

  const goalProgressLabel = bodyMetrics?.goalProgressPercent != null
    ? `${bodyMetrics.goalProgressPercent}%`
    : '--'

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

  const handleWeightSubmit = async (event) => {
    event.preventDefault()
    await onSaveWeight(draftWeight)
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
      <section className="card profile-settings-hero compact profile-hero-upgraded profile-growth-shell">
        <div className="profile-growth-top">
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
                <button
                  type="button"
                  className="mini-btn"
                  onClick={clearAvatarImage}
                  disabled={loading}
                >
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

          <div className="profile-growth-copy">
            <span className="app-section-kicker">
              {isGuest ? t('게스트 체험 중', 'Guest Trial') : t('내 성장 보드', 'Growth board')}
            </span>
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

          <div className="profile-growth-side">
            <SummaryStat
              label={t('현재 레벨', 'Fitness level')}
              value={latestResult?.level ? localizeLevelText(latestResult.level, language) : t('아직 테스트 전', 'Not tested yet')}
            />
            <SummaryStat
              label={t('팔로워', 'Followers')}
              value={String(followStats?.followerCount ?? 0)}
            />
            <SummaryStat
              label={t('팔로잉', 'Following')}
              value={String(followStats?.followingCount ?? 0)}
            />
            <SummaryStat
              label={t('대표 배지', 'Featured badge')}
              value={featuredBadge}
            />
            <SummaryStat
              label="Plan"
              value={isPro ? 'Pro' : 'Free'}
            />
          </div>
        </div>

        <div className="profile-progress-strip profile-growth-strip">
          <ProgressPill
            label={t('주간 목표', 'Weekly goal')}
            value={isEnglish ? `${stats.weeklyCount}/${draftGoal}` : `${stats.weeklyCount}/${draftGoal}회`}
            accent="cool"
          />
          <ProgressPill
            label={t('연속 기록', 'Streak')}
            value={isEnglish ? `${stats.streak} days` : `${stats.streak}일`}
            accent="warm"
          />
          <ProgressPill
            label={t('체중 목표', 'Body goal')}
            value={goalProgressLabel}
          />
          <ProgressPill
            label={t('기본 공개', 'Default share')}
            value={draftDefaultShare ? t('공개', 'Public') : t('비공개', 'Private')}
          />
        </div>

        <div className="profile-growth-grid">
          <section className="profile-growth-panel profile-growth-panel-activity">
            <div className="profile-activity-header">
              <div>
                <span className="app-section-kicker">{t('활동 XP', 'Activity XP')}</span>
                <h3>{t('성장 트랙', 'Growth track')}</h3>
              </div>
              <span className="community-mini-pill accent">{`${activitySummary?.totalXp ?? 0} XP`}</span>
            </div>

            <div className="profile-activity-progress">
              <div className="profile-activity-progress-copy">
                <strong>{t(`활동 Lv ${activitySummary?.levelValue ?? activityProgress.levelValue}`, `Activity Lv ${activitySummary?.levelValue ?? activityProgress.levelValue}`)}</strong>
                <span>
                  {activitySummary?.nextLevelValue
                    ? t(
                      `다음 레벨까지 ${activitySummary.remainingXp} XP`,
                      `${activitySummary.remainingXp} XP to Lv ${activitySummary.nextLevelValue}`,
                    )
                    : t('최고 활동 레벨에 도달했어요.', 'You reached the highest activity level.')}
                </span>
              </div>
              <div className="goal-progress-bar activity-progress-bar">
                <div
                  className="goal-progress-fill activity-progress-fill"
                  style={{ width: `${activitySummary?.progressPercent ?? activityProgress.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="profile-activity-stats">
              <SummaryStat
                label={t('주간 포인트', 'Weekly points')}
                value={String(activitySummary?.weeklyPoints ?? 0)}
              />
              <SummaryStat
                label={t('오늘 XP', 'Today XP')}
                value={`${activitySummary?.todayXp ?? 0} XP`}
              />
              <SummaryStat
                label={t('활동 연속', 'Activity streak')}
                value={isEnglish ? `${activitySummary?.currentStreak ?? 0} days` : `${activitySummary?.currentStreak ?? 0}일`}
              />
              <SummaryStat
                label={t('대표 활동 배지', 'Featured activity badge')}
                value={featuredActivityBadge}
              />
            </div>

            {!!activityBadgeKeys.length && (
              <div className="badge-row record-badge-row compact profile-activity-badges">
                {activityBadgeKeys.map((badgeKey) => (
                  <span key={badgeKey} className="badge-pill profile-badge">
                    {getBadgeLabel(badgeKey, language)}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="profile-growth-panel">
            <div className="profile-activity-header">
              <div>
                <span className="app-section-kicker">{t('현재 상태', 'Current snapshot')}</span>
                <h3>{t('몸과 커뮤니티 요약', 'Body and community summary')}</h3>
              </div>
            </div>

            <div className="profile-summary-grid compact profile-growth-summary-grid">
              <SummaryStat
                label={t('몸 상태', 'Body status')}
                value={bodyStatusLabel}
              />
              <SummaryStat
                label={t('현재 체중', 'Current weight')}
                value={bodyMetrics?.latestWeightKg != null ? `${bodyMetrics.latestWeightKg} kg` : '--'}
              />
              <SummaryStat
                label={t('이번 주 진행', 'Weekly progress')}
                value={isEnglish ? `${challenge.current}/${challenge.goal}` : `${challenge.current}/${challenge.goal}회`}
              />
              <SummaryStat
                label={t('최근 운동', 'Latest workout')}
                value={stats.lastWorkoutType ? stats.lastWorkoutType : t('없음', 'None')}
              />
              <SummaryStat
                label={t('기본 피드 설정', 'Default feed')}
                value={draftDefaultShare ? t('공개', 'Public') : t('비공개', 'Private')}
              />
              <SummaryStat
                label={t('리마인더', 'Reminder')}
                value={draftReminderEnabled ? draftReminderTime : t('끔', 'Off')}
              />
            </div>
          </section>
        </div>

        <section className={`profile-plan-banner ${isPro ? 'active' : ''}`}>
          <div className="profile-plan-copy">
            <span className="app-section-kicker">Pro</span>
            <strong>
              {isPro
                ? t('현재 Pro 플랜이 활성화되어 있어요', 'Your Pro plan is active')
                : t('Pro로 리포트와 챌린지를 더 깊게 열어보세요', 'Unlock deeper reports and challenges with Pro')}
            </strong>
            <p>
              {isPro
                ? t(
                  '주간/월간 리포트, 고급 리마인더, 비공개 챌린지 기능을 계속 사용할 수 있어요.',
                  'Weekly reports, advanced reminders, and private challenges are available on your account.',
                )
                : t(
                  '기록 자체는 무료로 유지하고, 분석과 동기부여 도구만 Pro로 확장하는 구조예요.',
                  'Core logging stays free while analysis and motivation tools expand with Pro.',
                )}
            </p>
          </div>

          <div className="profile-plan-actions">
            <button
              type="button"
              className={isPro ? 'ghost-btn' : 'primary-btn'}
              onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.GENERAL)}
            >
              {isPro ? t('요금제 다시 보기', 'View plans again') : t('Pro 요금제 보기', 'See Pro plans')}
            </button>
            {!isPro && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.CHALLENGES)}
              >
                {t('비공개 챌린지 보기', 'Preview challenge perks')}
              </button>
            )}
          </div>
        </section>

        {isGuest && (
          <div className="profile-guest-banner">
            <strong>{t('지금은 게스트 모드로 체험 중이에요.', 'You are exploring in guest mode right now.')}</strong>
            <p>
              {t(
                '운동 기록, 칼로리, 닉네임, 프로필 사진을 계속 저장하려면 로그인해 주세요.',
                'Log in when you want to keep workouts, calories, nickname, and your profile photo.',
              )}
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={onRequestAuth}
              disabled={authLoading}
            >
              {authLoading ? t('열고 있어요...', 'Opening...') : t('로그인하고 이어서 쓰기', 'Log in to keep progress')}
            </button>
          </div>
        )}

        {!isGuest && !canUseCommunity && (
          <div className="profile-guest-banner">
            <strong>{t('커뮤니티를 쓰려면 닉네임이 꼭 필요해요.', 'Community access needs a nickname.')}</strong>
            <p>
              {t(
                '닉네임을 저장하면 바로 커뮤니티 탭을 정상적으로 사용할 수 있어요.',
                'Save a nickname first and the community tab will open normally.',
              )}
            </p>
          </div>
        )}
      </section>

      <section className="card settings-card compact">
        <div className="settings-card-header compact">
          <span className="app-section-kicker">{t('바디', 'Body')}</span>
          <h2 className="app-section-title small">{t('체중 기록', 'Weight tracking')}</h2>
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
              placeholder={t('현재 몸무게 (kg)', 'Current weight (kg)')}
              disabled={loading}
            />
            <button type="submit" className="secondary-btn weight-log-btn" disabled={loading}>
              {loading ? t('저장 중...', 'Saving...') : t('체중 저장', 'Save weight')}
            </button>
          </div>
        </form>

        <div className="settings-goal-summary compact body-summary">
          <span>{t('현재 몸 상태', 'Current body status')}</span>
          <strong>{bodyStatusLabel}</strong>
        </div>
      </section>

      <section className="card settings-card compact">
        <div className="settings-card-header compact">
          <span className="app-section-kicker">{t('앱', 'App')}</span>
          <h2 className="app-section-title small">{t('언어와 계정', 'Language and account')}</h2>
        </div>

        <SettingRow
          label={t('언어', 'Language')}
          helper={t('앱에서 사용할 언어를 선택해 주세요.', 'Choose the language for the app.')}
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
          helper={isGuest
            ? t('지금은 게스트 체험 모드예요.', 'You are currently using the app in guest mode.')
            : t('연결된 계정으로 로그인되어 있어요.', 'Your connected account is active.')}
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
                {authLoading ? t('열고 있어요...', 'Opening...') : t('로그인 / 회원가입', 'Log in / Sign up')}
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

      <form className="profile-settings-stack compact" onSubmit={handleSubmit}>
        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{t('정체성', 'Identity')}</span>
            <h2 className="app-section-title small">{t('프로필 기본 정보', 'Profile basics')}</h2>
          </div>

          <SettingRow
            label={t('닉네임 (필수)', 'Nickname (Required)')}
            helper={t('프로필을 저장하려면 닉네임이 꼭 필요해요.', 'A nickname is required before saving your profile.')}
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
                  {t('프로필을 저장하려면 닉네임을 입력해 주세요.', 'Enter a nickname to save your profile.')}
                </span>
              )}
            </div>
          </SettingRow>

          <SettingRow
            label={t('프로필 사진', 'Profile photo')}
            helper={t('여기에 올린 사진은 커뮤니티 카드에도 함께 보여요.', 'This photo will also appear on community cards.')}
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
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={clearAvatarImage}
                    disabled={loading}
                  >
                    {t('사진 제거', 'Remove photo')}
                  </button>
                )}
              </div>
            </div>
          </SettingRow>

          <SettingRow
            label={t('기본 아바타 태그', 'Fallback avatar style')}
            helper={t('프로필 사진이 없을 때 대신 보여줄 태그예요.', 'Shown when a profile photo is not set.')}
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
            label={t('한 줄 소개', 'Bio')}
            helper={t('지금 집중하는 운동 흐름을 짧게 적어보세요.', 'Describe your current workout focus in one short line.')}
            compact
          >
            <textarea
              className="workout-textarea settings-textarea compact"
              rows="3"
              maxLength="90"
              value={draftBio}
              onChange={(event) => setDraftBio(event.target.value)}
              placeholder={t('예: 주 3회 운동 습관을 만드는 중이에요.', 'ex: Building a steady 3-day workout habit.')}
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
            <span className="app-section-kicker">{t('바디 목표', 'Body goal')}</span>
            <h2 className="app-section-title small">{t('건강 프로필', 'Health profile')}</h2>
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
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{t('기본값', 'Defaults')}</span>
            <h2 className="app-section-title small">{t('공개와 목표 설정', 'Sharing and goal settings')}</h2>
          </div>

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
            helper={t('홈 화면 챌린지 목표에 반영돼요.', 'Used for the challenge target on the home screen.')}
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
            helper={t(
              '선택한 시간에 홈 카드와 브라우저 알림으로 다시 운동 흐름을 알려줘요.',
              'Shows a home reminder card and optional browser alert at the time you choose.',
            )}
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

          <div className="settings-goal-summary compact">
            <span>{t('현재 챌린지', 'Current challenge')}</span>
            <strong>{isEnglish ? `${challenge.current}/${challenge.goal} complete` : `${challenge.current}/${challenge.goal} 완료`}</strong>
          </div>
        </section>

        <section className="card settings-card compact">
          <div className="settings-card-header compact">
            <span className="app-section-kicker">{t('메모', 'Note')}</span>
            <h2 className="app-section-title small">{t('최근 운동 메모', 'Latest workout note')}</h2>
          </div>
          <p className="profile-note settings-note compact">
            {stats.lastWorkoutNote ?? t('아직 저장한 운동 메모가 없어요.', 'No workout note saved yet.')}
          </p>
        </section>

        <button
          type="submit"
          className="primary-btn settings-save-btn compact"
          disabled={loading || nicknameMissing}
        >
          {loading ? t('저장 중...', 'Saving...') : t('설정 저장', 'Save settings')}
        </button>
      </form>
    </section>
  )
}
