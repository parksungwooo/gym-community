import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n.js'
import { useAppActions } from './useAppActions'
import { useAppBootstrap } from './useAppBootstrap'
import { useAppDataState } from './useAppDataState'
import { useAppDerivedState } from './useAppDerivedState'
import { useAppError } from './useAppError'
import { useAppLoading } from './useAppLoading'
import { useAppNavigation, VIEW } from './useAppNavigation'
import { useAppSession } from './useAppSession'
import { useAuthPrompt } from './useAuthPrompt'
import { useCelebration } from './useCelebration'
import { useCommunitySearch } from './useCommunitySearch'
import { useCommunitySelection } from './useCommunitySelection'
import { useCommunityViewRefresh } from './useCommunityViewRefresh'
import { useGuestSync } from './useGuestSync'
import { useModeration } from './useModeration'
import { useNotifications } from './useNotifications'
import { useOnboardingCoach } from './useOnboardingCoach'
import { useParty } from './useParty'
import { usePro } from './usePro'
import { useReminder } from './useReminder'
import { useReportModal } from './useReportModal'
import { useSuccessToast } from './useSuccessToast'
import { useTheme } from './useTheme'
import { useWorkoutRouteSync, useWorkoutUiState } from './useWorkoutUiState'

function buildTabs(isEnglish) {
  return [
    { key: VIEW.HOME, label: isEnglish ? 'Home' : '홈' },
    { key: VIEW.COMMUNITY, label: isEnglish ? 'Crew' : '크루' },
    { key: VIEW.PROGRESS, label: isEnglish ? 'Records' : '기록' },
    { key: VIEW.PROFILE, label: isEnglish ? 'Profile' : '프로필' },
  ]
}

function buildViewHeader(view, isEnglish) {
  return {
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
}

export function useGymCommunityApp() {
  const { language, setLanguage, isEnglish } = useI18n()
  const initInProgressRef = useRef(false)
  const refreshNotificationsRef = useRef(null)
  const refreshModerationRef = useRef(null)
  const refreshFeedRef = useRef(null)
  const appState = useAppDataState()
  const error = useAppError(isEnglish)
  const toast = useSuccessToast()
  const loading = useAppLoading({
    isEnglish,
    captureError: error.captureError,
    setErrorMessage: error.setErrorMessage,
  })
  const auth = useAuthPrompt({
    isAuthenticated: appState.isAuthenticated,
    isEnglish,
    setLoadingAuth: loading.setLoadingAuth,
    setErrorMessage: error.setErrorMessage,
    captureError: error.captureError,
  })
  const celebration = useCelebration()
  const onboardingCoach = useOnboardingCoach({ loadingInit: loading.loadingInit })
  const theme = useTheme()
  const workoutUi = useWorkoutUiState({
    profile: appState.profile,
    workoutStats: appState.workoutStats,
  })
  const communitySearch = useCommunitySearch({
    blockedIds: appState.blockedIds,
    captureError: error.captureError,
    isEnglish,
    userId: appState.user?.id,
  })
  const communitySelection = useCommunitySelection({
    blockedIds: appState.blockedIds,
  })
  const derived = useAppDerivedState({
    ...appState,
    selectedCommunityProfile: communitySelection.selectedCommunityProfile,
    selectedCommunityUser: communitySelection.selectedCommunityUser,
    isEnglish,
  })
  const navigation = useAppNavigation({
    hasCommunityNickname: derived.hasCommunityNickname,
    isEnglish,
    showSuccess: toast.showSuccess,
    showWorkoutPanel: workoutUi.showWorkoutPanel,
  })

  useWorkoutRouteSync({
    view: navigation.view,
    homeView: VIEW.HOME,
    progressView: VIEW.PROGRESS,
    showWorkoutPanel: workoutUi.showWorkoutPanel,
    showTestForm: workoutUi.showTestForm,
    showTestResult: workoutUi.showTestResult,
    dismissWorkoutComposer: workoutUi.dismissWorkoutComposer,
    closeTestFlow: workoutUi.closeTestFlow,
  })

  const reminder = useReminder({
    isAuthenticated: appState.isAuthenticated,
    userId: appState.user?.id,
    isEnglish,
    language,
    effectiveProfile: derived.effectiveProfile,
    todayDone: appState.todayDone,
    navigateToView: navigation.navigateToView,
    homeView: VIEW.HOME,
    showSuccess: toast.showSuccess,
    captureError: error.captureError,
  })
  const notifications = useNotifications({
    isAuthenticated: appState.isAuthenticated,
    userId: appState.user?.id,
    isEnglish,
    communityView: VIEW.COMMUNITY,
    refreshNotificationsRef,
    showSuccess: toast.showSuccess,
    captureError: error.captureError,
  })
  const moderation = useModeration({
    isAuthenticated: appState.isAuthenticated,
    isAdmin: derived.isAdmin,
    userId: appState.user?.id,
    isEnglish,
    refreshModerationRef,
    refreshFeedRef,
    captureError: error.captureError,
    showSuccess: toast.showSuccess,
    setErrorMessage: error.setErrorMessage,
  })
  const report = useReportModal({
    userId: appState.user?.id,
    isEnglish,
    guardAuthAction: auth.guardAuthAction,
    setLoadingAction: loading.setLoadingAction,
    setErrorMessage: error.setErrorMessage,
    captureError: error.captureError,
    showSuccess: toast.showSuccess,
  })
  const bootstrap = useAppBootstrap({
    ...appState,
    isEnglish,
    initInProgressRef,
    blockedIds: appState.blockedIds,
    moderationStatus: moderation.moderationStatus,
    isAdmin: derived.isAdmin,
    currentUserId: appState.user?.id,
    setNotifications: notifications.setNotifications,
    setUnreadNotificationCount: notifications.setUnreadNotificationCount,
    setShowNotificationCenter: notifications.setShowNotificationCenter,
    setCommunitySearchQuery: communitySearch.setCommunitySearchQuery,
    setCommunitySearchResults: communitySearch.setCommunitySearchResults,
    setModerationReports: moderation.setModerationReports,
    setModerationStatus: moderation.setModerationStatus,
    setLoadingFeed: loading.setLoadingFeed,
    setLoadingMatePosts: loading.setLoadingMatePosts,
    setLoadingNotifications: notifications.setLoadingNotifications,
    setLoadingLeaderboard: loading.setLoadingLeaderboard,
    setLoadingModeration: moderation.setLoadingModeration,
    setLoadingInit: loading.setLoadingInit,
    setInitStatus: loading.setInitStatus,
    captureError: error.captureError,
    setErrorMessage: error.setErrorMessage,
  })

  useEffect(() => {
    refreshNotificationsRef.current = bootstrap.refreshNotifications
    refreshModerationRef.current = bootstrap.refreshModeration
    refreshFeedRef.current = bootstrap.refreshFeed
  }, [
    bootstrap.refreshFeed,
    bootstrap.refreshModeration,
    bootstrap.refreshNotifications,
  ])

  const party = useParty({
    userId: appState.user?.id,
    effectiveProfile: derived.effectiveProfile,
    activitySummary: derived.activitySummary,
    workoutStats: appState.workoutStats,
    visibleLeaderboard: derived.visibleLeaderboard,
    followingIds: appState.followingIds,
    isEnglish,
    showSuccess: toast.showSuccess,
    captureError: error.captureError,
  })
  const pro = usePro({
    isPro: derived.isPro,
    isAuthenticated: appState.isAuthenticated,
    isEnglish,
    language,
    effectiveProfile: derived.effectiveProfile,
    userId: appState.user?.id,
    setProfile: appState.setProfile,
    setLeaderboard: appState.setLeaderboard,
    setFeedPosts: appState.setFeedPosts,
    setLoadingAction: loading.setLoadingAction,
    showSuccess: toast.showSuccess,
    openAuthPrompt: auth.openAuthPrompt,
    captureError: error.captureError,
  })
  const guestSync = useGuestSync({
    isAuthenticated: appState.isAuthenticated,
    loadingInit: loading.loadingInit,
    user: appState.user,
    isEnglish,
    refreshFeed: bootstrap.refreshFeed,
    refreshUserSummary: bootstrap.refreshUserSummary,
    showSuccess: toast.showSuccess,
    captureError: error.captureError,
    setErrorMessage: error.setErrorMessage,
    openAuthPrompt: auth.openAuthPrompt,
  })

  useAppSession({
    initializeApp: bootstrap.initializeApp,
    initInProgressRef,
    loadPublicData: bootstrap.loadPublicData,
    loadUserData: bootstrap.loadUserData,
    navigateToView: navigation.navigateToView,
    homeView: VIEW.HOME,
    setLoadingAuth: loading.setLoadingAuth,
    setLoadingInit: loading.setLoadingInit,
    captureError: error.captureError,
    isEnglish,
  })

  const actionTools = {
    ...loading,
    captureError: error.captureError,
    setErrorMessage: error.setErrorMessage,
    setCelebration: celebration.setCelebration,
    showSuccess: toast.showSuccess,
  }
  const actions = useAppActions({
    appState,
    auth,
    bootstrap,
    communitySelection,
    derived,
    guestSync,
    loading: actionTools,
    navigation,
    notifications,
    pro,
    report,
    workoutUi,
    isEnglish,
  })

  useCommunityViewRefresh({
    view: navigation.view,
    communityView: VIEW.COMMUNITY,
    hasCommunityNickname: derived.hasCommunityNickname,
    refreshMatePosts: bootstrap.refreshMatePosts,
    userId: appState.user?.id,
    captureError: error.captureError,
    isEnglish,
  })

  const currentLevel = appState.latestResult?.level ?? appState.testResult?.level ?? null
  const startOnboardingTest = () => {
    onboardingCoach.closeOnboardingCoach()
    navigation.navigateToView(VIEW.PROGRESS)
    workoutUi.openTestFlow()
  }
  const startOnboardingWorkout = () => {
    onboardingCoach.closeOnboardingCoach()
    workoutUi.openWorkoutComposer()
  }

  return {
    notices: {
      guestSyncNotice: guestSync.guestSyncNotice,
      guestSyncState: guestSync.guestSyncState,
      loadingAuth: loading.loadingAuth,
      onOpenGuestSyncAuth: () => auth.openAuthPrompt('guest_sync'),
      onRetryGuestSync: guestSync.handleRetryGuestSync,
      errorState: error.errorState,
      visibleErrorMessage: error.visibleErrorMessage,
      onClearError: error.clearErrorMessage,
      isEnglish,
      successState: toast.successState,
      toastToneClass: toast.toastToneClass,
      toastDotClass: toast.toastDotClass,
    },
    modals: {
      auth: {
        prompt: auth.authPrompt,
        loading: loading.loadingAuth,
        onClose: auth.closeAuthPrompt,
        onGoogleSignIn: auth.handleGoogleSignIn,
        onKakaoSignIn: auth.handleKakaoSignIn,
        onNaverSignIn: auth.handleNaverSignIn,
      },
      paywall: {
        context: pro.paywallContext,
        isPro: derived.isPro,
        loading: loading.loadingAction,
        onClose: pro.closePaywall,
        onUpgradePlan: pro.handleUpgradePlan,
      },
      report: {
        target: report.reportTarget,
        loading: loading.loadingAction,
        onClose: report.closeReportComposer,
        onSubmit: report.handleSubmitReport,
      },
      notifications: {
        open: notifications.showNotificationCenter,
        loading: notifications.loadingNotifications,
        items: notifications.notifications,
        unreadCount: notifications.unreadNotificationCount,
        onClose: notifications.closeNotificationCenter,
        onRefresh: () => bootstrap.refreshNotifications(appState.user?.id),
        onMarkAllRead: notifications.handleMarkAllNotificationsRead,
        onOpenNotification: actions.handleOpenNotification,
      },
      onboarding: {
        open: onboardingCoach.showOnboardingCoach
          && navigation.view === VIEW.HOME
          && !loading.loadingInit
          && !workoutUi.showWorkoutPanel
          && !workoutUi.showTestForm
          && !workoutUi.showTestResult,
        isEnglish,
        onClose: onboardingCoach.closeOnboardingCoach,
        onStartTest: startOnboardingTest,
        onStartWorkout: startOnboardingWorkout,
      },
    },
    shell: {
      loadingInit: loading.loadingInit,
      initStatus: loading.initStatus,
      viewHeader: buildViewHeader(navigation.view, isEnglish),
      tabs: buildTabs(isEnglish),
      navigationLabel: isEnglish ? 'Primary navigation' : '二쇱슂 ?붾㈃ ?대룞',
      topActions: {
        isEnglish,
        themeMode: theme.themeMode,
        isAuthenticated: appState.isAuthenticated,
        showNotificationCenter: notifications.showNotificationCenter,
        unreadNotificationCount: notifications.unreadNotificationCount,
        onToggleTheme: theme.handleToggleTheme,
        onOpenNotifications: notifications.openNotificationCenter,
      },
      bottomNav: {
        currentView: navigation.view,
        onChangeView: navigation.handleChangeView,
      },
    },
    routes: {
      view: navigation.view,
      isEnglish,
      home: {
        celebration: celebration.celebration,
        isEnglish,
        profile: appState.profile,
        todayDone: appState.todayDone,
        currentLevel,
        stats: appState.workoutStats,
        challenge: derived.challenge,
        activitySummary: derived.activitySummary,
        leaderboard: derived.visibleLeaderboard,
        currentUserId: appState.user?.id,
        partySnapshot: party.partySnapshot,
        partyInviteCandidates: party.partyInviteCandidates,
        homeInsight: derived.homeInsight,
        achievementBadges: appState.achievementBadges,
        reminder: reminder.reminderStatus,
        reminderPermission: reminder.reminderPermission,
        feedPreview: derived.homeFeedPreview,
        routineTemplates: appState.workoutTemplates,
        workoutHistory: appState.workoutHistory,
        workoutLoading: loading.loadingAction,
        isPro: derived.isPro,
        onOpenWorkoutComposer: () => {
          celebration.clearCelebration()
          workoutUi.openWorkoutComposer()
        },
        onCompleteRecommendedWorkout: (workoutDetails) => {
          celebration.clearCelebration()
          actions.handleWorkoutComplete(workoutDetails)
        },
        onOpenPaywall: pro.openPaywall,
        onStartRoutine: (routine) => workoutUi.openWorkoutComposer(routine),
        onOpenTest: () => {
          navigation.navigateToView(VIEW.PROGRESS)
          workoutUi.openTestFlow()
        },
        onSeeCommunity: () => navigation.handleChangeView(VIEW.COMMUNITY),
        onSelectFeedPreviewUser: (item) => {
          communitySelection.handleSelectCommunityUser(item)
          navigation.handleChangeView(VIEW.COMMUNITY)
        },
        onRequestReminderPermission: reminder.handleRequestReminderPermission,
        onCreateParty: party.handleCreateParty,
        onInvitePartyMember: party.handleInvitePartyMember,
        onSharePartyInvite: party.handleSharePartyInvite,
        showWorkoutPanel: workoutUi.showWorkoutPanel,
        workoutPreset: workoutUi.workoutPreset,
        onCompleteWorkout: actions.handleWorkoutComplete,
        onSaveRoutine: actions.handleSaveWorkoutTemplate,
        onDeleteRoutine: actions.handleDeleteWorkoutTemplate,
        onCloseWorkoutComposer: workoutUi.closeWorkoutComposer,
      },
      progress: {
        isEnglish,
        showTestForm: workoutUi.showTestForm,
        showTestResult: workoutUi.showTestResult,
        onToggleTestFlow: () => {
          if (workoutUi.showTestForm || workoutUi.showTestResult) {
            workoutUi.closeTestFlow()
            return
          }

          workoutUi.openTestFlow()
        },
        onCloseTestFlow: workoutUi.closeTestFlow,
        onGoHome: () => navigation.navigateToView(VIEW.HOME),
        onSubmitTest: actions.handleSubmitTest,
        loadingAction: loading.loadingAction,
        profile: derived.effectiveProfile,
        testResult: appState.testResult,
        latestResult: appState.latestResult,
        badges: derived.badges,
        weeklyGoal: appState.profile?.weekly_goal || 4,
        bodyMetrics: derived.bodyMetrics,
        activitySummary: derived.activitySummary,
        achievementBadges: appState.achievementBadges,
        recentActivityEvents: appState.recentActivityEvents,
        isPro: derived.isPro,
        onOpenPaywall: pro.openPaywall,
        onSaveWeight: actions.handleSaveWeight,
        workoutStats: appState.workoutStats,
        workoutHistory: appState.workoutHistory,
        onUpdateWorkout: actions.handleUpdateWorkout,
        onDeleteWorkout: actions.handleDeleteWorkout,
      },
      community: {
        isEnglish,
        canUseCommunity: derived.hasCommunityNickname,
        onGoProfile: () => navigation.navigateToView(VIEW.PROFILE),
        selectedCommunityUser: communitySelection.selectedCommunityUser,
        selectedCommunityProfile: communitySelection.selectedCommunityProfile,
        loadingSelectedCommunityProfile: communitySelection.loadingSelectedCommunityProfile,
        activeCommunityProfile: derived.activeCommunityProfile,
        followingIds: appState.followingIds,
        blockedIds: appState.blockedIds,
        currentUserId: appState.user?.id ?? null,
        loadingAction: loading.loadingAction,
        onToggleFollow: actions.handleToggleFollow,
        onOpenReportComposer: report.openReportComposer,
        onToggleBlock: actions.handleToggleBlock,
        onClearCommunityUser: communitySelection.handleClearCommunityUser,
        communitySearchQuery: communitySearch.communitySearchQuery,
        onCommunitySearchQueryChange: communitySearch.setCommunitySearchQuery,
        communitySearchResults: communitySearch.communitySearchResults,
        loadingCommunitySearch: communitySearch.loadingCommunitySearch,
        onSelectCommunityUser: communitySelection.handleSelectCommunityUser,
        suggestedUsers: derived.suggestedUsers,
        currentLevel,
        loadingFeed: loading.loadingFeed,
        loadingMatePosts: loading.loadingMatePosts,
        loadingLeaderboard: loading.loadingLeaderboard,
        visibleLeaderboard: derived.visibleLeaderboard,
        visibleFeedPosts: derived.visibleFeedPosts,
        visibleMatePosts: derived.visibleMatePosts,
        onEnsureLeaderboard: bootstrap.refreshLeaderboard,
        onToggleLike: actions.handleToggleLike,
        onSubmitComment: actions.handleSubmitComment,
        onCreateMatePost: actions.handleCreateMatePost,
        onToggleMateInterest: actions.handleToggleMateInterest,
        onUpdateMatePostStatus: actions.handleUpdateMatePostStatus,
        isAdmin: derived.isAdmin,
        isPro: derived.isPro,
        onOpenPaywall: pro.openPaywall,
        moderationReports: moderation.moderationReports,
        moderationLoading: moderation.loadingModeration,
        moderationActionLoading: moderation.moderationActionLoading,
        moderationStatus: moderation.moderationStatus,
        onModerationStatusChange: moderation.setModerationStatus,
        onRefreshModeration: moderation.refreshCurrentModeration,
        onResolveReport: moderation.handleResolveReport,
        onTogglePostVisibility: moderation.handleToggleReportedPostVisibility,
      },
      profile: {
        user: appState.user,
        profile: derived.effectiveProfile,
        latestResult: appState.latestResult,
        stats: appState.workoutStats,
        badges: derived.badges,
        activitySummary: derived.activitySummary,
        achievementBadges: appState.achievementBadges,
        challenge: derived.challenge,
        bodyMetrics: derived.bodyMetrics,
        followStats: appState.followStats,
        loading: loading.loadingAction,
        authLoading: loading.loadingAuth,
        isAuthenticated: appState.isAuthenticated,
        canUseCommunity: derived.hasCommunityNickname,
        language,
        reminderPermission: reminder.reminderPermission,
        isPro: derived.isPro,
        onOpenPaywall: pro.openPaywall,
        onSetLanguage: setLanguage,
        onRequestAuth: () => auth.openAuthPrompt('guest_profile'),
        onRequestReminderPermission: reminder.handleRequestReminderPermission,
        onSignOut: actions.handleSignOut,
        onGoProgress: () => navigation.navigateToView(VIEW.PROGRESS),
        onSaveProfile: actions.handleUpdateProfile,
        onSaveWeight: actions.handleSaveWeight,
      },
    },
  }
}
