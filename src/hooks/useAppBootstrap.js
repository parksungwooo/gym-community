import { useCallback, useEffect, useRef } from 'react'
import { getCurrentUser } from '../services/auth'
import {
  buildWorkoutStatsFromHistory,
  fetchAchievementBadges,
  fetchBlockedIds,
  fetchFeedWithRelations,
  fetchFollowStats,
  fetchFollowingIds,
  fetchLeaderboard,
  fetchMatePosts,
  fetchModerationReports,
  fetchNotifications,
  fetchRecentActivityEvents,
  fetchWeightLogs,
  fetchWorkoutHistory,
  fetchWorkoutTemplates,
  getLatestTestResult,
  getUserProfile,
  hasWorkoutCompleted,
  upsertUser,
} from '../services/communityService'
import { getE2EAppSnapshot } from '../features/app/e2eFixtures'
import { delay, getActionableErrorMessage, getTodayDateString, isTransientInitDelayMessage, withTimeout } from '../features/app/appFlowUtils'
import { INITIAL_STATS } from '../features/profile/profileFlow'

export function useAppBootstrap({
  isEnglish,
  initInProgressRef,
  blockedIds,
  moderationStatus,
  isAdmin,
  currentUserId,
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
  setErrorMessage,
}) {
  const blockedIdsRef = useRef(blockedIds ?? [])

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
      return posts
    } finally {
      setLoadingFeed(false)
    }
  }, [isEnglish, setFeedPosts, setLoadingFeed])

  const refreshMatePosts = useCallback(async (userId) => {
    setLoadingMatePosts(true)
    try {
      const rows = await withTimeout(
        fetchMatePosts(userId, 24),
        10000,
        isEnglish ? 'Mate board is taking longer to load. Please try again soon.' : '메이트 게시판을 불러오는 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.',
      )
      setMatePosts(rows)
      return rows
    } finally {
      setLoadingMatePosts(false)
    }
  }, [isEnglish, setLoadingMatePosts, setMatePosts])

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
  }, [isEnglish, setLoadingNotifications, setNotifications, setUnreadNotificationCount])

  const refreshLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true)
    try {
      const rows = await withTimeout(
        fetchLeaderboard(10),
        12000,
        isEnglish ? 'Ranking is taking longer to load. Please try again soon.' : '랭킹을 불러오는 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.',
      )
      setLeaderboard(rows)
      return rows
    } finally {
      setLoadingLeaderboard(false)
    }
  }, [isEnglish, setLeaderboard, setLoadingLeaderboard])

  const refreshModeration = useCallback(async (status = moderationStatus) => {
    if (!currentUserId || !isAdmin) {
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
  }, [currentUserId, isAdmin, isEnglish, moderationStatus, setLoadingModeration, setModerationReports])

  const resetPrivateState = useCallback(() => {
    setLatestResult(null)
    setMatePosts([])
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
  }, [
    setAchievementBadges,
    setBlockedIds,
    setCommunitySearchQuery,
    setCommunitySearchResults,
    setFollowStats,
    setFollowingIds,
    setLatestResult,
    setMatePosts,
    setModerationReports,
    setModerationStatus,
    setNotifications,
    setProfile,
    setRecentActivityEvents,
    setShowNotificationCenter,
    setTodayDone,
    setUnreadNotificationCount,
    setWeightLogs,
    setWorkoutHistory,
    setWorkoutStats,
    setWorkoutTemplates,
  ])

  const refreshUserSummary = useCallback(async (userId) => {
    const [
      result,
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
      withTimeout(fetchWorkoutHistory(userId), 10000, isEnglish ? 'Could not load workout history.' : '운동 기록 리스트를 불러오지 못했어요.'),
      withTimeout(fetchWorkoutTemplates(userId), 10000, isEnglish ? 'Could not load saved routines.' : '저장된 루틴을 불러오지 못했어요.'),
      withTimeout(getUserProfile(userId), 10000, isEnglish ? 'Could not load profile.' : '프로필 정보를 불러오지 못했어요.'),
      withTimeout(fetchWeightLogs(userId), 10000, isEnglish ? 'Could not load weight logs.' : '몸무게 기록을 불러오지 못했어요.'),
      withTimeout(fetchRecentActivityEvents(userId, 16), 10000, isEnglish ? 'Could not load activity events.' : '최근 활동 기록을 불러오지 못했어요.'),
      withTimeout(fetchAchievementBadges(userId), 10000, isEnglish ? 'Could not load badges.' : '배지 목록을 불러오지 못했어요.'),
      withTimeout(fetchFollowingIds(userId), 10000, isEnglish ? 'Could not load follows.' : '팔로잉 목록을 불러오지 못했어요.'),
      withTimeout(fetchBlockedIds(userId), 10000, isEnglish ? 'Could not load blocked users.' : '차단 목록을 불러오지 못했어요.'),
      withTimeout(fetchFollowStats(userId), 10000, isEnglish ? 'Could not load follow stats.' : '팔로우 통계를 불러오지 못했어요.'),
    ])
    const stats = buildWorkoutStatsFromHistory(history)

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
  }, [
    isEnglish,
    setAchievementBadges,
    setBlockedIds,
    setFollowStats,
    setFollowingIds,
    setLatestResult,
    setProfile,
    setRecentActivityEvents,
    setWeightLogs,
    setWorkoutHistory,
    setWorkoutStats,
    setWorkoutTemplates,
  ])

  const ensureUserProfileReady = useCallback(async (userId) => {
    try {
      await withTimeout(upsertUser(userId), 10000, '__user_setup_delay__')
    } catch (error) {
      if (!isTransientInitDelayMessage(error?.message)) {
        throw error
      }
    }

    for (const waitMs of [0, 250, 600]) {
      try {
        const nextProfile = await withTimeout(
          getUserProfile(userId),
          4000,
          '__user_setup_delay__',
        )

        if (nextProfile?.id) {
          return nextProfile
        }
      } catch (error) {
        if (!isTransientInitDelayMessage(error?.message)) {
          throw error
        }
      }

      if (waitMs > 0) {
        await delay(waitMs)
      }
    }

    return null
  }, [])

  const prefetchCommunityData = useCallback((userId = null) => {
    const tasks = [
      refreshLeaderboard(),
      refreshMatePosts(userId),
    ]

    if (userId && isAdmin) {
      tasks.push(refreshModeration(moderationStatus))
    }

    void Promise.allSettled(tasks)
  }, [
    isAdmin,
    moderationStatus,
    refreshLeaderboard,
    refreshMatePosts,
    refreshModeration,
  ])

  const loadPublicData = useCallback(async () => {
    setUser(null)
    resetPrivateState()
    setInitStatus(isEnglish ? 'Loading public dashboard...' : '공개 대시보드를 불러오는 중입니다...')
    await refreshFeed(null, [])
    prefetchCommunityData(null)
  }, [isEnglish, prefetchCommunityData, refreshFeed, resetPrivateState, setInitStatus, setUser])

  const loadUserData = useCallback(async (nextUser) => {
    if (!nextUser?.id) return

    setInitStatus(isEnglish ? 'Loading user...' : '사용자 정보를 불러오는 중입니다...')
    setUser(nextUser)
    await ensureUserProfileReady(nextUser.id)

    setInitStatus(isEnglish ? 'Checking today\'s log...' : '오늘 운동 기록을 확인하는 중입니다...')
    const doneToday = await withTimeout(
      hasWorkoutCompleted(nextUser.id, getTodayDateString()),
      10000,
      isEnglish ? 'Workout lookup is taking too long.' : '운동 기록 조회가 지연되고 있어요.',
    )
    setTodayDone(doneToday)

    setInitStatus(isEnglish ? 'Loading dashboard...' : '홈 데이터를 불러오는 중입니다...')
    await Promise.all([
      refreshFeed(nextUser.id),
      refreshUserSummary(nextUser.id),
      refreshNotifications(nextUser.id),
    ])
    prefetchCommunityData(nextUser.id)
  }, [
    ensureUserProfileReady,
    isEnglish,
    prefetchCommunityData,
    refreshFeed,
    refreshNotifications,
    refreshUserSummary,
    setInitStatus,
    setTodayDone,
    setUser,
  ])

  const initializeApp = useCallback(async () => {
    initInProgressRef.current = true
    setLoadingInit(true)
    setInitStatus(isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...')
    setErrorMessage('')

    try {
      const e2eSnapshot = getE2EAppSnapshot()

      if (e2eSnapshot) {
        setUser(e2eSnapshot.user)
        setLatestResult(e2eSnapshot.latestResult)
        setFeedPosts(e2eSnapshot.feedPosts)
        setMatePosts(e2eSnapshot.matePosts)
        setLeaderboard(e2eSnapshot.leaderboard)
        setWorkoutHistory(e2eSnapshot.workoutHistory)
        setWorkoutTemplates(e2eSnapshot.workoutTemplates)
        setWorkoutStats(buildWorkoutStatsFromHistory(e2eSnapshot.workoutHistory))
        setProfile(e2eSnapshot.profile)
        setWeightLogs(e2eSnapshot.weightLogs)
        setRecentActivityEvents(e2eSnapshot.recentActivityEvents)
        setAchievementBadges(e2eSnapshot.achievementBadges)
        setFollowingIds(e2eSnapshot.followingIds)
        setBlockedIds(e2eSnapshot.blockedIds)
        setFollowStats(e2eSnapshot.followStats)
        setNotifications(e2eSnapshot.notifications)
        setUnreadNotificationCount(e2eSnapshot.unreadNotificationCount)
        setTodayDone(e2eSnapshot.todayDone)
        setShowNotificationCenter(false)
        return
      }

      const sessionUser = await withTimeout(
        getCurrentUser(),
        10000,
        isEnglish ? 'Login initialization is taking too long. Please check your network.' : '로그인 초기화가 지연되고 있어요. 네트워크를 확인해주세요.',
      )
      if (sessionUser?.id) {
        await loadUserData(sessionUser)
      } else {
        await loadPublicData()
      }
    } catch (error) {
      setErrorMessage(
        getActionableErrorMessage(
          error,
          isEnglish ? 'Something went wrong during initialization.' : '초기화 중 문제가 발생했습니다.',
          isEnglish,
        ),
      )
    } finally {
      initInProgressRef.current = false
      setLoadingInit(false)
    }
  }, [
    initInProgressRef,
    isEnglish,
    loadPublicData,
    loadUserData,
    setAchievementBadges,
    setBlockedIds,
    setErrorMessage,
    setFeedPosts,
    setFollowStats,
    setFollowingIds,
    setInitStatus,
    setLatestResult,
    setLeaderboard,
    setLoadingInit,
    setMatePosts,
    setNotifications,
    setProfile,
    setRecentActivityEvents,
    setShowNotificationCenter,
    setTodayDone,
    setUnreadNotificationCount,
    setUser,
    setWeightLogs,
    setWorkoutHistory,
    setWorkoutStats,
    setWorkoutTemplates,
  ])

  return {
    refreshFeed,
    refreshMatePosts,
    refreshNotifications,
    refreshLeaderboard,
    refreshModeration,
    resetPrivateState,
    refreshUserSummary,
    ensureUserProfileReady,
    loadPublicData,
    loadUserData,
    initializeApp,
  }
}
