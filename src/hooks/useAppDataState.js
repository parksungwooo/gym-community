import { useState } from 'react'
import { INITIAL_STATS } from '../features/profile/profileFlow'

export function useAppDataState() {
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
  const [todayDone, setTodayDone] = useState(false)

  return {
    user,
    setUser,
    testResult,
    setTestResult,
    latestResult,
    setLatestResult,
    feedPosts,
    setFeedPosts,
    matePosts,
    setMatePosts,
    leaderboard,
    setLeaderboard,
    workoutHistory,
    setWorkoutHistory,
    workoutTemplates,
    setWorkoutTemplates,
    workoutStats,
    setWorkoutStats,
    profile,
    setProfile,
    weightLogs,
    setWeightLogs,
    recentActivityEvents,
    setRecentActivityEvents,
    achievementBadges,
    setAchievementBadges,
    followingIds,
    setFollowingIds,
    blockedIds,
    setBlockedIds,
    followStats,
    setFollowStats,
    todayDone,
    setTodayDone,
    isAuthenticated: Boolean(user?.id),
  }
}
