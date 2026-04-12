import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import AppTopActions from './components/AppTopActions'
import AuthRequiredModal from './components/AuthRequiredModal'
import BottomTabNav from './components/BottomTabNav'
import NotificationCenter from './components/NotificationCenter'
import OnboardingCoach from './components/OnboardingCoach'
import PaywallModal from './components/PaywallModal'
import ReportModal from './components/ReportModal'
import { persistPendingAction } from './features/auth/authFlow'
import {
  getCurrentWeekKey,
  getTodayDateString,
} from './features/app/appFlowUtils'
import {
  INITIAL_STATS,
  validateDisplayName,
} from './features/profile/profileFlow'
import { useAppBootstrap } from './hooks/useAppBootstrap'
import { useAppDerivedState } from './hooks/useAppDerivedState'
import { useAppError } from './hooks/useAppError'
import { useAppLoading } from './hooks/useAppLoading'
import { useAppNavigation, VIEW } from './hooks/useAppNavigation'
import { useAppSession } from './hooks/useAppSession'
import { useAuthPrompt } from './hooks/useAuthPrompt'
import { useCelebration } from './hooks/useCelebration'
import { useCommunitySearch } from './hooks/useCommunitySearch'
import { useGuestSync } from './hooks/useGuestSync'
import { useModeration } from './hooks/useModeration'
import { useNotifications } from './hooks/useNotifications'
import { useOnboardingCoach } from './hooks/useOnboardingCoach'
import { useParty } from './hooks/useParty'
import { usePendingActionReplay } from './hooks/usePendingActionReplay'
import { usePro } from './hooks/usePro'
import { useReminder } from './hooks/useReminder'
import { useReportModal } from './hooks/useReportModal'
import { useSuccessToast } from './hooks/useSuccessToast'
import { useTheme } from './hooks/useTheme'
import { useWorkoutRouteSync, useWorkoutUiState } from './hooks/useWorkoutUiState'
import { useI18n } from './i18n.js'
import MainLayout from './components/Layout/MainLayout'
import RouteSuspenseFallback from './routes/RouteSuspenseFallback'
import { signOutUser } from './services/auth'
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
  followUser,
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
} from './services/communityService'
import { saveGuestWorkout } from './lib/guestStorage.js'
import { getActivityLevelProgress } from './utils/activityLevel'
import { getLevelByScore } from './utils/level'
import { FREE_WORKOUT_LOG_LIMIT, PREMIUM_CONTEXT } from './utils/premium'

const HomeRoute = lazy(() => import('./routes/HomeRoute'))
const ProgressRoute = lazy(() => import('./routes/ProgressRoute'))
const CommunityRoute = lazy(() => import('./routes/CommunityRoute'))
const ProfileRoute = lazy(() => import('./routes/ProfileRoute'))

export default function App() {
  const { language, setLanguage, isEnglish } = useI18n()
  const initInProgressRef = useRef(false)
  const refreshNotificationsRef = useRef(null)
  const refreshModerationRef = useRef(null)
  const refreshFeedRef = useRef(null)
  const pendingReplayHandlersRef = useRef({})
  const [user, setUser] = useState(null)
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
  const [selectedCommunityUser, setSelectedCommunityUser] = useState(null)
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState(null)
  const [loadingSelectedCommunityProfile, setLoadingSelectedCommunityProfile] = useState(false)
  const [todayDone, setTodayDone] = useState(false)
  const {
    errorState,
    setErrorMessage,
    visibleErrorMessage,
    captureError,
  } = useAppError(isEnglish)
  const isAuthenticated = Boolean(user?.id)

  const {
    successState,
    showSuccess,
    toastToneClass,
    toastDotClass,
  } = useSuccessToast()
  const {
    loadingInit,
    setLoadingInit,
    loadingAction,
    setLoadingAction,
    loadingFeed,
    setLoadingFeed,
    loadingMatePosts,
    setLoadingMatePosts,
    loadingLeaderboard,
    setLoadingLeaderboard,
    loadingAuth,
    setLoadingAuth,
    initStatus,
    setInitStatus,
    runActionTask,
  } = useAppLoading({ isEnglish, captureError, setErrorMessage })
  const {
    authPrompt,
    openAuthPrompt,
    closeAuthPrompt,
    guardAuthAction,
    handleGoogleSignIn,
    handleKakaoSignIn,
    handleNaverSignIn,
  } = useAuthPrompt({
    isAuthenticated,
    isEnglish,
    setLoadingAuth,
    setErrorMessage,
    captureError,
  })
  const {
    celebration,
    setCelebration,
    clearCelebration,
  } = useCelebration()
  const {
    showOnboardingCoach,
    closeOnboardingCoach,
  } = useOnboardingCoach({ loadingInit })
  const { themeMode, handleToggleTheme } = useTheme()
  const {
    showTestForm,
    showTestResult,
    showWorkoutPanel,
    workoutPreset,
    openWorkoutComposer,
    closeWorkoutComposer,
    dismissWorkoutComposer,
    openTestFlow,
    closeTestFlow,
    showTestResultOnly,
  } = useWorkoutUiState({ profile, workoutStats })
  const {
    communitySearchQuery,
    setCommunitySearchQuery,
    communitySearchResults,
    setCommunitySearchResults,
    loadingCommunitySearch,
  } = useCommunitySearch({
    blockedIds,
    captureError,
    isEnglish,
    userId: user?.id,
  })

  const {
    badges,
    challenge,
    suggestedUsers,
    effectiveProfile,
    bodyMetrics,
    activitySummary,
    hasCommunityNickname,
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
    todayDone,
    followingIds,
    feedPosts,
    matePosts,
    selectedCommunityProfile,
    selectedCommunityUser,
  })

  const {
    view,
    navigateToView,
    handleChangeView,
  } = useAppNavigation({
    hasCommunityNickname,
    isEnglish,
    showSuccess,
    showWorkoutPanel,
  })
  useWorkoutRouteSync({
    view,
    homeView: VIEW.HOME,
    progressView: VIEW.PROGRESS,
    showWorkoutPanel,
    showTestForm,
    showTestResult,
    dismissWorkoutComposer,
    closeTestFlow,
  })

  const {
    reminderStatus,
    reminderPermission,
    handleRequestReminderPermission,
  } = useReminder({
    isAuthenticated,
    userId: user?.id,
    isEnglish,
    language,
    effectiveProfile,
    todayDone,
    navigateToView,
    homeView: VIEW.HOME,
    showSuccess,
    captureError,
  })

  const {
    notifications,
    setNotifications,
    unreadNotificationCount,
    setUnreadNotificationCount,
    showNotificationCenter,
    setShowNotificationCenter,
    loadingNotifications,
    setLoadingNotifications,
    openNotificationCenter,
    closeNotificationCenter,
    handleMarkAllNotificationsRead,
    handleOpenNotification: openNotificationFromHook,
  } = useNotifications({
    isAuthenticated,
    userId: user?.id,
    isEnglish,
    communityView: VIEW.COMMUNITY,
    refreshNotificationsRef,
    showSuccess,
    captureError,
  })

  const {
    moderationReports,
    setModerationReports,
    moderationStatus,
    setModerationStatus,
    loadingModeration,
    setLoadingModeration,
    moderationActionLoading,
    refreshCurrentModeration,
    handleResolveReport,
    handleToggleReportedPostVisibility,
  } = useModeration({
    isAuthenticated,
    isAdmin,
    userId: user?.id,
    isEnglish,
    refreshModerationRef,
    refreshFeedRef,
    captureError,
    showSuccess,
    setErrorMessage,
  })
  const {
    reportTarget,
    setReportTarget,
    openReportComposer,
    closeReportComposer,
    handleSubmitReport,
  } = useReportModal({
    userId: user?.id,
    isEnglish,
    guardAuthAction,
    setLoadingAction,
    setErrorMessage,
    captureError,
    showSuccess,
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

  refreshNotificationsRef.current = refreshNotifications
  refreshModerationRef.current = refreshModeration
  refreshFeedRef.current = refreshFeed

  const {
    partySnapshot,
    partyInviteCandidates,
    handleCreateParty,
    handleInvitePartyMember,
    handleSharePartyInvite,
  } = useParty({
    userId: user?.id,
    effectiveProfile,
    activitySummary,
    workoutStats,
    visibleLeaderboard,
    followingIds,
    isEnglish,
    showSuccess,
    captureError,
  })

  const {
    paywallContext,
    openPaywall,
    closePaywall,
    handleUpgradePlan,
  } = usePro({
    isPro,
    isAuthenticated,
    isEnglish,
    language,
    effectiveProfile,
    userId: user?.id,
    setProfile,
    setLeaderboard,
    setFeedPosts,
    setLoadingAction,
    showSuccess,
    openAuthPrompt,
    captureError,
  })

  const {
    guestSyncState,
    guestSyncNotice,
    refreshGuestSyncState,
    handleRetryGuestSync,
  } = useGuestSync({
    isAuthenticated,
    loadingInit,
    user,
    isEnglish,
    refreshFeed,
    refreshUserSummary,
    showSuccess,
    captureError,
    setErrorMessage,
    openAuthPrompt,
  })

  useAppSession({
    initializeApp,
    initInProgressRef,
    loadPublicData,
    loadUserData,
    navigateToView,
    homeView: VIEW.HOME,
    setLoadingAuth,
    setLoadingInit,
    captureError,
    isEnglish,
  })

  const handleSignOut = async () => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
      await signOutUser()
      persistPendingAction(null)
      await loadPublicData()
      navigateToView(VIEW.HOME, { replace: true })
    } catch (error) {
      captureError(error, isEnglish ? 'Sign-out failed.' : '濡쒓렇?꾩썐?섏? 紐삵뻽?댁슂.')
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
    showTestResultOnly()
    const previousTotalXp = activitySummary.totalXp
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await saveTestResult(user.id, score, levelInfo.label)
      const [, summary] = await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])
      const gainedXp = Math.max((Number(summary.profile?.total_xp) || 0) - previousTotalXp, 0)
      if (gainedXp > 0) {
        showSuccess(
          isEnglish ? `Test +${gainedXp} XP` : `?뚯뒪??+${gainedXp} XP`,
          'info',
        )
      }
    } catch (error) {
      console.error(error)
      captureError(error, isEnglish ? 'The result is shown, but saving to the database failed. Please check SQL/RLS settings.' : '寃곌낵??蹂댁씠吏留???ν븯吏 紐삵뻽?댁슂. ?ㅼ젙???뺤씤??二쇱꽭??')
    } finally {
      setLoadingAction(false)
    }
  }

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
        setTodayDone(true)
        const guestLevelProgress = getActivityLevelProgress(activitySummary.totalXp)
        setCelebration({
          workoutType: workoutPayload.workoutType || (isEnglish ? 'Workout' : '?대룞'),
          durationMinutes: Number(workoutPayload.durationMinutes) || 0,
          nextWeeklyCount: (Number(workoutStats.weeklyCount) || 0) + 1,
          gainedXp: 0,
          previousTotalXp: activitySummary.totalXp,
          totalXp: activitySummary.totalXp,
          previousLevelValue: guestLevelProgress.levelValue,
          levelValue: guestLevelProgress.levelValue,
          remainingXp: guestLevelProgress.remainingXp,
          leveledUp: false,
        })
        showSuccess(
          isEnglish
            ? 'Saved locally. Log in later to sync it to your account.'
            : '湲곌린???꾩떆 ??ν뻽?댁슂. ?섏쨷??濡쒓렇?명븯硫?怨꾩젙?쇰줈 ?숆린?붾맗?덈떎.',
          'info',
        )
        dismissWorkoutComposer()
        navigateToView(VIEW.HOME)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return true
      } catch (error) {
        console.error('Failed to save guest log', error)
        captureError(
          error,
          isEnglish
            ? 'Local storage is unavailable. Log in to save this workout.'
            : '??湲곌린?먯꽌???꾩떆 ??μ쓣 ?ъ슜?????놁뼱?? 濡쒓렇??????ν빐 二쇱꽭??',
        )
      }
    }

    if (guardAuthAction('save_workout', {
      type: 'complete_workout',
      reason: 'save_workout',
      view: VIEW.HOME,
      payload: workoutPayload,
    })) return false

    if (!isPro && workoutHistory.length >= FREE_WORKOUT_LOG_LIMIT) {
      openPaywall(PREMIUM_CONTEXT.UNLIMITED)
      showSuccess(
        isEnglish
          ? `Free includes ${FREE_WORKOUT_LOG_LIMIT} saved workouts. Pro unlocks unlimited history.`
          : `Free??${FREE_WORKOUT_LOG_LIMIT}媛쒓퉴吏. Pro??臾댁젣?쒖씠?먯슂.`,
        'info',
      )
      return false
    }

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

      const nextTotalXp = Number(summary.profile?.total_xp) || previousTotalXp
      const gainedXp = Math.max(nextTotalXp - previousTotalXp, 0)
      const previousLevelProgress = getActivityLevelProgress(previousTotalXp)
      const nextLevelProgress = getActivityLevelProgress(nextTotalXp)
      showSuccess(
        gainedXp > 0
          ? (isEnglish ? `${workoutPayload.workoutType || 'Workout'} +${gainedXp} XP` : `${workoutPayload.workoutType || '운동'} +${gainedXp} XP`)
          : (isEnglish ? `${workoutPayload.workoutType || 'Workout'} saved` : `${workoutPayload.workoutType || '운동'} 저장`),
        'success',
      )
      setCelebration({
        workoutType: workoutPayload.workoutType || (isEnglish ? 'Workout' : '운동'),
        durationMinutes: Number(workoutPayload.durationMinutes) || 0,
        nextWeeklyCount: summary.stats.weeklyCount,
        gainedXp,
        previousTotalXp,
        totalXp: nextTotalXp,
        previousLevelValue: previousLevelProgress.levelValue,
        levelValue: nextLevelProgress.levelValue,
        remainingXp: nextLevelProgress.remainingXp,
        leveledUp: nextLevelProgress.levelValue > previousLevelProgress.levelValue,
      })
      dismissWorkoutComposer()
      navigateToView(VIEW.HOME)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to save workout.' : '?대룞 ??μ뿉 ?ㅽ뙣?덉뼱??')
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
      showSuccess(isEnglish ? 'Routine deleted.' : '猷⑦떞 ??젣.', 'danger-soft')
    }, isEnglish ? 'Failed to delete routine.' : '猷⑦떞????젣?섏? 紐삵뻽?댁슂.')
  }

  const handleUpdateWorkout = async (workoutLogId, details) => {
    if (!user?.id) return

    await runActionTask(async () => {
      await updateWorkoutLog(user.id, workoutLogId, {
        ...details,
        weightKg: bodyMetrics.latestWeightKg,
      })
      await refreshUserSummary(user.id)
      showSuccess(isEnglish ? 'Workout updated.' : '?대룞 ?섏젙.', 'info')
    }, isEnglish ? 'Failed to update workout.' : '?섏젙???ㅽ뙣?덉뼱??')
  }

  const handleDeleteWorkout = async (workoutLogId) => {
    if (!user?.id) return

    await runActionTask(async () => {
      await deleteWorkoutLog(user.id, workoutLogId)
      await Promise.all([refreshUserSummary(user.id), refreshLeaderboard()])
      const doneToday = await hasWorkoutCompleted(user.id, getTodayDateString())
      setTodayDone(doneToday)
      showSuccess(isEnglish ? 'Workout deleted.' : '?대룞 ??젣.', 'danger-soft')
    }, isEnglish ? 'Failed to delete workout.' : '??젣???ㅽ뙣?덉뼱??')
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
    }, isEnglish ? 'Failed to update like.' : '醫뗭븘?붾? 諛섏쁺?섏? 紐삵뻽?댁슂.', { useLoadingState: false })
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
    }, isEnglish ? 'Failed to add comment.' : '?볤????깅줉?섏? 紐삵뻽?댁슂.', { useLoadingState: false })
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
          ? (isEnglish ? 'Unblocked' : '李⑤떒 ?댁젣')
          : (isEnglish ? 'Blocked' : '李⑤떒'),
        isBlocked ? 'info' : 'danger-soft',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update block.' : '李⑤떒 ?곹깭瑜?諛붽씀吏 紐삵뻽?댁슂.')
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
          ? (isEnglish ? 'Saved. Reattach photo.' : '저장했어요. 사진만 다시 선택해 주세요.')
          : changedReminderEnabled || changedReminderTime
            ? (isEnglish ? 'Saved. Reminder updated.' : '저장했어요. 알림도 바꿨어요.')
            : (isEnglish ? 'Saved' : '저장했어요.'),
        'info',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to save profile.' : '?꾨줈?꾩쓣 ??ν븯吏 紐삵뻽?댁슂.')
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
        isEnglish ? 'Posted' : '등록했어요.',
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
          ? (isEnglish ? 'Interest off' : '愿??痍⑥냼')
          : (isEnglish ? 'Interested' : '愿??蹂대깂'),
        'info',
      )
    }, isEnglish ? 'Failed to update mate interest.' : '愿???곹깭瑜?諛붽씀吏 紐삵뻽?댁슂.')
  }

  const handleUpdateMatePostStatus = async (postId, status = 'closed') => {
    if (!postId || !user?.id) return

    await runActionTask(async () => {
      await updateMatePostStatus(user.id, postId, status)
      await refreshMatePosts(user.id)
      showSuccess(
        status === 'closed'
          ? (isEnglish ? 'Closed' : '留덇컧')
          : (isEnglish ? 'Reopened' : '?ш컻'),
        'info',
      )
    }, isEnglish ? 'Failed to update mate post.' : '硫붿씠??湲 ?곹깭瑜?諛붽씀吏 紐삵뻽?댁슂.')
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
          : (isEnglish ? 'Following' : '팔로우 중'),
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
    if (view !== VIEW.COMMUNITY || !hasCommunityNickname) return undefined

    refreshMatePosts(user?.id).catch((error) => {
      captureError(error, isEnglish ? 'Failed to load mate board.' : '硫붿씠??寃뚯떆?먯쓣 遺덈윭?ㅼ? 紐삵뻽?듬땲??')
    })

    return undefined
  }, [captureError, hasCommunityNickname, isEnglish, refreshMatePosts, user?.id, view])

  const handleOpenNotification = useCallback((notification) => {
    return openNotificationFromHook(notification, {
      onSelectUser: handleSelectCommunityUser,
      onClearUser: handleClearCommunityUser,
      onChangeView: handleChangeView,
    })
  }, [
    handleChangeView,
    handleClearCommunityUser,
    handleSelectCommunityUser,
    openNotificationFromHook,
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

  usePendingActionReplay({
    isAuthenticated,
    loadingInit,
    isEnglish,
    homeView: VIEW.HOME,
    pendingReplayHandlersRef,
    closeAuthPrompt,
    navigateToView,
    openWorkoutComposer,
    setReportTarget,
    showSuccess,
  })

  const tabs = [
    { key: VIEW.HOME, label: isEnglish ? 'Home' : '홈' },
    { key: VIEW.COMMUNITY, label: isEnglish ? 'Crew' : '크루' },
    { key: VIEW.PROGRESS, label: isEnglish ? 'Records' : '기록' },
    { key: VIEW.PROFILE, label: isEnglish ? 'Profile' : '프로필' },
  ]
  const viewHeader = {
    [VIEW.HOME]: {
      eyebrow: isEnglish ? 'Gym Community' : 'Gym Community',
      title: isEnglish ? 'Today\'s Training' : '오늘 뭐 하지?',
      body: isEnglish ? 'Pick one action. Keep the rhythm.' : '하나만 해도 리듬은 이어져요.',
    },
    [VIEW.COMMUNITY]: {
      eyebrow: isEnglish ? 'Crew Feed' : '크루 피드',
      title: isEnglish ? 'Train Together' : '같이 하면 더 강해져요',
      body: isEnglish ? 'Cheer, rank, repeat.' : '응원하고, 겨루고, 다시 움직여요.',
    },
    [VIEW.PROGRESS]: {
      eyebrow: isEnglish ? 'Progress Lab' : '성장 기록',
      title: isEnglish ? 'Your Records' : '내 기록',
      body: isEnglish ? 'Level, XP, workouts.' : '레벨, XP, 운동 흐름을 한눈에.',
    },
    [VIEW.PROFILE]: {
      eyebrow: isEnglish ? 'Profile' : '프로필',
      title: isEnglish ? 'Your Fitness Identity' : '내 운동 프로필',
      body: isEnglish ? 'Goals, reminders, identity.' : '목표와 알림을 가볍게 정리해요.',
    },
  }[view]
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
                  ? 'min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50'
                  : 'min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10'}
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
            <button type="button" className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10" onClick={() => window.location.reload()}>
              {isEnglish ? 'Refresh app' : '???덈줈怨좎묠'}
            </button>
            <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={() => setErrorMessage('')}>
              {isEnglish ? 'Hide' : '?リ린'}
            </button>
          </div>
        </section>
      )}
      {successState && (
        <div
          className={`fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] left-1/2 z-50 flex w-[min(92vw,32rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm sm:bottom-[calc(env(safe-area-inset-bottom)+6rem)] ${toastToneClass}`}
          role="status"
          aria-live="polite"
          data-testid="app-toast"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toastDotClass}`} />
          <span>{successState.message}</span>
        </div>
      )}
      <AuthRequiredModal
        open={Boolean(authPrompt)}
        reason={authPrompt?.reason}
        loading={loadingAuth}
        onClose={closeAuthPrompt}
        onGoogleSignIn={handleGoogleSignIn}
        onKakaoSignIn={handleKakaoSignIn}
        onNaverSignIn={handleNaverSignIn}
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
        navigationLabel={isEnglish ? 'Primary navigation' : '二쇱슂 ?붾㈃ ?대룞'}
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
            <Suspense fallback={<RouteSuspenseFallback label={isEnglish ? 'Loading route...' : '?붾㈃??遺덈윭?ㅻ뒗 以묒엯?덈떎...'} />}>
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
                  leaderboard={visibleLeaderboard}
                  currentUserId={user?.id}
                  partySnapshot={partySnapshot}
                  partyInviteCandidates={partyInviteCandidates}
                  homeInsight={homeInsight}
                  achievementBadges={achievementBadges}
                  reminder={reminderStatus}
                  reminderPermission={reminderPermission}
                  feedPreview={homeFeedPreview}
                  routineTemplates={workoutTemplates}
                  workoutHistory={workoutHistory}
                  workoutLoading={loadingAction}
                  isPro={isPro}
                  onOpenWorkoutComposer={() => {
                    clearCelebration()
                    openWorkoutComposer()
                  }}
                  onCompleteRecommendedWorkout={(workoutDetails) => {
                    clearCelebration()
                    handleWorkoutComplete(workoutDetails)
                  }}
                  onOpenPaywall={openPaywall}
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
                  onCreateParty={handleCreateParty}
                  onInvitePartyMember={handleInvitePartyMember}
                  onSharePartyInvite={handleSharePartyInvite}
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
                  profile={effectiveProfile}
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
                  isPro={isPro}
                  onOpenPaywall={openPaywall}
                  moderationReports={moderationReports}
                  moderationLoading={loadingModeration}
                  moderationActionLoading={moderationActionLoading}
                  moderationStatus={moderationStatus}
                  onModerationStatusChange={setModerationStatus}
                  onRefreshModeration={refreshCurrentModeration}
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

