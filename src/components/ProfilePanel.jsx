import { useEffect, useMemo, useRef, useState } from 'react'
import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'
import { PREMIUM_CONTEXT } from '../utils/premium'

const AVATAR_OPTIONS = ['RUN', 'GYM', 'ZEN', 'LIFT', 'CARD', 'FLOW']
const GOAL_OPTIONS = [3, 4, 5, 6]
const FITNESS_TAG_OPTIONS = ['러닝', '웨이트', '다이어트', '벌크업', '초보', '근육 만들기', '체력 향상', '요가']

function SettingRow({ label, helper, compact = false, children }) {
  return (
    <section className={`grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950 ${compact ? 'sm:grid-cols-[0.9fr_1.1fr] sm:items-start' : ''}`}>
      <div className="grid gap-1">
        <strong className="text-sm font-black text-gray-950 dark:text-white">{label}</strong>
        {helper ? <span className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{helper}</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function SummaryStat({ label, value }) {
  return (
    <article className="grid gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{label}</span>
      <strong className="truncate text-2xl font-black leading-tight text-gray-950 dark:text-white">{value}</strong>
    </article>
  )
}

function MenuButton({ menuKey, label, meta, active, onClick }) {
  return (
    <button
      type="button"
      className={`min-h-16 rounded-2xl border p-4 text-left transition ${active ? 'active border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-50' : 'border-gray-100 bg-gray-50 text-gray-950 hover:bg-white dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:hover:bg-white/10'}`}
      onClick={onClick}
      data-testid={`profile-menu-${menuKey}`}
    >
      <div className="grid gap-1">
        <strong className="text-base font-black">{label}</strong>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{meta}</span>
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
  isPro,
  onOpenPaywall,
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
  const premiumUntil = profile?.premium_until ?? profile?.premiumUntil
  const premiumUntilLabel = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric' })
    : t('활성', 'Active')

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
    : t('레벨 미정', 'Not tested yet')
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
        title: t('로그인하면 흐름이 이어져요.', 'Log in to keep your progress.'),
        body: t('운동, 체중, 프로필을 안전하게 보관해요.', 'Workouts, weight, and profile save to your account.'),
        actionLabel: t('로그인', 'Log in'),
        actionKey: 'auth',
      }
    }

    if (nicknameMissing || !canUseCommunity) {
      return {
        title: t('닉네임만 정하면 시작돼요.', 'Save a nickname to open community.'),
        body: t('피드와 메이트 기능이 바로 열려요.', 'A nickname is enough for feed and mates.'),
        actionLabel: t('닉네임 입력', 'Add nickname'),
        actionKey: 'nickname',
      }
    }

    if (!latestResult) {
      return {
        title: t('내 레벨부터 확인해요.', 'Start with the level test.'),
        body: t('한 번만 체크하면 추천이 더 잘 맞아요.', 'One quick check makes the summaries fit better.'),
        actionLabel: t('레벨 확인', 'Go to Records'),
        actionKey: 'progress',
      }
    }

    if (!hasWorkoutHistory) {
      return {
        title: t('첫 기록을 남겨요.', 'Start with your first workout log.'),
        body: t('한 번만 저장해도 홈과 달력이 살아나요.', 'One log starts filling Home and the calendar.'),
        actionLabel: t('기록하기', 'Go to Records'),
        actionKey: 'progress',
      }
    }

    return null
  })()

  const handleSetupAction = () => {
    if (!setupCard) return

    if (setupCard.actionKey === 'auth') {
      onRequestAuth()
      return
    }

    if (setupCard.actionKey === 'nickname') {
      focusNicknameField()
      return
    }

    onGoProgress()
  }

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
    <section className="grid gap-6">
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <UserAvatar
              className="h-20 w-20 rounded-3xl sm:h-24 sm:w-24"
              imageUrl={draftAvatarUrl}
              fallback={draftAvatar}
              alt={isEnglish ? 'Profile photo' : '프로필 사진'}
            />
          </div>

          <div className="grid min-w-0 gap-2">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isGuest ? t('게스트 체험 중', 'Guest Trial') : t('프로필', 'Profile')}</span>
            <h2 className="m-0 truncate text-3xl font-black leading-tight text-gray-950 dark:text-white">{heroDisplayName}</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{heroBio}</p>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-lg px-3 py-2 text-xs font-black ${isPro ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
                {isPro ? t('Pro 멤버', 'Pro member') : t('Free 플랜', 'Free plan')}
              </span>
              {isPro ? (
                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">
                  {t(`유효 ${premiumUntilLabel}`, `Valid ${premiumUntilLabel}`)}
                </span>
              ) : null}
            </div>

            {!!draftTags.length && (
              <div className="flex flex-wrap gap-2">
                {draftTags.map((tag) => (
                  <span key={tag} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryStat label={t('레벨', 'Level')} value={heroLevelLabel} />
          <SummaryStat label={t('목표', 'Goal')} value={`${stats.weeklyCount}/${draftGoal}`} />
          <SummaryStat label={t('팔로워', 'Followers')} value={String(followStats?.followerCount ?? 0)} />
        </div>
      </section>

      {setupCard && (
        <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('다음', 'Next')}</span>
              <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('시작 준비', 'Profile setup')}</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{`${readyStepCount}/${readySteps.length}`}</span>
          </div>

          <div className="grid gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <strong className="text-base font-black text-gray-950 dark:text-white">{setupCard.title}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{setupCard.body}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {readySteps.map((step) => (
              <span key={step.key} className={`rounded-lg px-3 py-2 text-xs font-black ${step.done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
                {step.label}
              </span>
            ))}
          </div>

          <div className="grid">
            <button
              type="button"
              className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
              onClick={handleSetupAction}
              disabled={loading || authLoading}
            >
              {setupCard.actionLabel}
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('마이페이지', 'My page')}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('빠른 이동', 'Quick access')}</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{activeSectionTitle}</span>
        </div>

        {setupCard && (
          <>
            <div className="grid gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-white/10 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="grid gap-1">
                <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('다음 한 걸음', 'Next best step')}</span>
                <strong className="text-base font-black text-gray-950 dark:text-white">{setupCard.title}</strong>
              </div>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
                onClick={handleSetupAction}
                disabled={loading || authLoading}
              >
                {setupCard.actionLabel}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {readySteps.map((step) => (
                <span key={step.key} className={`rounded-lg px-3 py-2 text-xs font-black ${step.done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
                  {step.label}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
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

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={handleAvatarFileChange}
        />

        {activeSection === 'profile' && (
          <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('내 정보', 'Identity')}</span>
              <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('프로필 기본 정보', 'Profile basics')}</h2>
            </div>

            <SettingRow
              label={t('닉네임', 'Nickname')}
              helper={t('커뮤니티에서 보여요.', 'Needed to save.')}
              compact
            >
              <div className="grid gap-2">
                <input
                  ref={nicknameInputRef}
                  className={`min-h-12 rounded-lg border bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300 ${nicknameMissing ? 'border-rose-300 dark:border-rose-400/40' : 'border-gray-200 dark:border-white/10'}`}
                  type="text"
                  maxLength="20"
                  required
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder={t('예: 러닝메이트', 'ex: RunningMate')}
                  disabled={loading}
                />
                {nicknameMissing && (
                  <span className="text-sm font-bold text-rose-700 dark:text-rose-300">
                    {t('닉네임을 입력해 주세요.', 'Enter a nickname.')}
                  </span>
                )}
              </div>
            </SettingRow>

            <SettingRow
              label={t('프로필 사진', 'Profile photo')}
              helper={t('피드와 프로필에 보여요.', 'Shows in community.')}
              compact
            >
              <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <UserAvatar
                  className="h-16 w-16 rounded-2xl"
                  imageUrl={draftAvatarUrl}
                  fallback={draftAvatar}
                  alt={isEnglish ? 'Profile preview' : '프로필 미리보기'}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    {t('사진 업로드', 'Upload photo')}
                  </button>
                  {!!draftAvatarUrl && (
                    <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={clearAvatarImage} disabled={loading}>
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
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {AVATAR_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`min-h-11 rounded-lg px-3 text-sm font-black transition disabled:opacity-50 ${draftAvatar === item ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
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
                className="min-h-24 resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
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
              <div className="flex flex-wrap gap-2">
                {activeTagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`min-h-11 rounded-lg px-3 text-sm font-black transition disabled:opacity-50 ${draftTags.includes(tag) ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
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
          <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('내 활동', 'Activity')}</span>
              <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('목표', 'Goals')}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
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
                className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
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
                className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GOAL_OPTIONS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={`min-h-11 rounded-lg px-3 text-sm font-black transition disabled:opacity-50 ${draftGoal === goal ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
                    onClick={() => setDraftGoal(goal)}
                    disabled={loading}
                  >
                    {isEnglish ? `${goal}/week` : `주 ${goal}회`}
                  </button>
                ))}
              </div>
            </SettingRow>

            <p className="m-0 rounded-2xl bg-gray-50 p-4 text-sm font-semibold leading-6 text-gray-700 dark:bg-white/10 dark:text-gray-200">
              {t('체중은 기록 탭에서 남겨요.', 'Log weight in Records.')}
            </p>
          </section>
        )}

        {activeSection === 'community' && (
          <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('커뮤니티', 'Community')}</span>
              <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('공개', 'Sharing')}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryStat label={t('팔로워', 'Followers')} value={String(followStats?.followerCount ?? 0)} />
              <SummaryStat label={t('팔로잉', 'Following')} value={String(followStats?.followingCount ?? 0)} />
              <SummaryStat label={t('닉네임', 'Nickname')} value={nicknameMissing ? t('필요', 'Required') : t('준비 완료', 'Ready')} />
            </div>

            <SettingRow
              label={t('기본 피드 공개', 'Default feed sharing')}
              helper={t('새 기록 기본값', 'Default for new logs.')}
              compact
            >
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${draftDefaultShare ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
                onClick={() => setDraftDefaultShare((prev) => !prev)}
                disabled={loading}
              >
                {draftDefaultShare ? t('기본 공개', 'Public by default') : t('기본 비공개', 'Private by default')}
              </button>
            </SettingRow>

            <div className="grid gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
              <strong className="text-sm font-black text-gray-950 dark:text-white">{t('닉네임과 사진이 보여요.', 'Nickname and photo show.')}</strong>
              <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{t('짧을수록 좋아요.', 'Short looks better.')}</p>
            </div>
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('설정', 'Settings')}</span>
              <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('설정', 'Settings')}</h2>
            </div>

            <SettingRow
              label={t('Pro 구독', 'Pro subscription')}
              helper={isPro
                ? t('AI 플랜, 고급 분석, 공유 카드가 열려 있어요.', 'AI plans, analytics, and share cards are unlocked.')
                : t('AI 플랜과 Pro 클럽을 열 수 있어요.', 'Unlock AI plans and Pro Club.')}
              compact
            >
              <div className="grid gap-3">
                <div className="grid gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
                  <strong className="text-base font-black text-gray-950 dark:text-white">
                    {isPro ? t('Pro 사용 중', 'Pro active') : t('Free 사용 중', 'Free active')}
                  </strong>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {isPro
                      ? t(`다음 갱신/만료: ${premiumUntilLabel}`, `Renews/expires: ${premiumUntilLabel}`)
                      : t('연간 Pro는 월 4,900원 수준으로 가장 저렴해요.', 'Annual Pro gives the best monthly price.')}
                  </span>
                </div>
                <button
                  type="button"
                  className={isPro
                    ? 'min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'
                    : 'min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800'}
                  onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.AI_PLAN)}
                >
                  {isPro ? t('Pro 혜택 보기', 'View Pro benefits') : t('Pro 업그레이드', 'Upgrade to Pro')}
                </button>
              </div>
            </SettingRow>

            <SettingRow
              label={t('운동 리마인더', 'Workout reminder')}
              helper={t('정한 시간에 알려드릴게요.', 'Alerts at that time.')}
              compact
            >
              <div className="grid gap-3">
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${draftReminderEnabled ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
                  onClick={() => setDraftReminderEnabled((prev) => !prev)}
                  disabled={loading}
                >
                  {draftReminderEnabled ? t('켜짐', 'On') : t('꺼짐', 'Off')}
                </button>

                {draftReminderEnabled && (
                  <>
                    <input
                      className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
                      type="time"
                      value={draftReminderTime}
                      onChange={(event) => setDraftReminderTime(event.target.value)}
                      disabled={loading}
                    />
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <span>{reminderPermissionLabel}</span>
                      {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' && (
                        <button
                          type="button"
                          className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
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
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/10">
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${language === 'ko' ? 'bg-white text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-gray-700 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'}`}
                  onClick={() => onSetLanguage('ko')}
                >
                  한국어
                </button>
                <button
                  type="button"
                  className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${language === 'en' ? 'bg-white text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-gray-700 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'}`}
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
              <div className="flex flex-wrap gap-2">
                {isGuest ? (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
                    onClick={onRequestAuth}
                    disabled={authLoading}
                  >
                    {authLoading ? t('여는 중', 'Opening') : t('로그인', 'Log in')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
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

        <button type="submit" className="min-h-14 rounded-lg bg-emerald-700 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || nicknameMissing}>
          {loading ? t('저장 중', 'Saving...') : t('저장하기', 'Save')}
        </button>
      </form>
    </section>
  )
}
