import { useMemo } from 'react'
import { buildSuggestedUsers } from '../features/community/communityFlow'
import { buildBadges, buildChallenge, createGuestProfile, getReminderStatus } from '../features/profile/profileFlow'
import { getActivityLevelProgress } from '../utils/activityLevel'
import { buildBodyMetrics } from '../utils/bodyMetrics'
import { isProMember } from '../utils/premium'

export function useAppDerivedState({
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
}) {
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
  const visibleMatePosts = useMemo(
    () => matePosts.filter((item) => !blockedIds.includes(item.user_id)),
    [blockedIds, matePosts],
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

  return {
    badges,
    challenge,
    suggestedUsers,
    effectiveProfile,
    bodyMetrics,
    activityProgress,
    activitySummary,
    hasCommunityNickname,
    reminderStatus,
    visibleLeaderboard,
    visibleFeedPosts,
    visibleMatePosts,
    homeFeedPreview,
    activeCommunityProfile: selectedCommunityProfile ?? selectedCommunityUser,
    isAdmin: effectiveProfile?.is_admin === true,
    isPro: isProMember(effectiveProfile),
  }
}
