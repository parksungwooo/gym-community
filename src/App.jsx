import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AuthRequiredModal from './components/AuthRequiredModal'
import PaywallModal from './components/PaywallModal'
import { Suspense, lazy } from 'react'
import NotificationCenter from './components/NotificationCenter'
import ReportModal from './components/ReportModal'
import {
  consumePendingAction,
  createAuthPromptState,
  persistPendingAction,
} from './features/auth/authFlow'
import { buildCommunityAccessResult, buildSuggestedUsers } from './features/community/communityFlow'
import { buildNotificationNavigation } from './features/notifications/notificationFlow'
import {
  buildBadges,
  buildChallenge,
  createGuestProfile,
  getReminderStatus,
  INITIAL_STATS,
  LAST_REMINDER_STORAGE_KEY,
  validateDisplayName,
} from './features/profile/profileFlow'
import { useI18n } from './i18n.js'
import { supabase } from './lib/supabaseClient'
import RouteSuspenseFallback from './routes/RouteSuspenseFallback'
import { getCurrentUser, signInWithOAuth, signOutUser } from './services/auth'
import {
  addComment,
  blockUser,
  completeWorkout,
  createFeedPost,
  fetchAchievementBadges,
  fetchBlockedIds,
  deleteWorkoutTemplate,
  deleteWorkoutLog,
  fetchFollowStats,
  fetchLeaderboard,
  fetchModerationReports,
  fetchNotifications,
  fetchRecentActivityEvents,
  fetchFeedWithRelations,
  fetchFollowingIds,
  fetchPublicProfile,
  resolveModerationReport,
  searchPublicUsers,
  fetchWeightLogs,
  fetchWorkoutHistory,
  fetchWorkoutTemplates,
  followUser,
  getLatestTestResult,
  getUserProfile,
  getWorkoutStats,
  hasWorkoutCompleted,
  submitReport,
  saveWorkoutTemplate,
  saveTestResult,
  saveWeightLog,
  toggleLike,
  unblockUser,
  unfollowUser,
  updateUserProfile,
  updateWorkoutLog,
  upsertUser,
  markAllNotificationsRead,
  markNotificationRead,
} from './services/communityService'
import { getHashForView, parseViewFromHash } from './utils/appRouting'
import { getActivityLevelProgress } from './utils/activityLevel'
import { buildBodyMetrics } from './utils/bodyMetrics'
import { isProMember, PREMIUM_CONTEXT } from './utils/premium'
import { getLevelByScore } from './utils/level'

const HomeRoute = lazy(() => import('./routes/HomeRoute'))
const ProgressRoute = lazy(() => import('./routes/ProgressRoute'))
const CommunityRoute = lazy(() => import('./routes/CommunityRoute'))
const ProfileRoute = lazy(() => import('./routes/ProfileRoute'))

const VIEW = {
  HOME: 'home',
  COMMUNITY: 'community',
  PROGRESS: 'progress',
  PROFILE: 'profile',
}

function TabIcon({ type }) {
  switch (type) {
    case VIEW.HOME:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
        </svg>
      )
    case VIEW.COMMUNITY:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
          <path d="M14 18.5a3.5 3.5 0 0 1 6 0" />
        </svg>
      )
    case VIEW.PROGRESS:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 19V10" />
          <path d="M12 19V5" />
          <path d="M18 19v-7" />
          <path d="M4 19.5h16" />
        </svg>
      )
    case VIEW.PROFILE:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      )
    default:
      return null
  }
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 16.5h11" />
      <path d="M8 16.5V11a4 4 0 1 1 8 0v5.5" />
      <path d="M5 18h14" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

function getTodayDateString() {
  return new Date().toLocaleDateString('sv-SE')
}

function getCurrentWeekKey() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toLocaleDateString('sv-SE')
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

function getActionableErrorMessage(error, fallbackMessage, isEnglish) {
  const rawMessage = error?.message ?? ''
  const normalized = rawMessage.toLowerCase()

  const schemaHints = [
    'schema cache',
    'does not exist',
    'could not find the table',
    'could not find the function',
    'relation',
    'column ',
    'function ',
  ]

  if (schemaHints.some((hint) => normalized.includes(hint))) {
    return isEnglish
      ? 'Supabase setup is incomplete. Run supabase/schema.sql, then supabase/verify.sql, and refresh the app.'
      : 'Supabase 설정이 아직 덜 반영됐어요. supabase/schema.sql을 실행한 뒤 supabase/verify.sql로 확인하고 앱을 새로고침해주세요.'
  }

  if (
    normalized.includes('row-level security')
    || normalized.includes('permission denied')
    || normalized.includes('violates row-level security policy')
  ) {
    return isEnglish
      ? 'Supabase permissions are blocking this action. Check the RLS policies in supabase/schema.sql.'
      : 'Supabase 권한 설정 때문에 이 작업이 막혔어요. supabase/schema.sql의 RLS 정책을 확인해주세요.'
  }

  if (
    normalized.includes('failed to fetch')
    || normalized.includes('networkerror')
    || normalized.includes('load failed')
    || normalized.includes('network request failed')
  ) {
    return isEnglish
      ? 'Network connection to Supabase failed. Check your internet connection and project URL.'
      : 'Supabase 연결에 실패했어요. 인터넷 연결과 프로젝트 URL 설정을 확인해주세요.'
  }

  return rawMessage || fallbackMessage
}


export default function App() {
  const { language, setLanguage, isEnglish } = useI18n()
  const initInProgressRef = useRef(false)
  const notificationRefreshTimeoutRef = useRef(null)
  const blockedIdsRef = useRef([])
  const [user, setUser] = useState(null)
  const [authPrompt, setAuthPrompt] = useState(null)
  const [view, setView] = useState(() => (
    typeof window === 'undefined'
      ? VIEW.HOME
      : parseViewFromHash(window.location.hash, VIEW.HOME, Object.values(VIEW))
  ))
  const [testResult, setTestResult] = useState(null)
  const [latestResult, setLatestResult] = useState(null)
  const [feedPosts, setFeedPosts] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [workoutTemplates, setWorkoutTemplates] = useState([])
  const [workoutStats, setWorkoutStats] = useState(INITIAL_STATS)
  const [profile, setProfile] = useState(null)
  const [weightLogs, setWeightLogs] = useState([])
  const [recentActivityEvents, setRecentActivityEvents] = useState([])
  const [achievementBadges, setAchievementBadges] = useState([])
  const [followingIds, setFollowingIds] = useState([])
  const [blockedIds, setBlockedIds] = useState([])
  const [followStats, setFollowStats] = useState({ followerCount: 0, followingCount: 0 })
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [communitySearchQuery, setCommunitySearchQuery] = useState('')
  const [communitySearchResults, setCommunitySearchResults] = useState([])
  const [loadingCommunitySearch, setLoadingCommunitySearch] = useState(false)
  const [moderationReports, setModerationReports] = useState([])
  const [moderationStatus, setModerationStatus] = useState('open')
  const [loadingModeration, setLoadingModeration] = useState(false)
  const [moderationActionLoading, setModerationActionLoading] = useState(false)
  const [reminderPermission, setReminderPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported',
  )
  const [selectedCommunityUser, setSelectedCommunityUser] = useState(null)
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState(null)
  const [loadingSelectedCommunityProfile, setLoadingSelectedCommunityProfile] = useState(false)
  const [showTestForm, setShowTestForm] = useState(false)
  const [showWorkoutPanel, setShowWorkoutPanel] = useState(false)
  const [workoutPreset, setWorkoutPreset] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [todayDone, setTodayDone] = useState(false)
  const [successState, setSuccessState] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [reportTarget, setReportTarget] = useState(null)
  const [paywallContext, setPaywallContext] = useState(null)
  const [initStatus, setInitStatus] = useState(isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...')
  const isAuthenticated = Boolean(user?.id)

  const navigateToView = useCallback((nextView, options = {}) => {
    setView(nextView)

    if (typeof window !== 'undefined') {
      const nextHash = getHashForView(nextView)
      if (window.location.hash !== nextHash) {
        if (options.replace) {
          window.history.replaceState(null, '', nextHash)
        } else {
          window.location.hash = nextHash
        }
      }
    }
  }, [])

  const openAuthPrompt = useCallback((reason, pendingAction = null) => {
    const authState = createAuthPromptState(false, reason, pendingAction)
    setAuthPrompt(authState.authPrompt)
  }, [])

  const closeAuthPrompt = useCallback(() => {
    setAuthPrompt(null)
  }, [])

  const openPaywall = useCallback((context = PREMIUM_CONTEXT.GENERAL) => {
    setPaywallContext(context)
  }, [])

  const closePaywall = useCallback(() => {
    setPaywallContext(null)
  }, [])

  const badges = useMemo(() => buildBadges(workoutStats, latestResult), [latestResult, workoutStats])
  const challenge = useMemo(() => buildChallenge(workoutStats, profile, isEnglish), [isEnglish, profile, workoutStats])
  const suggestedUsers = useMemo(
    () => buildSuggestedUsers({
      leaderboard,
      blockedIds,
      currentUserId: user?.id,
      currentLevel: latestResult?.level ?? testResult?.level ?? null,
    }),
    [blockedIds, leaderboard, latestResult?.level, testResult?.level, user?.id],
  )
  const effectiveProfile = useMemo(() => profile ?? createGuestProfile(), [profile])
  const bodyMetrics = useMemo(() => buildBodyMetrics(effectiveProfile, weightLogs), [effectiveProfile, weightLogs])
  const activityProgress = useMemo(
    () => getActivityLevelProgress(effectiveProfile.total_xp ?? 0),
    [effectiveProfile.total_xp],
  )
  const activitySummary = useMemo(() => {
    const todayKey = new Date().toLocaleDateString('sv-SE')
    const todayXp = recentActivityEvents
      .filter((item) => item.created_at?.slice(0, 10) === todayKey)
      .reduce((total, item) => total + (Number(item.xp_amount) || 0), 0)

    return {
      totalXp: Number(effectiveProfile.total_xp) || 0,
      weeklyPoints: Number(effectiveProfile.weekly_points) || 0,
      currentStreak: Number(effectiveProfile.streak_days) || workoutStats.streak || 0,
      levelValue: Number(effectiveProfile.activity_level) || activityProgress.levelValue,
      levelLabel: effectiveProfile.activity_level_label || activityProgress.levelLabel.en,
      progressPercent: activityProgress.progressPercent,
      remainingXp: activityProgress.remainingXp,
      nextLevelValue: activityProgress.nextLevelValue,
      nextLevelLabel: activityProgress.nextLevelLabel,
      currentMinXp: activityProgress.currentMinXp,
      nextMinXp: activityProgress.nextMinXp,
      todayXp,
      lastActivityDate: effectiveProfile.last_activity_date ?? null,
    }
  }, [activityProgress, effectiveProfile, recentActivityEvents, workoutStats.streak])
  const hasCommunityNickname = Boolean(effectiveProfile.display_name?.trim())
  const reminderStatus = useMemo(
    () => getReminderStatus(effectiveProfile, todayDone, language),
    [effectiveProfile, language, todayDone],
  )
  const visibleLeaderboard = useMemo(
    () => leaderboard.filter((item) => !blockedIds.includes(item.user_id)),
    [blockedIds, leaderboard],
  )
  const visibleFeedPosts = useMemo(
    () => feedPosts.filter((item) => !blockedIds.includes(item.user_id)),
    [blockedIds, feedPosts],
  )
  const homeFeedPreview = useMemo(() => {
    const followingSet = new Set(followingIds)
    const allPreview = visibleFeedPosts.slice(0, 4)
    const followingPreview = visibleFeedPosts
      .filter((item) => followingSet.has(item.user_id))
      .slice(0, 4)
    const recommendedPool = visibleFeedPosts.filter(
      (item) => !followingSet.has(item.user_id) && item.user_id !== user?.id,
    )
    const recommendedPreview = (recommendedPool.length ? recommendedPool : visibleFeedPosts).slice(0, 4)
    const popularPreview = [...visibleFeedPosts]
      .sort((left, right) => {
        const leftScore = (Number(left.likeCount) || 0) * 3 + ((left.comments?.length ?? 0) * 5)
        const rightScore = (Number(right.likeCount) || 0) * 3 + ((right.comments?.length ?? 0) * 5)

        if (rightScore !== leftScore) {
          return rightScore - leftScore
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      })
      .slice(0, 4)

    return {
      all: allPreview,
      following: followingPreview,
      recommended: recommendedPreview,
      popular: popularPreview.length ? popularPreview : allPreview,
    }
  }, [followingIds, user?.id, visibleFeedPosts])

  const activeCommunityProfile = selectedCommunityProfile ?? selectedCommunityUser
  const isAdmin = effectiveProfile?.is_admin === true
  const isPro = isProMember(effectiveProfile)

  useEffect(() => {
    blockedIdsRef.current = blockedIds
  }, [blockedIds])

  const refreshFeed = useCallback(async (userId, blockedIdSnapshot) => {
    const effectiveBlockedIds = Array.isArray(blockedIdSnapshot)
      ? blockedIdSnapshot
      : blockedIdsRef.current

    setLoadingFeed(true)
    try {
      const posts = await withTimeout(
        fetchFeedWithRelations(userId, effectiveBlockedIds),
        12000,
        isEnglish ? 'Feed is taking longer to load. Please try again soon.' : '피드를 불러오는 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.',
      )
      setFeedPosts(posts)
    } finally {
      setLoadingFeed(false)
    }
  }, [isEnglish])

  const refreshNotifications = useCallback(async (userId) => {
    if (!userId) {
      setNotifications([])
      setUnreadNotificationCount(0)
      return {
        notifications: [],
        unreadCount: 0,
      }
    }

    setLoadingNotifications(true)
    try {
      const { notifications: nextNotifications, unreadCount: nextUnreadCount } = await withTimeout(
        fetchNotifications(userId),
        10000,
        isEnglish ? 'Could not load notifications.' : '알림을 불러오지 못했어요.',
      )

      setNotifications(nextNotifications)
      setUnreadNotificationCount(nextUnreadCount)

      return {
        notifications: nextNotifications,
        unreadCount: nextUnreadCount,
      }
    } finally {
      setLoadingNotifications(false)
    }
  }, [isEnglish])

  const refreshLeaderboard = useCallback(async () => {
    const rows = await withTimeout(fetchLeaderboard(10), 12000, isEnglish ? 'Ranking is taking longer to load. Please try again soon.' : '랭킹을 불러오는 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.')
    setLeaderboard(rows)
  }, [isEnglish])

  const refreshModeration = useCallback(async (status = moderationStatus) => {
    if (!user?.id || !isAdmin) {
      setModerationReports([])
      return []
    }

    setLoadingModeration(true)
    try {
      const rows = await withTimeout(
        fetchModerationReports(status, 30),
        10000,
        isEnglish ? 'Could not load moderation reports.' : '신고 목록을 불러오지 못했어요.',
      )
      setModerationReports(rows)
      return rows
    } finally {
      setLoadingModeration(false)
    }
  }, [isAdmin, isEnglish, moderationStatus, user?.id])

  const resetPrivateState = useCallback(() => {
    setLatestResult(null)
    setWorkoutHistory([])
    setWorkoutTemplates([])
    setWorkoutStats(INITIAL_STATS)
    setProfile(null)
    setWeightLogs([])
    setRecentActivityEvents([])
    setAchievementBadges([])
    setFollowingIds([])
    setBlockedIds([])
    setFollowStats({ followerCount: 0, followingCount: 0 })
    setNotifications([])
    setUnreadNotificationCount(0)
    setShowNotificationCenter(false)
    setCommunitySearchQuery('')
    setCommunitySearchResults([])
    setModerationReports([])
    setModerationStatus('open')
    setTodayDone(false)
  }, [])

  const refreshUserSummary = useCallback(async (userId) => {
    const [
      result,
      stats,
      history,
      templates,
      nextProfile,
      nextWeightLogs,
      nextRecentActivityEvents,
      nextAchievementBadges,
      nextFollowingIds,
      nextBlockedIds,
      nextFollowStats,
    ] = await Promise.all([
      withTimeout(getLatestTestResult(userId), 10000, isEnglish ? 'Could not load your latest test.' : '최근 테스트를 불러오지 못했어요.'),
      withTimeout(getWorkoutStats(userId), 10000, isEnglish ? 'Could not load workout stats.' : '운동 통계를 불러오지 못했어요.'),
      withTimeout(fetchWorkoutHistory(userId), 10000, isEnglish ? 'Could not load workout history.' : '운동 기록 리스트를 불러오지 못했어요.'),
      withTimeout(fetchWorkoutTemplates(userId), 10000, isEnglish ? 'Could not load saved routines.' : '저장된 루틴을 불러오지 못했어요.'),
      withTimeout(getUserProfile(userId), 10000, isEnglish ? 'Could not load profile.' : '프로필 정보를 불러오지 못했어요.'),
      withTimeout(fetchWeightLogs(userId), 10000, isEnglish ? 'Could not load weight logs.' : '몸무게 기록을 불러오지 못했어요.'),
      withTimeout(fetchRecentActivityEvents(userId, 16), 10000, isEnglish ? 'Could not load activity events.' : '활동 XP 기록을 불러오지 못했어요.'),
      withTimeout(fetchAchievementBadges(userId), 10000, isEnglish ? 'Could not load badges.' : '활동 배지를 불러오지 못했어요.'),
      withTimeout(fetchFollowingIds(userId), 10000, isEnglish ? 'Could not load follows.' : '팔로잉 목록을 불러오지 못했어요.'),
      withTimeout(fetchBlockedIds(userId), 10000, isEnglish ? 'Could not load blocked users.' : '차단 목록을 불러오지 못했어요.'),
      withTimeout(fetchFollowStats(userId), 10000, isEnglish ? 'Could not load follow stats.' : '팔로우 통계를 불러오지 못했어요.'),
    ])

    setLatestResult(result)
    setWorkoutStats(stats)
    setWorkoutHistory(history)
    setWorkoutTemplates(templates)
    setProfile(nextProfile)
    setWeightLogs(nextWeightLogs)
    setRecentActivityEvents(nextRecentActivityEvents)
    setAchievementBadges(nextAchievementBadges)
    setFollowingIds(nextFollowingIds)
    setBlockedIds(nextBlockedIds)
    setFollowStats(nextFollowStats)

    return {
      result,
      stats,
      history,
      templates,
      profile: nextProfile,
      weightLogs: nextWeightLogs,
      recentActivityEvents: nextRecentActivityEvents,
      achievementBadges: nextAchievementBadges,
      followingIds: nextFollowingIds,
      blockedIds: nextBlockedIds,
      followStats: nextFollowStats,
    }
  }, [isEnglish])

  const loadPublicData = useCallback(async () => {
    setUser(null)
    resetPrivateState()
    setInitStatus(isEnglish ? 'Loading public dashboard...' : '공개 대시보드를 불러오는 중입니다...')
    await Promise.all([refreshFeed(null, []), refreshLeaderboard()])
  }, [isEnglish, refreshFeed, refreshLeaderboard, resetPrivateState])

  const loadUserData = useCallback(async (nextUser) => {
    if (!nextUser?.id) return

    setInitStatus(isEnglish ? 'Loading user...' : '사용자 정보를 불러오는 중입니다...')
    await withTimeout(upsertUser(nextUser.id), 10000, isEnglish ? 'User setup is taking too long.' : '유저 초기화가 지연되고 있어요.')
    setUser(nextUser)

    setInitStatus(isEnglish ? 'Checking today\'s log...' : '오늘 운동 기록을 확인하는 중입니다...')
    const doneToday = await withTimeout(hasWorkoutCompleted(nextUser.id, getTodayDateString()), 10000, isEnglish ? 'Workout lookup is taking too long.' : '운동 기록 조회가 지연되고 있어요.')
    setTodayDone(doneToday)

    setInitStatus(isEnglish ? 'Loading dashboard...' : '홈 데이터를 불러오는 중입니다...')
    await Promise.all([refreshFeed(nextUser.id), refreshUserSummary(nextUser.id), refreshLeaderboard(), refreshNotifications(nextUser.id)])
  }, [isEnglish, refreshFeed, refreshLeaderboard, refreshNotifications, refreshUserSummary])

  const initializeApp = useCallback(async () => {
    initInProgressRef.current = true
    setLoadingInit(true)
    setInitStatus(isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...')
    setErrorMessage('')

    try {
      const sessionUser = await withTimeout(getCurrentUser(), 10000, isEnglish ? 'Login initialization is taking too long. Please check your network.' : '로그인 초기화가 지연되고 있어요. 네트워크를 확인해주세요.')
      if (sessionUser?.id) {
        await loadUserData(sessionUser)
      } else {
        await loadPublicData()
      }
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Something went wrong during initialization.' : '초기화 중 문제가 발생했습니다.', isEnglish))
    } finally {
      initInProgressRef.current = false
      setLoadingInit(false)
    }
  }, [isEnglish, loadPublicData, loadUserData])

  const showSuccess = useCallback((message, accent = 'default') => {
    setSuccessState({ message, accent })
  }, [])

  const handleUpgradePlan = useCallback((planId) => {
    if (isPro) {
      showSuccess(
        isEnglish ? 'You are already on Pro.' : '이미 Pro 플랜을 사용 중이에요.',
        'info',
      )
      closePaywall()
      return
    }

    if (!isAuthenticated) {
      closePaywall()
      openAuthPrompt('premium_upgrade')
      return
    }

    showSuccess(
      isEnglish
        ? `Paywall is ready for ${planId}. Connect App Store / Play billing next to activate purchases.`
        : `${planId === 'annual' ? '연간' : '월간'} Pro 결제 화면은 준비됐어요. 다음 단계로 App Store / Play 결제를 연결하면 실제 구매까지 이어집니다.`,
      'info',
    )
    closePaywall()
  }, [closePaywall, isAuthenticated, isEnglish, isPro, openAuthPrompt, showSuccess])

  useEffect(() => {
    initializeApp()

    const failSafe = setTimeout(() => {
      setLoadingInit(false)
    }, 12000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || initInProgressRef.current) return

      setLoadingAuth(true)
      try {
        if (session?.user?.id) {
          await loadUserData(session.user)
        } else {
          await loadPublicData()
          navigateToView(VIEW.HOME, { replace: true })
        }
      } catch (error) {
        setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to sync auth state.' : '인증 상태 동기화에 실패했습니다.', isEnglish))
      } finally {
        setLoadingAuth(false)
      }
    })

    return () => {
      clearTimeout(failSafe)
      subscription.unsubscribe()
    }
  }, [initializeApp, isEnglish, loadPublicData, loadUserData])

  useEffect(() => {
    if (!successState) return undefined
    const timer = setTimeout(() => setSuccessState(null), 2600)
    return () => clearTimeout(timer)
  }, [successState])

  useEffect(() => {
    if (!celebration) return undefined
    const timer = setTimeout(() => setCelebration(null), 4200)
    return () => clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setReminderPermission('unsupported')
      return undefined
    }

    const syncPermission = () => {
      setReminderPermission(window.Notification.permission)
    }

    syncPermission()
    window.addEventListener('focus', syncPermission)
    document.addEventListener('visibilitychange', syncPermission)

    return () => {
      window.removeEventListener('focus', syncPermission)
      document.removeEventListener('visibilitychange', syncPermission)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return undefined

    const scheduleNotificationRefresh = () => {
      if (notificationRefreshTimeoutRef.current) {
        window.clearTimeout(notificationRefreshTimeoutRef.current)
      }

      notificationRefreshTimeoutRef.current = window.setTimeout(() => {
        refreshNotifications(user.id).catch(() => {})
        notificationRefreshTimeoutRef.current = null
      }, 180)
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            showSuccess(
              isEnglish ? 'A new notification arrived.' : '새 알림이 도착했어요.',
              'info',
            )
          }

          scheduleNotificationRefresh()
        },
      )
      .subscribe()

    return () => {
      if (notificationRefreshTimeoutRef.current) {
        window.clearTimeout(notificationRefreshTimeoutRef.current)
        notificationRefreshTimeoutRef.current = null
      }

      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, isEnglish, refreshNotifications, showSuccess, user?.id])

  useEffect(() => {
    if (
      typeof window === 'undefined'
      || !isAuthenticated
      || !user?.id
      || reminderPermission !== 'granted'
      || !reminderStatus.enabled
      || todayDone
    ) {
      return undefined
    }

    const maybeSendReminder = () => {
      const nextStatus = getReminderStatus(effectiveProfile, todayDone, language)

      if (!nextStatus.enabled || !nextStatus.due) return

      const storageKey = `${LAST_REMINDER_STORAGE_KEY}.${user.id}`
      const lastReminderDate = window.localStorage.getItem(storageKey)

      if (lastReminderDate === nextStatus.todayKey) {
        return
      }

      const notification = new window.Notification(
        isEnglish ? 'Workout reminder' : '운동 리마인더',
        {
          body: isEnglish
            ? 'Your reminder time has arrived. Log one workout to keep the flow going.'
            : '리마인더 시간이 됐어요. 흐름을 이어가려면 운동 한 번만 기록해보세요.',
        },
      )

      notification.onclick = () => {
        window.focus()
        navigateToView(VIEW.HOME)
      }

      window.localStorage.setItem(storageKey, nextStatus.todayKey)
    }

    maybeSendReminder()
    const intervalId = window.setInterval(maybeSendReminder, 60000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    effectiveProfile,
    isAuthenticated,
    isEnglish,
    language,
    reminderPermission,
    reminderStatus.enabled,
    todayDone,
    user?.id,
  ])

  const openNotificationCenter = useCallback(async () => {
    if (!user?.id) return

    setShowNotificationCenter(true)

    try {
      await refreshNotifications(user.id)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to load notifications.' : '알림을 불러오지 못했습니다.', isEnglish))
    }
  }, [isEnglish, refreshNotifications, user?.id])

  const closeNotificationCenter = useCallback(() => {
    setShowNotificationCenter(false)
  }, [])

  const handleRequestReminderPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showSuccess(
        isEnglish ? 'Browser notifications are not supported here.' : '이 환경에서는 브라우저 알림을 지원하지 않아요.',
        'info',
      )
      return
    }

    try {
      const permission = await window.Notification.requestPermission()
      setReminderPermission(permission)
      showSuccess(
        permission === 'granted'
          ? (isEnglish ? 'Browser reminders are now enabled.' : '브라우저 리마인더를 켰어요.')
          : permission === 'denied'
            ? (isEnglish ? 'Browser reminders were blocked. The in-app reminder card will still show.' : '브라우저 알림은 차단됐지만 앱 안 리마인더 카드는 계속 보여드릴게요.')
            : (isEnglish ? 'Reminder permission request was dismissed.' : '리마인더 권한 요청이 닫혔어요.'),
        'info',
      )
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to request reminder permission.' : '리마인더 권한 요청에 실패했습니다.', isEnglish))
    }
  }, [isEnglish, showSuccess])

  const guardAuthAction = useCallback((reason, pendingAction = null) => {
    const authState = createAuthPromptState(isAuthenticated, reason, pendingAction)

    if (!authState.blocked) return false

    setAuthPrompt(authState.authPrompt)
    return true
  }, [isAuthenticated])

  const handleGoogleSignIn = async () => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
      persistPendingAction(authPrompt?.pendingAction ?? null)
      await signInWithOAuth('google')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Google sign-in failed.' : 'Google 로그인에 실패했습니다.', isEnglish))
      setLoadingAuth(false)
    }
  }

  const handleKakaoSignIn = async () => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
      persistPendingAction(authPrompt?.pendingAction ?? null)
      await signInWithOAuth('kakao')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Kakao sign-in failed.' : 'Kakao 로그인에 실패했습니다.', isEnglish))
      setLoadingAuth(false)
    }
  }

  const handleSignOut = async () => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
      await signOutUser()
      persistPendingAction(null)
      await loadPublicData()
      navigateToView(VIEW.HOME, { replace: true })
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Sign-out failed.' : '로그아웃에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAuth(false)
    }
  }

  const handleSubmitTest = async (score) => {
    if (guardAuthAction('save_test', {
      type: 'submit_test',
      reason: 'save_test',
      view: VIEW.PROGRESS,
      payload: { score },
    })) return

    const levelInfo = getLevelByScore(score)
    const localResult = { score, level: levelInfo.label, created_at: new Date().toISOString() }

    setTestResult({ score, level: levelInfo.label })
    setLatestResult(localResult)
    navigateToView(VIEW.PROGRESS)
    setShowTestForm(false)
    const previousTotalXp = activitySummary.totalXp
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await saveTestResult(user.id, score, levelInfo.label)
      const [, summary] = await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])
      const gainedXp = Math.max((Number(summary.profile?.total_xp) || 0) - previousTotalXp, 0)
      if (gainedXp > 0) {
        showSuccess(
          isEnglish ? `Test saved. +${gainedXp} XP.` : `테스트 결과를 저장했어요. +${gainedXp} XP`,
          'info',
        )
      }
    } catch (error) {
      console.error(error)
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'The result is shown, but saving to the database failed. Please check SQL/RLS settings.' : '결과는 표시됐지만 DB 저장에 실패했어요. SQL/RLS 설정을 확인해주세요.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const openWorkoutComposer = useCallback((preset = null) => {
    const nextPreset = preset
      ? {
          name: preset.name || '',
          workoutType: preset.workout_type || preset.workoutType || workoutStats.lastWorkoutType || '러닝',
          durationMinutes: preset.duration_minutes || preset.durationMinutes || workoutStats.lastWorkoutDuration || 30,
          note: preset.note || '',
          defaultShareToFeed: profile?.default_share_to_feed !== false,
        }
      : {
          name: '',
          workoutType: workoutStats.lastWorkoutType || '러닝',
          durationMinutes: workoutStats.lastWorkoutDuration || 30,
          note: '',
          defaultShareToFeed: profile?.default_share_to_feed !== false,
        }

    setWorkoutPreset(nextPreset)
    setShowWorkoutPanel(true)

    window.setTimeout(() => {
      document.querySelector('.home-workout-panel-shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }, [profile?.default_share_to_feed, workoutStats.lastWorkoutDuration, workoutStats.lastWorkoutType])

  const closeWorkoutComposer = useCallback(() => {
    setShowWorkoutPanel(false)
    setWorkoutPreset(null)
  }, [])

  const handleWorkoutComplete = async (details = {}) => {
    if (guardAuthAction('save_workout', {
      type: 'complete_workout',
      reason: 'save_workout',
      view: VIEW.HOME,
      payload: details,
    })) return

    const previousWeeklyCount = workoutStats.weeklyCount
    const previousTotalXp = activitySummary.totalXp
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await completeWorkout(user.id, getTodayDateString(), {
        ...details,
        weightKg: bodyMetrics.latestWeightKg,
      })
      setTodayDone(true)
      const [, summary] = await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])

      if (previousWeeklyCount < challenge.goal && summary.stats.weeklyCount >= challenge.goal) {
        await createFeedPost(user.id, `challenge ${challenge.goal}`, 'challenge_complete', { week_key: getCurrentWeekKey(), goal: challenge.goal })
        await refreshFeed(user.id)
      }

      const gainedXp = Math.max((Number(summary.profile?.total_xp) || 0) - previousTotalXp, 0)
      showSuccess(
        gainedXp > 0
          ? (isEnglish ? `${details.workoutType || 'Workout'} saved. +${gainedXp} XP.` : `${details.workoutType || '운동'} 기록이 저장됐어요. +${gainedXp} XP`)
          : (isEnglish ? `${details.workoutType || 'Workout'} saved.` : `${details.workoutType || '운동'} 기록이 저장됐어요.`),
        'success',
      )
      setCelebration({ workoutType: details.workoutType || '운동', durationMinutes: Number(details.durationMinutes) || 0, nextWeeklyCount: summary.stats.weeklyCount })
      setShowWorkoutPanel(false)
      setWorkoutPreset(null)
      navigateToView(VIEW.HOME)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to save workout.' : '운동 기록 저장에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleSaveWorkoutTemplate = async (template) => {
    if (guardAuthAction('save_routine', {
      type: 'save_workout_template',
      reason: 'save_routine',
      view: VIEW.HOME,
      payload: template,
    })) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      await saveWorkoutTemplate(user.id, template)
      const templates = await fetchWorkoutTemplates(user.id)
      setWorkoutTemplates(templates)
      showSuccess(isEnglish ? 'Routine saved for one-tap reuse.' : '루틴이 저장됐어요. 다음엔 한 번에 불러올 수 있어요.', 'routine')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to save routine.' : '루틴 저장에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteWorkoutTemplate = async (templateId) => {
    if (!user?.id) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      await deleteWorkoutTemplate(user.id, templateId)
      const templates = await fetchWorkoutTemplates(user.id)
      setWorkoutTemplates(templates)
      showSuccess(isEnglish ? 'Routine removed.' : '루틴을 삭제했어요.', 'danger-soft')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to delete routine.' : '루틴 삭제에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUpdateWorkout = async (workoutLogId, details) => {
    if (!user?.id) return
    setLoadingAction(true)
    setErrorMessage('')
    try {
      await updateWorkoutLog(user.id, workoutLogId, {
        ...details,
        weightKg: bodyMetrics.latestWeightKg,
      })
      await refreshUserSummary(user.id)
      showSuccess(isEnglish ? 'Workout updated.' : '운동 기록을 수정했어요.', 'info')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update workout.' : '운동 기록 수정에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteWorkout = async (workoutLogId) => {
    if (!user?.id) return
    setLoadingAction(true)
    setErrorMessage('')
    try {
      await deleteWorkoutLog(user.id, workoutLogId)
      await Promise.all([refreshUserSummary(user.id), refreshLeaderboard()])
      const doneToday = await hasWorkoutCompleted(user.id, getTodayDateString())
      setTodayDone(doneToday)
      showSuccess(isEnglish ? 'Workout deleted.' : '운동 기록을 삭제했어요.', 'danger-soft')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to delete workout.' : '운동 기록 삭제에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleToggleLike = async (postId, isLiked) => {
    if (guardAuthAction('like', {
      type: 'toggle_like',
      reason: 'like',
      view: VIEW.COMMUNITY,
      payload: { postId, isLiked },
    })) return
    try {
      await toggleLike(user.id, postId, isLiked)
      await refreshFeed(user.id)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update like.' : '좋아요 처리에 실패했습니다.', isEnglish))
    }
  }

  const handleSubmitComment = async (postId, content) => {
    if (guardAuthAction('comment', {
      type: 'submit_comment',
      reason: 'comment',
      view: VIEW.COMMUNITY,
      payload: { postId, content },
    })) return
    try {
      await addComment(user.id, postId, content)
      await refreshFeed(user.id)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to add comment.' : '댓글 등록에 실패했습니다.', isEnglish))
    }
  }

  const openReportComposer = useCallback((target) => {
    setReportTarget(target)
  }, [])

  const closeReportComposer = useCallback(() => {
    setReportTarget(null)
  }, [])

  const handleSubmitReport = async ({ reason, details, subjectOverride = null }) => {
    const activeTarget = subjectOverride ?? reportTarget
    if (!activeTarget) return

    if (guardAuthAction('report', {
      type: 'submit_report',
      reason: 'report',
      view: VIEW.COMMUNITY,
      payload: {
        kind: activeTarget.kind,
        targetUserId: activeTarget.targetUserId ?? null,
        postId: activeTarget.postId ?? null,
        reason,
        details,
      },
    })) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      await submitReport(user.id, {
        targetUserId: activeTarget.targetUserId ?? null,
        postId: activeTarget.postId ?? null,
        reason,
        details,
      })
      setReportTarget(null)
      showSuccess(isEnglish ? 'Report submitted.' : '신고를 접수했어요.', 'info')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to submit report.' : '신고 접수에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleResolveReport = async (reportId, nextStatus, resolutionNote = '') => {
    if (!user?.id || !isAdmin || !reportId) return

    setModerationActionLoading(true)
    setErrorMessage('')

    try {
      await resolveModerationReport(reportId, nextStatus, resolutionNote)
      await refreshModeration(moderationStatus)
      showSuccess(
        isEnglish ? 'Report status updated.' : '신고 상태를 업데이트했어요.',
        'info',
      )
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update moderation report.' : '신고 처리에 실패했습니다.', isEnglish))
    } finally {
      setModerationActionLoading(false)
    }
  }

  const handleToggleBlock = async (targetUserId, isBlocked) => {
    if (!targetUserId || user?.id === targetUserId) return

    if (guardAuthAction('block', {
      type: 'toggle_block',
      reason: 'block',
      view: VIEW.COMMUNITY,
      payload: { targetUserId, isBlocked },
    })) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      if (isBlocked) {
        await unblockUser(user.id, targetUserId)
      } else {
        await blockUser(user.id, targetUserId)
      }

      const nextBlockedIds = await fetchBlockedIds(user.id)
      setBlockedIds(nextBlockedIds)
      await refreshFeed(user.id, nextBlockedIds)

      if (!isBlocked && selectedCommunityUser?.user_id === targetUserId) {
        handleClearCommunityUser()
      }

      showSuccess(
        isBlocked
          ? (isEnglish ? 'User unblocked.' : '차단을 해제했어요.')
          : (isEnglish ? 'User blocked and hidden from your community.' : '사용자를 차단했고 커뮤니티에서 바로 숨겼어요.'),
        isBlocked ? 'info' : 'danger-soft',
      )
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update block.' : '차단 상태 변경에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleSelectCommunityUser = useCallback((item) => {
    if (!item) return
    if (blockedIds.includes(item.user_id)) return

    setSelectedCommunityProfile(null)
    setSelectedCommunityUser({
      user_id: item.user_id,
      display_name: item.display_name ?? item.authorDisplayName ?? '',
      avatar_emoji: item.avatar_emoji ?? item.authorAvatarEmoji ?? 'RUN',
      avatar_url: item.avatar_url ?? item.authorAvatarUrl ?? null,
      activity_level: item.activity_level ?? null,
      activity_level_label: item.activity_level_label ?? null,
      total_xp: item.total_xp ?? 0,
      weekly_points: item.weekly_points ?? 0,
      latest_level: item.latest_level ?? item.authorLevel ?? null,
      latest_score: item.latest_score ?? item.authorScore ?? null,
      weekly_count: item.weekly_count ?? 0,
      total_workouts: item.total_workouts ?? 0,
      streak_days: item.streak_days ?? 0,
    })
  }, [blockedIds])

  const handleClearCommunityUser = useCallback(() => {
    setSelectedCommunityUser(null)
    setSelectedCommunityProfile(null)
  }, [])

  const handleUpdateProfile = async (nextProfile) => {
    const validationError = validateDisplayName(nextProfile.displayName ?? '', isEnglish)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    if (guardAuthAction('save_profile', {
      type: 'update_profile',
      reason: 'save_profile',
      view: VIEW.PROFILE,
      payload: {
        ...nextProfile,
        existingAvatarUrl: profile?.avatar_url ?? null,
      },
    })) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      const previousName = profile?.display_name ?? ''
      const previousAvatar = profile?.avatar_emoji ?? ''
      const previousAvatarUrl = profile?.avatar_url ?? null
      const previousGoal = profile?.weekly_goal ?? 4
      const previousHeight = profile?.height_cm ?? null
      const previousTargetWeight = profile?.target_weight_kg ?? null
      const previousBio = profile?.bio ?? ''
      const previousTags = JSON.stringify(profile?.fitness_tags ?? [])
      const previousDefaultShare = profile?.default_share_to_feed !== false
      const previousReminderEnabled = profile?.reminder_enabled === true
      const previousReminderTime = profile?.reminder_time ?? '19:00'
      const savedProfile = await updateUserProfile(user.id, nextProfile)
      setProfile(savedProfile)

      const changedName = (savedProfile.display_name ?? '') !== previousName
      const changedAvatar = (savedProfile.avatar_emoji ?? '') !== previousAvatar
      const changedAvatarUrl = (savedProfile.avatar_url ?? null) !== previousAvatarUrl
      const changedGoal = (savedProfile.weekly_goal ?? 4) !== previousGoal
      const changedHeight = (savedProfile.height_cm ?? null) !== previousHeight
      const changedTargetWeight = (savedProfile.target_weight_kg ?? null) !== previousTargetWeight
      const changedBio = (savedProfile.bio ?? '') !== previousBio
      const changedTags = JSON.stringify(savedProfile.fitness_tags ?? []) !== previousTags
      const changedDefaultShare = (savedProfile.default_share_to_feed !== false) !== previousDefaultShare
      const changedReminderEnabled = (savedProfile.reminder_enabled === true) !== previousReminderEnabled
      const changedReminderTime = (savedProfile.reminder_time ?? '19:00') !== previousReminderTime

      if (changedName || changedAvatar || changedAvatarUrl || changedGoal || changedHeight || changedTargetWeight || changedBio || changedTags || changedDefaultShare) {
        const profileLabel = savedProfile.display_name || 'profile'
        await createFeedPost(user.id, `${profileLabel} updated`, 'profile_update', {
          display_name: savedProfile.display_name,
          avatar_emoji: savedProfile.avatar_emoji,
          avatar_url: savedProfile.avatar_url,
          weekly_goal: savedProfile.weekly_goal,
          height_cm: savedProfile.height_cm,
          target_weight_kg: savedProfile.target_weight_kg,
          bio: savedProfile.bio,
          fitness_tags: savedProfile.fitness_tags,
          default_share_to_feed: savedProfile.default_share_to_feed,
        })
        await Promise.all([refreshFeed(user.id), refreshLeaderboard()])
      }
      showSuccess(
        nextProfile.needsAvatarReattach
          ? (isEnglish ? 'Profile saved. Re-attach the profile photo once more to finish it.' : '프로필은 저장됐어요. 프로필 사진만 한 번 더 붙이면 완료돼요.')
          : changedReminderEnabled || changedReminderTime
            ? (isEnglish ? 'Settings saved. Reminder time was updated too.' : '설정을 저장했고 리마인더도 업데이트했어요.')
            : (isEnglish ? 'Settings saved.' : '설정을 저장했어요.'),
        'info',
      )
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to save profile.' : '프로필 저장에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleSaveWeight = async (weightKg) => {
    if (guardAuthAction('save_weight', {
      type: 'save_weight',
      reason: 'save_weight',
      view: VIEW.PROFILE,
      payload: { weightKg },
    })) return

    setLoadingAction(true)
    setErrorMessage('')
    const previousTotalXp = activitySummary.totalXp

    try {
      await saveWeightLog(user.id, weightKg)
      const summary = await refreshUserSummary(user.id)
      const gainedXp = Math.max((Number(summary.profile?.total_xp) || 0) - previousTotalXp, 0)
      showSuccess(
        gainedXp > 0
          ? (isEnglish ? `Weight saved. +${gainedXp} XP.` : `몸무게를 기록했어요. +${gainedXp} XP`)
          : (isEnglish ? 'Weight saved.' : '몸무게를 기록했어요.'),
        'success',
      )
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to save weight.' : '몸무게 저장에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleToggleFollow = async (targetUserId, isFollowing) => {
    if (!targetUserId || user?.id === targetUserId) return

    if (guardAuthAction('follow', {
      type: 'toggle_follow',
      reason: 'follow',
      view: VIEW.COMMUNITY,
      payload: { targetUserId, isFollowing },
    })) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      if (isFollowing) {
        await unfollowUser(user.id, targetUserId)
      } else {
        await followUser(user.id, targetUserId)
      }

      const [nextFollowingIds, nextFollowStats] = await Promise.all([
        fetchFollowingIds(user.id),
        fetchFollowStats(user.id),
      ])
      setFollowingIds(nextFollowingIds)
      setFollowStats(nextFollowStats)
      if (selectedCommunityUser?.user_id === targetUserId) {
        const nextPublicProfile = await fetchPublicProfile(targetUserId)
        setSelectedCommunityProfile(nextPublicProfile)
      }
      showSuccess(
        isFollowing
          ? (isEnglish ? 'Unfollowed user.' : '언팔로우했어요.')
          : (isEnglish ? 'Now following user.' : '팔로우했어요.'),
        'info',
      )
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update follow.' : '팔로우 상태 변경에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  useEffect(() => {
    if (!selectedCommunityUser?.user_id) {
      setSelectedCommunityProfile(null)
      setLoadingSelectedCommunityProfile(false)
      return undefined
    }

    let cancelled = false

    const loadPublicProfile = async () => {
      setLoadingSelectedCommunityProfile(true)

      try {
        const nextProfile = await fetchPublicProfile(selectedCommunityUser.user_id)
        if (!cancelled) {
          setSelectedCommunityProfile(nextProfile)
        }
      } catch {
        if (!cancelled) {
          setSelectedCommunityProfile(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingSelectedCommunityProfile(false)
        }
      }
    }

    loadPublicProfile()

    return () => {
      cancelled = true
    }
  }, [selectedCommunityUser?.user_id])

  useEffect(() => {
    if (selectedCommunityUser?.user_id && blockedIds.includes(selectedCommunityUser.user_id)) {
      handleClearCommunityUser()
    }
  }, [blockedIds, handleClearCommunityUser, selectedCommunityUser?.user_id])

  useEffect(() => {
    const trimmedQuery = communitySearchQuery.trim()

    if (trimmedQuery.length < 2) {
      setCommunitySearchResults([])
      setLoadingCommunitySearch(false)
      return undefined
    }

    let cancelled = false
    setLoadingCommunitySearch(true)

    const timer = window.setTimeout(async () => {
      try {
        const rows = await withTimeout(
          searchPublicUsers(trimmedQuery, 12),
          10000,
          isEnglish ? 'Search is taking too long.' : '유저 검색이 지연되고 있어요.',
        )

        if (!cancelled) {
          setCommunitySearchResults(
            rows.filter((item) => item.user_id !== user?.id && !blockedIds.includes(item.user_id)),
          )
        }
      } catch (error) {
        if (!cancelled) {
          setCommunitySearchResults([])
          setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to search users.' : '유저 검색에 실패했습니다.', isEnglish))
        }
      } finally {
        if (!cancelled) {
          setLoadingCommunitySearch(false)
        }
      }
    }, 260)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [blockedIds, communitySearchQuery, isEnglish, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setModerationReports([])
      return undefined
    }

    refreshModeration(moderationStatus).catch((error) => {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to load moderation.' : '운영 목록을 불러오지 못했습니다.', isEnglish))
    })

    return undefined
  }, [isAdmin, isAuthenticated, isEnglish, moderationStatus, refreshModeration])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncViewFromHash = () => {
      setView(parseViewFromHash(window.location.hash, VIEW.HOME, Object.values(VIEW)))
    }

    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [])

  const handleChangeView = useCallback((nextView) => {
    const access = buildCommunityAccessResult(nextView, hasCommunityNickname, VIEW.COMMUNITY)

    if (!access.allowed) {
      navigateToView(VIEW.PROFILE)
      showSuccess(
        isEnglish
          ? 'Add a nickname in your profile before using the community.'
          : '커뮤니티를 사용하려면 먼저 프로필에 닉네임을 입력해주세요.',
        'info',
      )
      return
    }

    navigateToView(access.redirectView)
  }, [hasCommunityNickname, isEnglish, navigateToView, showSuccess])

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!user?.id || unreadNotificationCount === 0) return

    try {
      await markAllNotificationsRead(user.id)
      setNotifications((prev) => prev.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
        unread: false,
      })))
      setUnreadNotificationCount(0)
      showSuccess(isEnglish ? 'All notifications marked as read.' : '알림을 모두 읽음 처리했어요.', 'info')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update notifications.' : '알림 상태를 바꾸지 못했습니다.', isEnglish))
    }
  }, [isEnglish, showSuccess, unreadNotificationCount, user?.id])

  const handleOpenNotification = useCallback(async (notification) => {
    if (!notification || !user?.id) return

    if (notification.unread) {
      try {
        await markNotificationRead(user.id, notification.id)
        setNotifications((prev) => prev.map((item) => (
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString(), unread: false }
            : item
        )))
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to open notification.' : '알림을 여는 중 문제가 생겼습니다.', isEnglish))
      }
    }

    closeNotificationCenter()

    const navigation = buildNotificationNavigation(notification, VIEW.COMMUNITY)

    if (navigation.selectedUser) {
      handleSelectCommunityUser(navigation.selectedUser)
    } else {
      handleClearCommunityUser()
    }

    handleChangeView(navigation.nextView)
  }, [
    closeNotificationCenter,
    handleChangeView,
    handleClearCommunityUser,
    handleSelectCommunityUser,
    isEnglish,
    user?.id,
  ])

  useEffect(() => {
    if (!isAuthenticated || loadingInit) return undefined

    const pendingAction = consumePendingAction()
    if (!pendingAction?.type) return undefined

    const replay = async () => {
      closeAuthPrompt()

      if (pendingAction.view) {
        navigateToView(pendingAction.view)
      }

      switch (pendingAction.type) {
        case 'submit_test':
          await handleSubmitTest(pendingAction.payload?.score)
          break
        case 'complete_workout':
          await handleWorkoutComplete(pendingAction.payload ?? {})
          break
        case 'reopen_workout':
          navigateToView(VIEW.HOME)
          openWorkoutComposer(pendingAction.payload ?? null)
          showSuccess(
            isEnglish
              ? 'Login complete. Re-attach any new photos, then save your workout.'
              : '로그인됐어요. 새 사진만 다시 붙인 뒤 운동을 저장해주세요.',
            'info',
          )
          break
        case 'save_workout_template':
          await handleSaveWorkoutTemplate(pendingAction.payload ?? {})
          break
        case 'toggle_like':
          await handleToggleLike(pendingAction.payload?.postId, pendingAction.payload?.isLiked)
          break
        case 'submit_comment':
          await handleSubmitComment(pendingAction.payload?.postId, pendingAction.payload?.content ?? '')
          break
        case 'submit_report':
          {
            const reportSubject = {
              kind: pendingAction.payload?.kind ?? (pendingAction.payload?.postId ? 'post' : 'user'),
              targetUserId: pendingAction.payload?.targetUserId ?? null,
              postId: pendingAction.payload?.postId ?? null,
            }
            setReportTarget(reportSubject)
          await handleSubmitReport({
            reason: pendingAction.payload?.reason ?? 'other',
            details: pendingAction.payload?.details ?? '',
            subjectOverride: reportSubject,
          })
          break
          }
        case 'update_profile':
          await handleUpdateProfile(pendingAction.payload ?? {})
          break
        case 'save_weight':
          await handleSaveWeight(pendingAction.payload?.weightKg)
          break
        case 'toggle_follow':
          await handleToggleFollow(pendingAction.payload?.targetUserId, pendingAction.payload?.isFollowing)
          break
        case 'toggle_block':
          await handleToggleBlock(pendingAction.payload?.targetUserId, pendingAction.payload?.isBlocked)
          break
        default:
          break
      }
    }

    replay()
    return undefined
  }, [
    closeAuthPrompt,
    handleSaveWeight,
    handleSaveWorkoutTemplate,
    handleSubmitComment,
    handleSubmitReport,
    handleSubmitTest,
    handleToggleBlock,
    handleToggleFollow,
    handleToggleLike,
    handleUpdateProfile,
    handleWorkoutComplete,
    isAuthenticated,
    isEnglish,
    loadingInit,
    openWorkoutComposer,
    showSuccess,
  ])

  const tabs = [
    { key: VIEW.HOME, label: isEnglish ? 'Home' : '홈' },
    { key: VIEW.COMMUNITY, label: isEnglish ? 'Community' : '커뮤니티' },
    { key: VIEW.PROGRESS, label: isEnglish ? 'Records' : '기록' },
    { key: VIEW.PROFILE, label: isEnglish ? 'Profile' : '프로필' },
  ]

  return (
    <main className="app-shell">
      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successState && (
        <div className={`app-toast ${successState.accent ?? 'default'}`}>
          <span className="app-toast-dot" />
          <span className="app-toast-text">{successState.message}</span>
        </div>
      )}
      <AuthRequiredModal
        open={Boolean(authPrompt)}
        reason={authPrompt?.reason}
        loading={loadingAuth}
        onClose={closeAuthPrompt}
        onGoogleSignIn={handleGoogleSignIn}
        onKakaoSignIn={handleKakaoSignIn}
      />
      <PaywallModal
        open={Boolean(paywallContext)}
        context={paywallContext ?? PREMIUM_CONTEXT.GENERAL}
        isPro={isPro}
        loading={loadingAction}
        onClose={closePaywall}
        onUpgradePlan={handleUpgradePlan}
      />
      {reportTarget && (
        <ReportModal
          key={`${reportTarget.kind}-${reportTarget.targetUserId ?? 'none'}-${reportTarget.postId ?? 'none'}`}
          open
          loading={loadingAction}
          subject={reportTarget}
          onClose={closeReportComposer}
          onSubmit={handleSubmitReport}
        />
      )}
      <NotificationCenter
        open={showNotificationCenter}
        loading={loadingNotifications}
        notifications={notifications}
        unreadCount={unreadNotificationCount}
        onClose={closeNotificationCenter}
        onRefresh={() => refreshNotifications(user?.id)}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onOpenNotification={handleOpenNotification}
      />

      {loadingInit ? (
        <section className="card skeleton-screen-card">
          <div className="skeleton-copy">
            <span className="skeleton-line short" />
            <span className="skeleton-line long" />
          </div>
          <div className="skeleton-hero-block" />
          <div className="skeleton-grid">
            <span className="skeleton-panel" />
            <span className="skeleton-panel" />
            <span className="skeleton-panel" />
          </div>
          <p className="subtext skeleton-status-text">{initStatus}</p>
        </section>
      ) : (
        <>
          {isAuthenticated && (
            <div className="app-utility-bar">
              <button
                type="button"
                className={`notification-trigger ${showNotificationCenter ? 'active' : ''}`}
                onClick={openNotificationCenter}
              >
                <span className="notification-trigger-icon"><BellIcon /></span>
                <span className="notification-trigger-text">{isEnglish ? 'Notifications' : '알림'}</span>
                {unreadNotificationCount > 0 && (
                  <span className="notification-trigger-badge">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </button>
            </div>
          )}

          <nav className="tab-nav">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" className={`tab-btn ${view === tab.key ? 'active' : ''}`} onClick={() => handleChangeView(tab.key)}>
                <span className="tab-icon"><TabIcon type={tab.key} /></span>
                <span className="tab-text">{tab.label}</span>
              </button>
            ))}
          </nav>

          <Suspense fallback={<RouteSuspenseFallback label={isEnglish ? 'Loading route...' : '화면을 불러오는 중입니다...'} />}>
            {view === VIEW.HOME && (
              <HomeRoute
                celebration={celebration}
                isEnglish={isEnglish}
                profile={profile}
                bodyMetrics={bodyMetrics}
                todayDone={todayDone}
                currentLevel={latestResult?.level ?? testResult?.level ?? null}
                stats={workoutStats}
                challenge={challenge}
                activitySummary={activitySummary}
                achievementBadges={achievementBadges}
                isPro={isPro}
                reminder={reminderStatus}
                reminderPermission={reminderPermission}
                feedPreview={homeFeedPreview}
                routineTemplates={workoutTemplates}
                workoutLoading={loadingAction}
                onOpenWorkoutComposer={() => {
                  setCelebration(null)
                  openWorkoutComposer()
                }}
                onStartRoutine={(routine) => openWorkoutComposer(routine)}
                onOpenTest={() => {
                  navigateToView(VIEW.PROGRESS)
                  setShowTestForm(true)
                }}
                onOpenPaywall={openPaywall}
                onSeeCommunity={() => handleChangeView(VIEW.COMMUNITY)}
                onSelectFeedPreviewUser={(item) => {
                  handleSelectCommunityUser(item)
                  handleChangeView(VIEW.COMMUNITY)
                }}
                onRequestReminderPermission={handleRequestReminderPermission}
                showWorkoutPanel={showWorkoutPanel}
                workoutPreset={workoutPreset}
                onCompleteWorkout={handleWorkoutComplete}
                onSaveRoutine={handleSaveWorkoutTemplate}
                onDeleteRoutine={handleDeleteWorkoutTemplate}
                onCloseWorkoutComposer={closeWorkoutComposer}
              />
            )}

            {view === VIEW.PROGRESS && (
              <ProgressRoute
                isEnglish={isEnglish}
                showTestForm={showTestForm}
                onToggleTestForm={() => setShowTestForm((prev) => !prev)}
                onGoHome={() => navigateToView(VIEW.HOME)}
                onSubmitTest={handleSubmitTest}
                loadingAction={loadingAction}
                testResult={testResult}
                latestResult={latestResult}
                badges={badges}
                weeklyGoal={profile?.weekly_goal || 4}
                bodyMetrics={bodyMetrics}
                activitySummary={activitySummary}
                achievementBadges={achievementBadges}
                recentActivityEvents={recentActivityEvents}
                isPro={isPro}
                onOpenPaywall={openPaywall}
                workoutStats={workoutStats}
                workoutHistory={workoutHistory}
                onUpdateWorkout={handleUpdateWorkout}
                onDeleteWorkout={handleDeleteWorkout}
              />
            )}

            {view === VIEW.COMMUNITY && (
              <CommunityRoute
                isEnglish={isEnglish}
                canUseCommunity={hasCommunityNickname}
                onGoProfile={() => navigateToView(VIEW.PROFILE)}
                selectedCommunityUser={selectedCommunityUser}
                selectedCommunityProfile={selectedCommunityProfile}
                loadingSelectedCommunityProfile={loadingSelectedCommunityProfile}
                activeCommunityProfile={activeCommunityProfile}
                followingIds={followingIds}
                blockedIds={blockedIds}
                currentUserId={user?.id ?? null}
                loadingAction={loadingAction}
                onToggleFollow={handleToggleFollow}
                onOpenReportComposer={openReportComposer}
                onToggleBlock={handleToggleBlock}
                onClearCommunityUser={handleClearCommunityUser}
                communitySearchQuery={communitySearchQuery}
                onCommunitySearchQueryChange={setCommunitySearchQuery}
                communitySearchResults={communitySearchResults}
                loadingCommunitySearch={loadingCommunitySearch}
                onSelectCommunityUser={handleSelectCommunityUser}
                suggestedUsers={suggestedUsers}
                currentLevel={latestResult?.level ?? testResult?.level ?? null}
                loadingFeed={loadingFeed}
                visibleLeaderboard={visibleLeaderboard}
                visibleFeedPosts={visibleFeedPosts}
                onToggleLike={handleToggleLike}
                onSubmitComment={handleSubmitComment}
                isAdmin={isAdmin}
                moderationReports={moderationReports}
                moderationLoading={loadingModeration}
                moderationActionLoading={moderationActionLoading}
                moderationStatus={moderationStatus}
                onModerationStatusChange={setModerationStatus}
                onRefreshModeration={() => refreshModeration(moderationStatus)}
                onResolveReport={handleResolveReport}
              />
            )}

            {view === VIEW.PROFILE && (
              <ProfileRoute
                user={user}
                profile={effectiveProfile}
                latestResult={latestResult}
                stats={workoutStats}
                badges={badges}
                activitySummary={activitySummary}
                achievementBadges={achievementBadges}
                challenge={challenge}
                bodyMetrics={bodyMetrics}
                followStats={followStats}
                loading={loadingAction}
                authLoading={loadingAuth}
                isAuthenticated={isAuthenticated}
                canUseCommunity={hasCommunityNickname}
                language={language}
                reminderPermission={reminderPermission}
                isPro={isPro}
                onOpenPaywall={openPaywall}
                onSetLanguage={setLanguage}
                onRequestAuth={() => openAuthPrompt('guest_profile')}
                onRequestReminderPermission={handleRequestReminderPermission}
                onSignOut={handleSignOut}
                onSaveProfile={handleUpdateProfile}
                onSaveWeight={handleSaveWeight}
              />
            )}
          </Suspense>
        </>
      )}
    </main>
  )
}

