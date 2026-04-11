import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import AppTopActions from './components/AppTopActions'
import AuthRequiredModal from './components/AuthRequiredModal'
import BottomTabNav from './components/BottomTabNav'
import NotificationCenter from './components/NotificationCenter'
import OnboardingCoach, { ONBOARDING_STORAGE_KEY } from './components/OnboardingCoach'
import PaywallModal from './components/PaywallModal'
import ReportModal from './components/ReportModal'
import {
  consumePendingAction,
  createAuthPromptState,
  persistPendingAction,
} from './features/auth/authFlow'
import {
  getCurrentWeekKey,
  getTodayDateString,
  withTimeout,
} from './features/app/appFlowUtils'
import { buildCommunityAccessResult } from './features/community/communityFlow'
import { buildNotificationNavigation } from './features/notifications/notificationFlow'
import {
  INITIAL_STATS,
  LAST_REMINDER_STORAGE_KEY,
  getReminderStatus,
  validateDisplayName,
} from './features/profile/profileFlow'
import { useAppBootstrap } from './hooks/useAppBootstrap'
import { useAppDerivedState } from './hooks/useAppDerivedState'
import { useAppError } from './hooks/useAppError'
import { useI18n } from './i18n.js'
import MainLayout from './components/Layout/MainLayout'
import { supabase } from './lib/supabaseClient'
import RouteSuspenseFallback from './routes/RouteSuspenseFallback'
import { signInWithOAuth, signOutUser } from './services/auth'
import {
  addComment,
  blockUser,
  completeWorkout,
  createFeedPost,
  createMatePost,
  fetchBlockedIds,
  deleteWorkoutTemplate,
  deleteWorkoutLog,
  fetchFollowStats,
  fetchFollowingIds,
  fetchPublicProfile,
  fetchWorkoutTemplates,
  hasWorkoutCompleted,
  resolveModerationReport,
  searchPublicUsers,
  setFeedPostVisibility,
  followUser,
  submitReport,
  saveWorkoutTemplate,
  saveTestResult,
  saveWeightLog,
  toggleMatePostInterest,
  toggleLike,
  unblockUser,
  unfollowUser,
  updateMatePostStatus,
  updateUserProfile,
  updateWorkoutLog,
  markAllNotificationsRead,
  markNotificationRead,
} from './services/communityService'
import { deleteGuestWorkouts, getGuestWorkouts, saveGuestWorkout } from './lib/guestStorage.js'
import {
  buildAppHistoryState,
  getHashForView,
  parseViewFromHash,
  shouldPushHomeBackGuard,
} from './utils/appRouting'
import { getLevelByScore } from './utils/level'
import { PREMIUM_CONTEXT } from './utils/premium'
import { getNextThemeMode, resolveThemeMode, THEME_STORAGE_KEY } from './utils/theme'

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

export default function App() {
  const { language, setLanguage, isEnglish } = useI18n()
  const initInProgressRef = useRef(false)
  const notificationRefreshTimeoutRef = useRef(null)
  const pendingReplayHandlersRef = useRef({})
  const guestSyncPromiseRef = useRef(null)
  const guestSyncAttemptedUserRef = useRef('')
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
  const [matePosts, setMatePosts] = useState([])
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
  const [showOnboardingCoach, setShowOnboardingCoach] = useState(false)
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
  const [showTestResult, setShowTestResult] = useState(false)
  const [showWorkoutPanel, setShowWorkoutPanel] = useState(false)
  const [workoutPreset, setWorkoutPreset] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingMatePosts, setLoadingMatePosts] = useState(false)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [todayDone, setTodayDone] = useState(false)
  const [successState, setSuccessState] = useState(null)
  const [guestSyncState, setGuestSyncState] = useState({
    phase: 'idle',
    pendingCount: 0,
    failedCount: 0,
  })
  const [celebration, setCelebration] = useState(null)
  const {
    errorState,
    setErrorMessage,
    visibleErrorMessage,
    captureError,
  } = useAppError(isEnglish)
  const [reportTarget, setReportTarget] = useState(null)
  const [paywallContext, setPaywallContext] = useState(null)
  const [initStatus, setInitStatus] = useState(isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...')
  const [historyTick, setHistoryTick] = useState(0)
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return resolveThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY))
  })
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

  const {
    badges,
    challenge,
    suggestedUsers,
    effectiveProfile,
    bodyMetrics,
    activitySummary,
    hasCommunityNickname,
    reminderStatus,
    visibleLeaderboard,
    visibleFeedPosts,
    visibleMatePosts,
    homeFeedPreview,
    homeInsight,
    activeCommunityProfile,
    isAdmin,
    isPro,
  } = useAppDerivedState({
    leaderboard,
    blockedIds,
    user,
    latestResult,
    testResult,
    profile,
    weightLogs,
    recentActivityEvents,
    workoutStats,
    isEnglish,
    language,
    todayDone,
    followingIds,
    feedPosts,
    matePosts,
    selectedCommunityProfile,
    selectedCommunityUser,
  })

  const {
    refreshFeed,
    refreshMatePosts,
    refreshNotifications,
    refreshLeaderboard,
    refreshModeration,
    loadPublicData,
    loadUserData,
    initializeApp,
    refreshUserSummary,
  } = useAppBootstrap({
    isEnglish,
    initInProgressRef,
    blockedIds,
    moderationStatus,
    isAdmin,
    currentUserId: user?.id,
    setUser,
    setFeedPosts,
    setMatePosts,
    setLeaderboard,
    setWorkoutHistory,
    setWorkoutTemplates,
    setWorkoutStats,
    setProfile,
    setWeightLogs,
    setRecentActivityEvents,
    setAchievementBadges,
    setFollowingIds,
    setBlockedIds,
    setFollowStats,
    setNotifications,
    setUnreadNotificationCount,
    setShowNotificationCenter,
    setCommunitySearchQuery,
    setCommunitySearchResults,
    setModerationReports,
    setModerationStatus,
    setLatestResult,
    setTodayDone,
    setLoadingFeed,
    setLoadingMatePosts,
    setLoadingNotifications,
    setLoadingLeaderboard,
    setLoadingModeration,
    setLoadingInit,
    setInitStatus,
    captureError,
    setErrorMessage,
  })

  const showSuccess = useCallback((message, accent = 'default') => {
    setSuccessState({ message, accent })
  }, [])

  const refreshGuestSyncState = useCallback(async (nextIsAuthenticated = isAuthenticated) => {
    try {
      const pendingGuestLogs = await getGuestWorkouts()
      const pendingCount = pendingGuestLogs.length

      setGuestSyncState((current) => {
        if (current.phase === 'syncing') return current
        if (!pendingCount) {
          return {
            phase: 'idle',
            pendingCount: 0,
            failedCount: 0,
          }
        }

        return nextIsAuthenticated
          ? current.phase === 'failed'
            ? {
                phase: 'failed',
                pendingCount,
                failedCount: pendingCount,
              }
            : current
          : {
              phase: 'guest_pending',
              pendingCount,
              failedCount: 0,
            }
      })

      return pendingCount
    } catch {
      return 0
    }
  }, [isAuthenticated])

  /*
  const syncGuestWorkoutsToAccount = useCallback(async (nextUser) => {
    if (!nextUser?.id) {
      setGuestSyncState({
        phase: 'idle',
        pendingCount: 0,
        failedCount: 0,
      })
      return { syncedCount: 0, failedCount: 0 }
    }

    if (guestSyncPromiseRef.current) {
      return guestSyncPromiseRef.current
    }

    const syncTask = (async () => {
      const pendingGuestLogs = await getGuestWorkouts()
      const pendingCount = pendingGuestLogs.length

      if (!pendingCount) {
        setGuestSyncState({
          phase: 'idle',
          pendingCount: 0,
          failedCount: 0,
        })
        return { syncedCount: 0, failedCount: 0 }
      }

      setGuestSyncState({
        phase: 'syncing',
        pendingCount,
        failedCount: 0,
      })

      const syncResults = await Promise.allSettled(
      pendingGuestLogs.map(async (log) => {
        const {
          id,
          created_at: _createdAt,
          loggedDate,
          ...workoutDetails
        } = log

        await completeWorkout(
          nextUser.id,
          loggedDate || getTodayDateString(),
          workoutDetails,
        )

        return id
      }),
    )

    const syncedIds = syncResults
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter(Boolean)

    const failedCount = syncResults.length - syncedIds.length

    if (syncedIds.length > 0) {
      await deleteGuestWorkouts(syncedIds)
      await Promise.all([refreshFeed(nextUser.id), refreshUserSummary(nextUser.id)])
      showSuccess(
        isEnglish
          ? `Synced ${syncedIds.length} local workout${syncedIds.length === 1 ? '' : 's'}.`
          : `로컬 운동 기록 ${syncedIds.length}개를 동기화했어요.`,
        'info',
      )
    }

    if (failedCount > 0) {
      setErrorMessage(
        isEnglish
          ? `${failedCount} local workout ${failedCount === 1 ? 'is' : 'are'} still waiting to sync. Sign in again or refresh and try once more.`
          : `로컬 운동 기록 ${failedCount}개는 아직 동기화되지 않았어요. 로그인하거나 새로고침 후 다시 시도해 주세요.`,
      )
    }
  }, [isEnglish, refreshFeed, refreshUserSummary, setErrorMessage, showSuccess])

  */
  const syncGuestWorkoutsToAccount = useCallback(async (nextUser) => {
    if (!nextUser?.id) {
      setGuestSyncState({
        phase: 'idle',
        pendingCount: 0,
        failedCount: 0,
      })
      return { syncedCount: 0, failedCount: 0 }
    }

    if (guestSyncPromiseRef.current) {
      return guestSyncPromiseRef.current
    }

    const syncTask = (async () => {
      let pendingCount = 0

      try {
        const pendingGuestLogs = await getGuestWorkouts()
        pendingCount = pendingGuestLogs.length

        if (!pendingCount) {
          setGuestSyncState({
            phase: 'idle',
            pendingCount: 0,
            failedCount: 0,
          })
          return { syncedCount: 0, failedCount: 0 }
        }

        setGuestSyncState({
          phase: 'syncing',
          pendingCount,
          failedCount: 0,
        })

        const syncResults = await Promise.allSettled(
          pendingGuestLogs.map(async (log) => {
            const {
              id,
              created_at: _createdAt,
              loggedDate,
              ...workoutDetails
            } = log

            await completeWorkout(
              nextUser.id,
              loggedDate || getTodayDateString(),
              workoutDetails,
            )

            return id
          }),
        )

        const syncedIds = syncResults
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value)
          .filter(Boolean)

        const failedCount = syncResults.length - syncedIds.length

        if (syncedIds.length > 0) {
          await deleteGuestWorkouts(syncedIds)

          try {
            await Promise.all([refreshFeed(nextUser.id), refreshUserSummary(nextUser.id)])
          } catch (refreshError) {
            console.error('Failed to refresh after guest sync:', refreshError)
          }

          showSuccess(
            isEnglish
              ? `Synced ${syncedIds.length} local workout${syncedIds.length === 1 ? '' : 's'}.`
              : `로컬 운동 기록 ${syncedIds.length}개를 계정으로 옮겼어요.`,
            'info',
          )
        }

        if (failedCount > 0) {
          setGuestSyncState({
            phase: 'failed',
            pendingCount: failedCount,
            failedCount,
          })
        } else {
          setGuestSyncState({
            phase: 'idle',
            pendingCount: 0,
            failedCount: 0,
          })
        }

        return {
          syncedCount: syncedIds.length,
          failedCount,
        }
      } catch (error) {
        setGuestSyncState({
          phase: 'failed',
          pendingCount,
          failedCount: pendingCount,
        })
        throw error
      }
    })()

    guestSyncPromiseRef.current = syncTask
    return syncTask.finally(() => {
      guestSyncPromiseRef.current = null
    })
  }, [isEnglish, refreshFeed, refreshUserSummary, showSuccess])

  const handleRetryGuestSync = useCallback(async () => {
    if (!user?.id) {
      openAuthPrompt('guest_sync')
      return
    }

    setErrorMessage('')

    try {
      await syncGuestWorkoutsToAccount(user)
    } catch (error) {
      captureError(
        error,
        isEnglish
          ? 'Could not sync local workouts. Try again in a moment.'
          : '로컬 운동 기록을 동기화하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  }, [captureError, isEnglish, openAuthPrompt, setErrorMessage, syncGuestWorkoutsToAccount, user])

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

          /*
          try {
            await syncGuestWorkoutsToAccount(session.user)
          } catch (syncErr) {
            console.error('Failed to sync guest workouts:', syncErr)
            setErrorMessage(getActionableErrorMessage(
              syncErr,
              isEnglish
                ? 'Local workouts are still waiting to sync. Sign in again or refresh and try once more.'
                : '로컬 운동 기록이 아직 동기화되지 않았어요. 로그인하거나 새로고침 후 다시 시도해 주세요.',
              isEnglish,
            ))
          }
          */

        } else {
          await loadPublicData()
          navigateToView(VIEW.HOME, { replace: true })
        }
      } catch (error) {
        captureError(error, isEnglish ? 'Failed to sync auth state.' : '로그인 상태를 확인하지 못했어요.')
      } finally {
        setLoadingAuth(false)
      }
    })

    return () => {
      clearTimeout(failSafe)
      subscription.unsubscribe()
    }
  }, [captureError, initializeApp, isEnglish, loadPublicData, loadUserData, navigateToView])

  useEffect(() => {
    if (!successState) return undefined
    const timer = setTimeout(() => setSuccessState(null), 2600)
    return () => clearTimeout(timer)
  }, [successState])

  useEffect(() => {
    if (loadingInit || typeof window === 'undefined') return undefined
    if (window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1') return undefined

    const timer = setTimeout(() => setShowOnboardingCoach(true), 450)
    return () => clearTimeout(timer)
  }, [loadingInit])

  useEffect(() => {
    if (!celebration) return undefined
    const timer = setTimeout(() => setCelebration(null), 4200)
    return () => clearTimeout(timer)
  }, [celebration])

  useEffect(() => {
    if (loadingInit) return undefined

    if (!isAuthenticated) {
      guestSyncAttemptedUserRef.current = ''
      void refreshGuestSyncState(false)
    }

    return undefined
  }, [isAuthenticated, loadingInit, refreshGuestSyncState])

  useEffect(() => {
    if (loadingInit || !user?.id) return undefined
    if (guestSyncAttemptedUserRef.current === user.id) return undefined

    guestSyncAttemptedUserRef.current = user.id
    void syncGuestWorkoutsToAccount(user).catch((error) => {
      console.error('Failed to sync guest workouts:', error)
      captureError(
        error,
        isEnglish
          ? 'Could not sync local workouts right now. You can retry below.'
          : '로컬 운동 기록을 지금 동기화하지 못했어요. 아래에서 다시 시도해 주세요.',
      )
    })

    return undefined
  }, [captureError, isEnglish, loadingInit, syncGuestWorkoutsToAccount, user])

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
              isEnglish ? 'New notification.' : '새 알림.',
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
            : '운동할 시간이에요. 오늘 한 번만 남겨봐요.',
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
    navigateToView,
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
      captureError(error, isEnglish ? 'Failed to load notifications.' : '알림을 불러오지 못했습니다.')
    }
  }, [captureError, isEnglish, refreshNotifications, user?.id])

  const closeNotificationCenter = useCallback(() => {
    setShowNotificationCenter(false)
  }, [])

  const closeOnboardingCoach = useCallback(() => {
    setShowOnboardingCoach(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
    }
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
          ? (isEnglish ? 'Browser alerts are on.' : '브라우저 알림 켜짐.')
          : permission === 'denied'
            ? (isEnglish ? 'Browser alerts blocked. In-app reminders stay on.' : '브라우저 알림 차단. 앱 리마인더는 계속 보여요.')
            : (isEnglish ? 'Reminder permission request was dismissed.' : '리마인더 권한 요청이 닫혔어요.'),
        'info',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to request reminder permission.' : '알림 권한을 요청하지 못했어요.')
    }
  }, [captureError, isEnglish, showSuccess])

  const guardAuthAction = useCallback((reason, pendingAction = null) => {
    const authState = createAuthPromptState(isAuthenticated, reason, pendingAction)

    if (!authState.blocked) return false

    setAuthPrompt(authState.authPrompt)
    return true
  }, [isAuthenticated])

  const runActionTask = useCallback(async (
    task,
    fallbackMessage,
    options = {},
  ) => {
    const {
      useLoadingState = true,
      defaultValue = null,
    } = options

    if (useLoadingState) {
      setLoadingAction(true)
    }

    setErrorMessage('')

    try {
      return await task()
    } catch (error) {
      captureError(error, fallbackMessage)
      return defaultValue
    } finally {
      if (useLoadingState) {
        setLoadingAction(false)
      }
    }
  }, [captureError, setErrorMessage])

  const handleGoogleSignIn = async () => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
      persistPendingAction(authPrompt?.pendingAction ?? null)
      await signInWithOAuth('google')
    } catch (error) {
      captureError(error, isEnglish ? 'Google sign-in failed.' : 'Google 로그인을 완료하지 못했어요.')
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
      captureError(error, isEnglish ? 'Kakao sign-in failed.' : 'Kakao 로그인을 완료하지 못했어요.')
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
      captureError(error, isEnglish ? 'Sign-out failed.' : '로그아웃하지 못했어요.')
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
    setShowTestResult(true)
    const previousTotalXp = activitySummary.totalXp
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await saveTestResult(user.id, score, levelInfo.label)
      const [, summary] = await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])
      const gainedXp = Math.max((Number(summary.profile?.total_xp) || 0) - previousTotalXp, 0)
      if (gainedXp > 0) {
        showSuccess(
          isEnglish ? `Test +${gainedXp} XP` : `테스트 +${gainedXp} XP`,
          'info',
        )
      }
    } catch (error) {
      console.error(error)
      captureError(error, isEnglish ? 'The result is shown, but saving to the database failed. Please check SQL/RLS settings.' : '결과는 보이지만 저장하지 못했어요. 설정을 확인해 주세요.')
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

    if (typeof window !== 'undefined' && window.history.state?.workoutSheet !== true) {
      window.history.pushState(
        { ...(window.history.state ?? {}), workoutSheet: true },
        '',
        window.location.href,
      )
    }
  }, [profile?.default_share_to_feed, workoutStats.lastWorkoutDuration, workoutStats.lastWorkoutType])

  const closeWorkoutComposer = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.state?.workoutSheet === true) {
      window.history.back()
      return
    }

    setShowWorkoutPanel(false)
    setWorkoutPreset(null)
  }, [])

  const openTestFlow = useCallback(() => {
    setShowTestResult(false)
    setShowTestForm(true)
  }, [])

  const closeTestFlow = useCallback(() => {
    setShowTestForm(false)
    setShowTestResult(false)
  }, [])

  const handleWorkoutComplete = async (details = {}) => {
    const workoutPayload = {
      ...details,
      weightKg: bodyMetrics.latestWeightKg,
      loggedDate: getTodayDateString(),
    }

    if (!isAuthenticated) {
      try {
        setErrorMessage('')
        await saveGuestWorkout(workoutPayload)
        await refreshGuestSyncState(false)
        showSuccess(
          isEnglish
            ? 'Saved locally. Log in later to sync it to your account.'
            : '기기에 임시 저장했어요. 나중에 로그인하면 계정으로 동기화됩니다.',
          'info',
        )
        setShowWorkoutPanel(false)
        setWorkoutPreset(null)
        navigateToView(VIEW.HOME)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return true
      } catch (error) {
        console.error('Failed to save guest log', error)
        captureError(
          error,
          isEnglish
            ? 'Local storage is unavailable. Log in to save this workout.'
            : '이 기기에서는 임시 저장을 사용할 수 없어요. 로그인 후 저장해 주세요.',
        )
      }
    }

    if (guardAuthAction('save_workout', {
      type: 'complete_workout',
      reason: 'save_workout',
      view: VIEW.HOME,
      payload: workoutPayload,
    })) return false

    const previousWeeklyCount = workoutStats.weeklyCount
    const previousTotalXp = activitySummary.totalXp
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await completeWorkout(user.id, workoutPayload.loggedDate, workoutPayload)
      setTodayDone(true)
      const [, summary] = await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])

      if (previousWeeklyCount < challenge.goal && summary.stats.weeklyCount >= challenge.goal) {
        await createFeedPost(user.id, `challenge ${challenge.goal}`, 'challenge_complete', { week_key: getCurrentWeekKey(), goal: challenge.goal })
        await refreshFeed(user.id)
      }

      const gainedXp = Math.max((Number(summary.profile?.total_xp) || 0) - previousTotalXp, 0)
      showSuccess(
        gainedXp > 0
          ? (isEnglish ? `${workoutPayload.workoutType || 'Workout'} +${gainedXp} XP` : `${workoutPayload.workoutType || '운동'} +${gainedXp} XP`)
          : (isEnglish ? `${workoutPayload.workoutType || 'Workout'} saved` : `${workoutPayload.workoutType || '운동'} 저장`),
        'success',
      )
      setCelebration({
        workoutType: workoutPayload.workoutType || '운동',
        durationMinutes: Number(workoutPayload.durationMinutes) || 0,
        nextWeeklyCount: summary.stats.weeklyCount,
        gainedXp,
      })
      setShowWorkoutPanel(false)
      setWorkoutPreset(null)
      navigateToView(VIEW.HOME)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to save workout.' : '운동 기록을 저장하지 못했어요.')
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
      showSuccess(isEnglish ? 'Routine saved' : '루틴 저장', 'routine')
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to save routine.' : '루틴을 저장하지 못했어요.')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteWorkoutTemplate = async (templateId) => {
    if (!user?.id) return

    await runActionTask(async () => {
      await deleteWorkoutTemplate(user.id, templateId)
      const templates = await fetchWorkoutTemplates(user.id)
      setWorkoutTemplates(templates)
      showSuccess(isEnglish ? 'Routine deleted.' : '루틴 삭제.', 'danger-soft')
    }, isEnglish ? 'Failed to delete routine.' : '루틴을 삭제하지 못했어요.')
  }

  const handleUpdateWorkout = async (workoutLogId, details) => {
    if (!user?.id) return

    await runActionTask(async () => {
      await updateWorkoutLog(user.id, workoutLogId, {
        ...details,
        weightKg: bodyMetrics.latestWeightKg,
      })
      await refreshUserSummary(user.id)
      showSuccess(isEnglish ? 'Workout updated.' : '운동 수정.', 'info')
    }, isEnglish ? 'Failed to update workout.' : '운동 기록을 수정하지 못했어요.')
  }

  const handleDeleteWorkout = async (workoutLogId) => {
    if (!user?.id) return

    await runActionTask(async () => {
      await deleteWorkoutLog(user.id, workoutLogId)
      await Promise.all([refreshUserSummary(user.id), refreshLeaderboard()])
      const doneToday = await hasWorkoutCompleted(user.id, getTodayDateString())
      setTodayDone(doneToday)
      showSuccess(isEnglish ? 'Workout deleted.' : '운동 삭제.', 'danger-soft')
    }, isEnglish ? 'Failed to delete workout.' : '운동 기록을 삭제하지 못했어요.')
  }

  const handleToggleLike = async (postId, isLiked) => {
    if (guardAuthAction('like', {
      type: 'toggle_like',
      reason: 'like',
      view: VIEW.COMMUNITY,
      payload: { postId, isLiked },
    })) return

    await runActionTask(async () => {
      await toggleLike(user.id, postId, isLiked)
      await refreshFeed(user.id)
    }, isEnglish ? 'Failed to update like.' : '좋아요를 반영하지 못했어요.', { useLoadingState: false })
  }

  const handleSubmitComment = async (postId, content) => {
    if (guardAuthAction('comment', {
      type: 'submit_comment',
      reason: 'comment',
      view: VIEW.COMMUNITY,
      payload: { postId, content },
    })) return

    await runActionTask(async () => {
      await addComment(user.id, postId, content)
      await refreshFeed(user.id)
    }, isEnglish ? 'Failed to add comment.' : '댓글을 등록하지 못했어요.', { useLoadingState: false })
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
      showSuccess(isEnglish ? 'Report sent' : '신고 접수', 'info')
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to submit report.' : '신고를 접수하지 못했어요.')
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
        isEnglish ? 'Updated' : '처리했어요',
        'info',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update moderation report.' : '신고 상태를 바꾸지 못했어요.')
    } finally {
      setModerationActionLoading(false)
    }
  }

  const handleToggleReportedPostVisibility = async (report, nextVisibility, resolutionNote = '') => {
    if (!user?.id || !isAdmin || !report?.post_id) return

    setModerationActionLoading(true)
    setErrorMessage('')

    try {
      await setFeedPostVisibility(report.post_id, nextVisibility, resolutionNote)
      await Promise.all([
        refreshModeration(moderationStatus),
        refreshFeed(user.id),
      ])
      showSuccess(
        nextVisibility === 'visible'
          ? (isEnglish ? 'Restored' : '복구됨')
          : (isEnglish ? 'Hidden' : '숨김'),
        nextVisibility === 'visible' ? 'info' : 'danger-soft',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update post visibility.' : '게시글 노출 상태를 바꾸지 못했어요.')
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
          ? (isEnglish ? 'Unblocked' : '차단 해제')
          : (isEnglish ? 'Blocked' : '차단'),
        isBlocked ? 'info' : 'danger-soft',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update block.' : '차단 상태를 바꾸지 못했어요.')
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
          ? (isEnglish ? 'Saved. Reattach photo.' : '저장했어요. 사진만 다시 선택해 주세요')
          : changedReminderEnabled || changedReminderTime
            ? (isEnglish ? 'Saved. Reminder updated.' : '저장했어요. 알림도 바꿨어요')
            : (isEnglish ? 'Saved' : '저장했어요'),
        'info',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to save profile.' : '프로필을 저장하지 못했어요.')
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
          ? (isEnglish ? `Weight +${gainedXp} XP` : `체중 +${gainedXp} XP`)
          : (isEnglish ? 'Weight saved' : '체중 저장'),
        'success',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to save weight.' : '체중을 저장하지 못했어요.')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleCreateMatePost = async (draft) => {
    if (guardAuthAction('mate_post', {
      type: 'create_mate_post',
      reason: 'mate_post',
      view: VIEW.COMMUNITY,
      payload: draft,
    })) return false

    return runActionTask(async () => {
      await createMatePost(user.id, draft)
      await refreshMatePosts(user.id)
      showSuccess(
        isEnglish ? 'Posted' : '등록됨',
        'success',
      )
      return true
    }, isEnglish ? 'Failed to create mate post.' : '메이트 글을 올리지 못했어요.', { defaultValue: false })
  }

  const handleToggleMateInterest = async (postId, isInterested) => {
    if (!postId) return

    if (guardAuthAction('mate_interest', {
      type: 'toggle_mate_interest',
      reason: 'mate_interest',
      view: VIEW.COMMUNITY,
      payload: { postId, isInterested },
    })) return

    await runActionTask(async () => {
      await toggleMatePostInterest(user.id, postId, isInterested)
      await refreshMatePosts(user.id)
      showSuccess(
        isInterested
          ? (isEnglish ? 'Interest off' : '관심 취소')
          : (isEnglish ? 'Interested' : '관심 보냄'),
        'info',
      )
    }, isEnglish ? 'Failed to update mate interest.' : '관심 상태를 바꾸지 못했어요.')
  }

  const handleUpdateMatePostStatus = async (postId, status = 'closed') => {
    if (!postId || !user?.id) return

    await runActionTask(async () => {
      await updateMatePostStatus(user.id, postId, status)
      await refreshMatePosts(user.id)
      showSuccess(
        status === 'closed'
          ? (isEnglish ? 'Closed' : '마감')
          : (isEnglish ? 'Reopened' : '재개'),
        'info',
      )
    }, isEnglish ? 'Failed to update mate post.' : '메이트 글 상태를 바꾸지 못했어요.')
  }

  const handleToggleFollow = async (targetUserId, isFollowing) => {
    if (!targetUserId || user?.id === targetUserId) return

    if (guardAuthAction('follow', {
      type: 'toggle_follow',
      reason: 'follow',
      view: VIEW.COMMUNITY,
      payload: { targetUserId, isFollowing },
    })) return

    await runActionTask(async () => {
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
          ? (isEnglish ? 'Unfollowed' : '팔로우 취소')
          : (isEnglish ? 'Following' : '팔로우'),
        'info',
      )
    }, isEnglish ? 'Failed to update follow.' : '팔로우를 반영하지 못했어요.')
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
          isEnglish ? 'Search is taking too long.' : '사람 검색이 지연되고 있어요.',
        )

        if (!cancelled) {
          setCommunitySearchResults(
            rows.filter((item) => item.user_id !== user?.id && !blockedIds.includes(item.user_id)),
          )
        }
      } catch (error) {
        if (!cancelled) {
          setCommunitySearchResults([])
          captureError(error, isEnglish ? 'Failed to search users.' : '사람을 찾지 못했어요.')
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
  }, [blockedIds, captureError, communitySearchQuery, isEnglish, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      setModerationReports([])
      return undefined
    }

    refreshModeration(moderationStatus).catch((error) => {
      captureError(error, isEnglish ? 'Failed to load moderation.' : '운영 목록을 불러오지 못했습니다.')
    })

    return undefined
  }, [captureError, isAdmin, isAuthenticated, isEnglish, moderationStatus, refreshModeration])

  useEffect(() => {
    if (view !== VIEW.COMMUNITY || !hasCommunityNickname) return undefined

    refreshMatePosts(user?.id).catch((error) => {
      captureError(error, isEnglish ? 'Failed to load mate board.' : '메이트 게시판을 불러오지 못했습니다.')
    })

    return undefined
  }, [captureError, hasCommunityNickname, isEnglish, refreshMatePosts, user?.id, view])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncViewFromHistory = () => {
      setView(parseViewFromHash(window.location.hash, VIEW.HOME, Object.values(VIEW)))
      setHistoryTick((current) => current + 1)
    }

    window.addEventListener('hashchange', syncViewFromHistory)
    window.addEventListener('popstate', syncViewFromHistory)
    return () => {
      window.removeEventListener('hashchange', syncViewFromHistory)
      window.removeEventListener('popstate', syncViewFromHistory)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    document.documentElement.dataset.theme = themeMode
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const currentHash = window.location.hash || getHashForView(view)
    const normalizedState = buildAppHistoryState(view, window.history.state ?? {})

    if (window.history.state?.appView !== view) {
      window.history.replaceState(normalizedState, '', currentHash)
    }

    if (shouldPushHomeBackGuard(view, showWorkoutPanel, normalizedState)) {
      window.history.pushState(
        { ...normalizedState, appHomeGuard: true },
        '',
        currentHash,
      )
    }
  }, [historyTick, showWorkoutPanel, view])

  useEffect(() => {
    if (view === VIEW.HOME || !showWorkoutPanel) return

    setShowWorkoutPanel(false)
    setWorkoutPreset(null)
  }, [showWorkoutPanel, view])

  useEffect(() => {
    if (view === VIEW.PROGRESS || (!showTestForm && !showTestResult)) return

    setShowTestForm(false)
    setShowTestResult(false)
  }, [showTestForm, showTestResult, view])

  const handleChangeView = useCallback((nextView) => {
    const access = buildCommunityAccessResult(nextView, hasCommunityNickname, VIEW.COMMUNITY)

    if (!access.allowed) {
      navigateToView(VIEW.PROFILE)
      showSuccess(
        isEnglish
          ? 'Save nickname first.'
          : '닉네임 먼저 저장하기',
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
      showSuccess(isEnglish ? 'All read' : '모두 읽음', 'info')
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update notifications.' : '알림 상태를 바꾸지 못했습니다.')
    }
  }, [captureError, isEnglish, showSuccess, unreadNotificationCount, user?.id])

  const handleToggleTheme = useCallback(() => {
    setThemeMode((current) => getNextThemeMode(current))
  }, [])

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
        captureError(error, isEnglish ? 'Failed to open notification.' : '알림을 여는 중 문제가 생겼습니다.')
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
    captureError,
    handleChangeView,
    handleClearCommunityUser,
    handleSelectCommunityUser,
    isEnglish,
    user?.id,
  ])

  pendingReplayHandlersRef.current = {
    handleSubmitTest,
    handleWorkoutComplete,
    handleSaveWorkoutTemplate,
    handleToggleLike,
    handleSubmitComment,
    handleSubmitReport,
    handleUpdateProfile,
    handleSaveWeight,
    handleToggleFollow,
    handleToggleBlock,
    handleCreateMatePost,
    handleToggleMateInterest,
  }

  const replayPendingAction = useCallback(async (pendingAction) => {
    if (!pendingAction?.type) return

    closeAuthPrompt()

    if (pendingAction.view) {
      navigateToView(pendingAction.view)
    }

    const handlers = pendingReplayHandlersRef.current

    switch (pendingAction.type) {
      case 'submit_test':
        await handlers.handleSubmitTest?.(pendingAction.payload?.score)
        break
      case 'complete_workout':
        await handlers.handleWorkoutComplete?.(pendingAction.payload ?? {})
        break
      case 'reopen_workout':
        navigateToView(VIEW.HOME)
        openWorkoutComposer(pendingAction.payload ?? null)
        showSuccess(
          isEnglish
            ? 'Login complete. Re-attach any new photos, then save your workout.'
            : '로그인됐어요. 새 사진만 다시 붙이면 돼요.',
          'info',
        )
        break
      case 'save_workout_template':
        await handlers.handleSaveWorkoutTemplate?.(pendingAction.payload ?? {})
        break
      case 'toggle_like':
        await handlers.handleToggleLike?.(pendingAction.payload?.postId, pendingAction.payload?.isLiked)
        break
      case 'submit_comment':
        await handlers.handleSubmitComment?.(pendingAction.payload?.postId, pendingAction.payload?.content ?? '')
        break
      case 'submit_report': {
        const reportSubject = {
          kind: pendingAction.payload?.kind ?? (pendingAction.payload?.postId ? 'post' : 'user'),
          targetUserId: pendingAction.payload?.targetUserId ?? null,
          postId: pendingAction.payload?.postId ?? null,
        }
        setReportTarget(reportSubject)
        await handlers.handleSubmitReport?.({
          reason: pendingAction.payload?.reason ?? 'other',
          details: pendingAction.payload?.details ?? '',
          subjectOverride: reportSubject,
        })
        break
      }
      case 'update_profile':
        await handlers.handleUpdateProfile?.(pendingAction.payload ?? {})
        break
      case 'save_weight':
        await handlers.handleSaveWeight?.(pendingAction.payload?.weightKg)
        break
      case 'toggle_follow':
        await handlers.handleToggleFollow?.(pendingAction.payload?.targetUserId, pendingAction.payload?.isFollowing)
        break
      case 'create_mate_post':
        await handlers.handleCreateMatePost?.(pendingAction.payload ?? {})
        break
      case 'toggle_mate_interest':
        await handlers.handleToggleMateInterest?.(pendingAction.payload?.postId, pendingAction.payload?.isInterested)
        break
      case 'toggle_block':
        await handlers.handleToggleBlock?.(pendingAction.payload?.targetUserId, pendingAction.payload?.isBlocked)
        break
      default:
        break
    }
  }, [
    closeAuthPrompt,
    isEnglish,
    navigateToView,
    openWorkoutComposer,
    showSuccess,
  ])

  useEffect(() => {
    if (!isAuthenticated || loadingInit) return undefined

    const pendingAction = consumePendingAction()
    if (!pendingAction?.type) return undefined
    void replayPendingAction(pendingAction)
    return undefined
  }, [
    isAuthenticated,
    loadingInit,
    replayPendingAction,
  ])

  const tabs = [
    { key: VIEW.HOME, label: isEnglish ? 'Home' : '홈' },
    { key: VIEW.COMMUNITY, label: isEnglish ? 'Community' : '커뮤니티' },
    { key: VIEW.PROGRESS, label: isEnglish ? 'Records' : '기록' },
    { key: VIEW.PROFILE, label: isEnglish ? 'Profile' : '프로필' },
  ]
  const viewHeader = {
    [VIEW.HOME]: {
      eyebrow: isEnglish ? 'Gym Community' : 'Gym Community',
      title: isEnglish ? 'Today\'s Training' : '오늘 운동',
      body: isEnglish ? 'Pick one action and keep your momentum visible.' : '짧게라도 남기면 리듬이 이어져요.',
    },
    [VIEW.COMMUNITY]: {
      eyebrow: isEnglish ? 'Crew Feed' : '크루 피드',
      title: isEnglish ? 'Train Together' : '함께 뛰는 공간',
      body: isEnglish ? 'See logs, rankings, and teammates in one clean feed.' : '피드와 랭킹에서 서로의 운동을 응원해요.',
    },
    [VIEW.PROGRESS]: {
      eyebrow: isEnglish ? 'Progress Lab' : '성장 기록',
      title: isEnglish ? 'Your Records' : '내 기록',
      body: isEnglish ? 'Check your level, XP, body data, and workout history.' : '레벨, XP, 운동 흐름을 한눈에 확인해요.',
    },
    [VIEW.PROFILE]: {
      eyebrow: isEnglish ? 'Profile' : '프로필',
      title: isEnglish ? 'Your Fitness Identity' : '내 프로필',
      body: isEnglish ? 'Tune your goals, nickname, reminders, and community settings.' : '목표와 알림, 커뮤니티 설정을 정리해요.',
    },
  }[view]
  /*
  const guestSyncNotice = (() => {
    if (!guestSyncState.pendingCount) return null

    if (guestSyncState.phase === 'guest_pending' && !isAuthenticated) {
      return {
        tone: 'pending',
        kicker: isEnglish ? 'Local Save' : '로컬 저장',
        title: isEnglish ? 'Your workouts are safe on this device.' : '운동 기록이 이 기기에 안전하게 저장되어 있어요.',
        body: isEnglish
          ? 'Log in whenever you are ready and we will move them to your account.'
          : '원할 때 로그인하면 이 기록들을 계정으로 옮겨드릴게요.',
        meta: isEnglish
          ? `${guestSyncState.pendingCount} workout${guestSyncState.pendingCount === 1 ? '' : 's'} waiting on this device`
          : `${guestSyncState.pendingCount}개의 운동 기록이 이 기기에 대기 중이에요`,
        actionLabel: isEnglish ? 'Log in to sync' : '로그인하고 동기화',
        actionKind: 'auth',
      }
    }

    if (guestSyncState.phase === 'syncing') {
      return {
        tone: 'syncing',
        kicker: isEnglish ? 'Syncing' : '동기화 중',
        title: isEnglish ? 'Moving local workouts to your account.' : '로컬 운동 기록을 계정으로 옮기고 있어요.',
        body: isEnglish
          ? 'You can keep using the app while this finishes.'
          : '끝날 때까지 앱을 계속 사용해도 괜찮아요.',
        meta: isEnglish
          ? `${guestSyncState.pendingCount} workout${guestSyncState.pendingCount === 1 ? '' : 's'} syncing now`
          : `${guestSyncState.pendingCount}개의 운동 기록을 동기화하고 있어요`,
        actionLabel: '',
        actionKind: 'none',
      }
    }

    if (guestSyncState.phase === 'failed') {
      const pendingCount = guestSyncState.failedCount || guestSyncState.pendingCount

      return {
        tone: 'failed',
        kicker: isEnglish ? 'Sync Paused' : '동기화 대기',
        title: isEnglish ? 'Some local workouts still need another try.' : '일부 로컬 운동 기록은 한 번 더 동기화가 필요해요.',
        body: isEnglish
          ? 'Nothing was lost. Retry sync when your connection feels stable.'
          : '기록이 사라진 건 아니에요. 연결이 안정적일 때 다시 동기화해 주세요.',
        meta: isEnglish
          ? `${pendingCount} workout${pendingCount === 1 ? '' : 's'} still waiting`
          : `${pendingCount}개의 운동 기록이 아직 대기 중이에요`,
        actionLabel: isAuthenticated ? (isEnglish ? 'Retry sync' : '다시 동기화') : (isEnglish ? 'Log in to sync' : '로그인하고 동기화'),
        actionKind: isAuthenticated ? 'retry' : 'auth',
      }
    }

    return null
  })()
  */
  const guestSyncNotice = (() => {
    if (!guestSyncState.pendingCount) return null

    if (guestSyncState.phase === 'guest_pending' && !isAuthenticated) {
      return {
        tone: 'pending',
        kicker: isEnglish ? 'Local Save' : '\uB85C\uCEEC \uC800\uC7A5',
        title: isEnglish ? 'Your workouts are safe on this device.' : '\uC6B4\uB3D9 \uAE30\uB85D\uC774 \uC774 \uAE30\uAE30\uC5D0 \uC548\uC804\uD558\uAC8C \uC800\uC7A5\uB418\uC5B4 \uC788\uC5B4\uC694.',
        body: isEnglish ? 'Log in whenever you are ready and we will move them to your account.' : '\uC6D0\uD560 \uB54C \uB85C\uADF8\uC778\uD558\uBA74 \uC774 \uAE30\uB85D\uB4E4\uC744 \uACC4\uC815\uC73C\uB85C \uC62E\uACA8\uB4DC\uB9B4\uAC8C\uC694.',
        meta: isEnglish
          ? `${guestSyncState.pendingCount} workout${guestSyncState.pendingCount === 1 ? '' : 's'} waiting on this device`
          : `${guestSyncState.pendingCount}\uAC1C\uC758 \uC6B4\uB3D9 \uAE30\uB85D\uC774 \uC774 \uAE30\uAE30\uC5D0 \uB300\uAE30 \uC911\uC774\uC5D0\uC694`,
        actionLabel: isEnglish ? 'Log in to sync' : '\uB85C\uADF8\uC778\uD558\uACE0 \uB3D9\uAE30\uD654',
        actionKind: 'auth',
      }
    }

    if (guestSyncState.phase === 'syncing') {
      return {
        tone: 'syncing',
        kicker: isEnglish ? 'Syncing' : '\uB3D9\uAE30\uD654 \uC911',
        title: isEnglish ? 'Moving local workouts to your account.' : '\uB85C\uCEEC \uC6B4\uB3D9 \uAE30\uB85D\uC744 \uACC4\uC815\uC73C\uB85C \uC62E\uAE30\uACE0 \uC788\uC5B4\uC694.',
        body: isEnglish ? 'You can keep using the app while this finishes.' : '\uB05D\uB0A0 \uB54C\uAE4C\uC9C0 \uC571\uC744 \uACC4\uC18D \uC0AC\uC6A9\uD574\uB3C4 \uAD1C\uCC2E\uC544\uC694.',
        meta: isEnglish
          ? `${guestSyncState.pendingCount} workout${guestSyncState.pendingCount === 1 ? '' : 's'} syncing now`
          : `${guestSyncState.pendingCount}\uAC1C\uC758 \uC6B4\uB3D9 \uAE30\uB85D\uC744 \uB3D9\uAE30\uD654\uD558\uACE0 \uC788\uC5B4\uC694`,
        actionLabel: '',
        actionKind: 'none',
      }
    }

    if (guestSyncState.phase === 'failed') {
      const pendingCount = guestSyncState.failedCount || guestSyncState.pendingCount

      return {
        tone: 'failed',
        kicker: isEnglish ? 'Sync Paused' : '\uB3D9\uAE30\uD654 \uB300\uAE30',
        title: isEnglish ? 'Some local workouts still need another try.' : '\uC77C\uBD80 \uB85C\uCEEC \uC6B4\uB3D9 \uAE30\uB85D\uC740 \uD55C \uBC88 \uB354 \uB3D9\uAE30\uD654\uAC00 \uD544\uC694\uD574\uC694.',
        body: isEnglish ? 'Nothing was lost. Retry sync when your connection feels stable.' : '\uAE30\uB85D\uC774 \uC0AC\uB77C\uC9C4 \uAC74 \uC544\uB2C8\uC5D0\uC694. \uC5F0\uACB0\uC774 \uC548\uC815\uC801\uC77C \uB54C \uB2E4\uC2DC \uB3D9\uAE30\uD654\uD574 \uC8FC\uC138\uC694.',
        meta: isEnglish
          ? `${pendingCount} workout${pendingCount === 1 ? '' : 's'} still waiting`
          : `${pendingCount}\uAC1C\uC758 \uC6B4\uB3D9 \uAE30\uB85D\uC774 \uC544\uC9C1 \uB300\uAE30 \uC911\uC774\uC5D0\uC694`,
        actionLabel: isAuthenticated
          ? (isEnglish ? 'Retry sync' : '\uB2E4\uC2DC \uB3D9\uAE30\uD654')
          : (isEnglish ? 'Log in to sync' : '\uB85C\uADF8\uC778\uD558\uACE0 \uB3D9\uAE30\uD654'),
        actionKind: isAuthenticated ? 'retry' : 'auth',
      }
    }

    return null
  })()
  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-50 via-white to-emerald-50/40 text-gray-950 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 dark:text-white">
      {guestSyncNotice && (
        <section
          className={`fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 grid w-[min(92vw,42rem)] -translate-x-1/2 gap-2 rounded-3xl border bg-white p-4 text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white ${
            guestSyncNotice.tone === 'failed'
              ? 'border-rose-100 dark:border-rose-400/20'
              : 'border-emerald-100 dark:border-emerald-400/20'
          }`}
          role="status"
          aria-live="polite"
          data-testid={`guest-sync-${guestSyncNotice.tone}`}
        >
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{guestSyncNotice.kicker}</span>
          <strong className="text-base font-black leading-6">{guestSyncNotice.title}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-100">{guestSyncNotice.body}</p>
          <span className="text-xs font-black text-gray-700 dark:text-gray-200">{guestSyncNotice.meta}</span>
          {guestSyncNotice.actionKind !== 'none' && (
            <div className="mt-1">
              <button
                type="button"
                className={guestSyncNotice.actionKind === 'auth'
                  ? 'min-h-10 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50'
                  : 'min-h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10'}
                data-testid="guest-sync-action"
                onClick={guestSyncNotice.actionKind === 'auth' ? () => openAuthPrompt('guest_sync') : handleRetryGuestSync}
                disabled={guestSyncState.phase === 'syncing' || loadingAuth}
              >
                {guestSyncNotice.actionLabel}
              </button>
            </div>
          )}
        </section>
      )}
      {errorState && (
        <section className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 grid w-[min(92vw,42rem)] -translate-x-1/2 gap-3 rounded-3xl border border-rose-100 bg-white p-4 text-gray-950 shadow-sm dark:border-rose-400/20 dark:bg-neutral-900 dark:text-white" role="status" aria-live="polite">
          <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-300">{errorState.label}</span>
          <strong className="text-base font-black leading-6">{errorState.title}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-100">{visibleErrorMessage}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="min-h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10" onClick={() => window.location.reload()}>
              {isEnglish ? 'Refresh app' : '앱 새로고침'}
            </button>
            <button type="button" className="min-h-10 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={() => setErrorMessage('')}>
              {isEnglish ? 'Hide' : '닫기'}
            </button>
          </div>
        </section>
      )}
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
      <OnboardingCoach
        open={showOnboardingCoach && view === VIEW.HOME && !loadingInit && !showWorkoutPanel && !showTestForm && !showTestResult}
        isEnglish={isEnglish}
        onClose={closeOnboardingCoach}
        onStartTest={() => {
          closeOnboardingCoach()
          navigateToView(VIEW.PROGRESS)
          openTestFlow()
        }}
        onStartWorkout={() => {
          closeOnboardingCoach()
          openWorkoutComposer()
        }}
      />

      <MainLayout
        busy={loadingInit}
        contentId={loadingInit ? undefined : 'app-content'}
        pageHeader={loadingInit ? null : viewHeader}
        topNav={loadingInit ? null : (
          <AppTopActions
            isEnglish={isEnglish}
            themeMode={themeMode}
            isAuthenticated={isAuthenticated}
            showNotificationCenter={showNotificationCenter}
            unreadNotificationCount={unreadNotificationCount}
            onToggleTheme={handleToggleTheme}
            onOpenNotifications={openNotificationCenter}
          />
        )}
        bottomNav={loadingInit ? null : (
          <BottomTabNav
            tabs={tabs}
            currentView={view}
            onChangeView={handleChangeView}
          />
        )}
        navigationLabel={isEnglish ? 'Primary navigation' : '주요 화면 이동'}
      >
        {loadingInit ? (
          <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <div className="grid gap-3">
              <span className="h-3 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-white/10" />
              <span className="h-5 w-2/3 animate-pulse rounded-full bg-gray-100 dark:bg-white/10" />
            </div>
            <div className="h-48 animate-pulse rounded-3xl bg-gray-100 dark:bg-white/10" />
            <div className="grid grid-cols-3 gap-3">
              <span className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
              <span className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
              <span className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
            </div>
            <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{initStatus}</p>
          </section>
        ) : (
            <Suspense fallback={<RouteSuspenseFallback label={isEnglish ? 'Loading route...' : '화면을 불러오는 중입니다...'} />}>
              {view === VIEW.HOME && (
                <HomeRoute
                  celebration={celebration}
                  isEnglish={isEnglish}
                  profile={profile}
                  todayDone={todayDone}
                  currentLevel={latestResult?.level ?? testResult?.level ?? null}
                  stats={workoutStats}
                  challenge={challenge}
                  activitySummary={activitySummary}
                  homeInsight={homeInsight}
                  achievementBadges={achievementBadges}
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
                    openTestFlow()
                  }}
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
                  showTestResult={showTestResult}
                  onToggleTestFlow={() => {
                    if (showTestForm || showTestResult) {
                      closeTestFlow()
                      return
                    }

                    openTestFlow()
                  }}
                  onCloseTestFlow={closeTestFlow}
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
                  onSaveWeight={handleSaveWeight}
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
                  loadingMatePosts={loadingMatePosts}
                  loadingLeaderboard={loadingLeaderboard}
                  visibleLeaderboard={visibleLeaderboard}
                  visibleFeedPosts={visibleFeedPosts}
                  visibleMatePosts={visibleMatePosts}
                  onEnsureLeaderboard={refreshLeaderboard}
                  onToggleLike={handleToggleLike}
                  onSubmitComment={handleSubmitComment}
                  onCreateMatePost={handleCreateMatePost}
                  onToggleMateInterest={handleToggleMateInterest}
                  onUpdateMatePostStatus={handleUpdateMatePostStatus}
                  isAdmin={isAdmin}
                  moderationReports={moderationReports}
                  moderationLoading={loadingModeration}
                  moderationActionLoading={moderationActionLoading}
                  moderationStatus={moderationStatus}
                  onModerationStatusChange={setModerationStatus}
                  onRefreshModeration={() => refreshModeration(moderationStatus)}
                  onResolveReport={handleResolveReport}
                  onTogglePostVisibility={handleToggleReportedPostVisibility}
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
                  onGoProgress={() => navigateToView(VIEW.PROGRESS)}
                  onSaveProfile={handleUpdateProfile}
                  onSaveWeight={handleSaveWeight}
                />
              )}
            </Suspense>

        )}
      </MainLayout>
    </div>
  )
}

