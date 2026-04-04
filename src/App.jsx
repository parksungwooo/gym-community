import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FeedList from './components/FeedList'
import HomeDashboard from './components/HomeDashboard'
import MonthlyCalendar from './components/MonthlyCalendar'
import ProfilePanel from './components/ProfilePanel'
import ProgressPanel from './components/ProgressPanel'
import RankingBoard from './components/RankingBoard'
import ResultView from './components/ResultView'
import SuggestedUsers from './components/SuggestedUsers'
import TestForm from './components/TestForm'
import WorkoutHistory from './components/WorkoutHistory'
import WorkoutPanel from './components/WorkoutPanel'
import { useI18n } from './i18n.js'
import { supabase } from './lib/supabaseClient'
import { ensureGuestUser, signInWithOAuth, signOutUser } from './services/auth'
import {
  addComment,
  completeWorkout,
  createFeedPost,
  deleteWorkoutTemplate,
  deleteWorkoutLog,
  fetchLeaderboard,
  fetchFeedWithRelations,
  fetchWorkoutHistory,
  fetchWorkoutTemplates,
  getLatestTestResult,
  getUserProfile,
  getWorkoutStats,
  hasWorkoutCompleted,
  saveWorkoutTemplate,
  saveTestResult,
  toggleLike,
  updateUserProfile,
  updateWorkoutLog,
  upsertUser,
} from './services/communityService'
import { getLevelByScore, getLevelValue } from './utils/level'

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

const INITIAL_STATS = {
  streak: 0,
  todayCount: 0,
  weeklyCount: 0,
  lastWorkoutDate: null,
  lastWorkoutType: null,
  lastWorkoutDuration: null,
  lastWorkoutNote: null,
  typeCounts: [],
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

function buildBadges(stats, latestResult) {
  const badges = ['starter']

  if (stats.weeklyCount >= 3) badges.push('weekly3')
  if (stats.streak >= 3) badges.push('streak3')
  if (stats.streak >= 7) badges.push('streak7')
  if (latestResult && getLevelValue(latestResult.level) >= 4) badges.push('highFitness')

  return badges
}

function buildChallenge(stats, profile, isEnglish) {
  const goal = profile?.weekly_goal || 4
  const current = Math.min(stats.weeklyCount, goal)

  return {
    title: isEnglish ? `${goal} Workouts This Week` : `주간 ${goal}회 운동 챌린지`,
    goal,
    current,
    progress: Math.min(Math.round((current / goal) * 100), 100),
  }
}

function buildTodayFocus({ todayDone, latestResult, stats, isEnglish }) {
  if (!latestResult) {
    return {
      label: isEnglish ? 'Suggested Next Step' : '오늘의 추천 액션',
      title: isEnglish ? 'Start with the fitness level test' : '체력 테스트부터 시작해보세요',
      detail: isEnglish ? 'Once you know your level, your goal and record feel more focused.' : '레벨을 먼저 측정하면 목표와 기록이 더 선명해져요.',
    }
  }

  if (!todayDone) {
    return {
      label: isEnglish ? 'Today\'s Focus' : '오늘의 핵심 미션',
      title: isEnglish ? 'Log a 20-minute workout today' : '운동 20분 기록 남기기',
      detail: isEnglish ? `${stats.weeklyCount} workouts done this week. One more log gets you closer to your challenge.` : `이번 주 ${stats.weeklyCount}회 완료 중이에요. 오늘 체크하면 챌린지에 더 가까워져요.`,
    }
  }

  return {
    label: isEnglish ? 'Today\'s Status' : '오늘의 상태',
    title: isEnglish ? 'You already completed today\'s workout' : '오늘 운동을 이미 완료했어요',
    detail: isEnglish ? 'Check the community and leave a quick supportive comment.' : '커뮤니티에서 다른 사람 기록도 둘러보고 응원 댓글을 남겨보세요.',
  }
}

function validateDisplayName(name, isEnglish) {
  const trimmed = name.trim()

  if (!trimmed) return isEnglish ? 'Please enter a nickname.' : '닉네임을 입력해주세요.'
  if (trimmed.length < 2 || trimmed.length > 12) return isEnglish ? 'Nickname must be 2 to 12 characters.' : '닉네임은 2자 이상 12자 이하로 입력해주세요.'
  if (!/^[0-9A-Za-z가-힣]+$/.test(trimmed)) return isEnglish ? 'Nickname can use Korean, English letters, and numbers only.' : '닉네임은 한글, 영문, 숫자만 사용할 수 있어요.'

  return ''
}

export default function App() {
  const { language, setLanguage, isEnglish } = useI18n()
  const initInProgressRef = useRef(false)
  const [user, setUser] = useState(null)
  const [view, setView] = useState(VIEW.HOME)
  const [testResult, setTestResult] = useState(null)
  const [latestResult, setLatestResult] = useState(null)
  const [feedPosts, setFeedPosts] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [workoutTemplates, setWorkoutTemplates] = useState([])
  const [workoutStats, setWorkoutStats] = useState(INITIAL_STATS)
  const [profile, setProfile] = useState(null)
  const [selectedCommunityUser, setSelectedCommunityUser] = useState(null)
  const [showTestForm, setShowTestForm] = useState(false)
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [todayDone, setTodayDone] = useState(false)
  const [successState, setSuccessState] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [initStatus, setInitStatus] = useState(isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...')

  const badges = useMemo(() => buildBadges(workoutStats, latestResult), [latestResult, workoutStats])
  const challenge = useMemo(() => buildChallenge(workoutStats, profile, isEnglish), [isEnglish, profile, workoutStats])
  const suggestedUsers = useMemo(() => {
    const currentLevel = latestResult?.level ?? testResult?.level ?? null
    const sameLevelRows = leaderboard.filter((item) => item.user_id !== user?.id && currentLevel && item.latest_level === currentLevel)
    if (sameLevelRows.length) return sameLevelRows.slice(0, 2)
    return leaderboard.filter((item) => item.user_id !== user?.id).slice(0, 2)
  }, [leaderboard, latestResult?.level, testResult?.level, user?.id])
  const todayFocus = useMemo(() => buildTodayFocus({ todayDone, latestResult, stats: workoutStats, isEnglish }), [isEnglish, latestResult, todayDone, workoutStats])

  const refreshFeed = useCallback(async (userId) => {
    setLoadingFeed(true)
    try {
      const posts = await withTimeout(fetchFeedWithRelations(userId), 12000, isEnglish ? 'Feed is taking longer to load. Please try again soon.' : '피드를 불러오는 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.')
      setFeedPosts(posts)
    } finally {
      setLoadingFeed(false)
    }
  }, [isEnglish])

  const refreshLeaderboard = useCallback(async () => {
    const rows = await withTimeout(fetchLeaderboard(10), 12000, isEnglish ? 'Ranking is taking longer to load. Please try again soon.' : '랭킹을 불러오는 시간이 길어지고 있어요. 잠시 후 다시 시도해주세요.')
    setLeaderboard(rows)
  }, [isEnglish])

  const refreshUserSummary = useCallback(async (userId) => {
    const [result, stats, history, templates, nextProfile] = await Promise.all([
      withTimeout(getLatestTestResult(userId), 10000, isEnglish ? 'Could not load your latest test.' : '최근 테스트를 불러오지 못했어요.'),
      withTimeout(getWorkoutStats(userId), 10000, isEnglish ? 'Could not load workout stats.' : '운동 통계를 불러오지 못했어요.'),
      withTimeout(fetchWorkoutHistory(userId), 10000, isEnglish ? 'Could not load workout history.' : '운동 기록 리스트를 불러오지 못했어요.'),
      withTimeout(fetchWorkoutTemplates(userId), 10000, isEnglish ? 'Could not load saved routines.' : '저장된 루틴을 불러오지 못했어요.'),
      withTimeout(getUserProfile(userId), 10000, isEnglish ? 'Could not load profile.' : '프로필 정보를 불러오지 못했어요.'),
    ])

    setLatestResult(result)
    setWorkoutStats(stats)
    setWorkoutHistory(history)
    setWorkoutTemplates(templates)
    setProfile(nextProfile)

    return { result, stats, history, templates, profile: nextProfile }
  }, [isEnglish])

  const loadUserData = useCallback(async (nextUser) => {
    if (!nextUser?.id) return

    setInitStatus(isEnglish ? 'Loading user...' : '사용자 정보를 불러오는 중입니다...')
    await withTimeout(upsertUser(nextUser.id), 10000, isEnglish ? 'User setup is taking too long.' : '유저 초기화가 지연되고 있어요.')
    setUser(nextUser)

    setInitStatus(isEnglish ? 'Checking today\'s log...' : '오늘 운동 기록을 확인하는 중입니다...')
    const doneToday = await withTimeout(hasWorkoutCompleted(nextUser.id, getTodayDateString()), 10000, isEnglish ? 'Workout lookup is taking too long.' : '운동 기록 조회가 지연되고 있어요.')
    setTodayDone(doneToday)

    setInitStatus(isEnglish ? 'Loading dashboard...' : '홈 데이터를 불러오는 중입니다...')
    await Promise.all([refreshFeed(nextUser.id), refreshUserSummary(nextUser.id), refreshLeaderboard()])
  }, [isEnglish, refreshFeed, refreshLeaderboard, refreshUserSummary])

  const initializeApp = useCallback(async () => {
    initInProgressRef.current = true
    setLoadingInit(true)
    setInitStatus(isEnglish ? 'Checking session...' : '세션을 확인하는 중입니다...')
    setErrorMessage('')

    try {
      const guestUser = await withTimeout(ensureGuestUser(), 10000, isEnglish ? 'Login initialization is taking too long. Please check your network.' : '로그인 초기화가 지연되고 있어요. 네트워크를 확인해주세요.')
      await loadUserData(guestUser)
      setView(VIEW.HOME)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Something went wrong during initialization.' : '초기화 중 문제가 발생했습니다.', isEnglish))
    } finally {
      initInProgressRef.current = false
      setLoadingInit(false)
    }
  }, [isEnglish, loadUserData])

  useEffect(() => {
    initializeApp()

    const failSafe = setTimeout(() => {
      setLoadingInit(false)
    }, 12000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || initInProgressRef.current) return
      if (!session?.user) return

      setLoadingAuth(true)
      try {
        await loadUserData(session.user)
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
  }, [initializeApp, isEnglish, loadUserData])

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

  const showSuccess = useCallback((message, accent = 'default') => {
    setSuccessState({ message, accent })
  }, [])

  const handleGoogleSignIn = async () => {
    setLoadingAuth(true)
    setErrorMessage('')
    try {
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
      const guestUser = await ensureGuestUser()
      await loadUserData(guestUser)
      setView(VIEW.HOME)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Sign-out failed.' : '로그아웃에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAuth(false)
    }
  }

  const handleSubmitTest = async (score) => {
    if (!user?.id) return

    const levelInfo = getLevelByScore(score)
    const localResult = { score, level: levelInfo.label, created_at: new Date().toISOString() }

    setTestResult({ score, level: levelInfo.label })
    setLatestResult(localResult)
    setView(VIEW.PROGRESS)
    setShowTestForm(false)
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await saveTestResult(user.id, score, levelInfo.label)
      await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])
    } catch (error) {
      console.error(error)
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'The result is shown, but saving to the database failed. Please check SQL/RLS settings.' : '결과는 표시됐지만 DB 저장에 실패했어요. SQL/RLS 설정을 확인해주세요.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleWorkoutComplete = async (details = {}) => {
    if (!user?.id) return

    const previousWeeklyCount = workoutStats.weeklyCount
    setLoadingAction(true)
    setErrorMessage('')

    try {
      await completeWorkout(user.id, getTodayDateString(), details)
      setTodayDone(true)
      const [, summary] = await Promise.all([refreshFeed(user.id), refreshUserSummary(user.id), refreshLeaderboard()])

      if (previousWeeklyCount < challenge.goal && summary.stats.weeklyCount >= challenge.goal) {
        await createFeedPost(user.id, `challenge ${challenge.goal}`, 'challenge_complete', { week_key: getCurrentWeekKey(), goal: challenge.goal })
        await refreshFeed(user.id)
      }

      showSuccess(isEnglish ? `${details.workoutType || 'Workout'} saved.` : `${details.workoutType || '운동'} 기록이 저장됐어요.`, 'success')
      setCelebration({ workoutType: details.workoutType || '운동', durationMinutes: Number(details.durationMinutes) || 0, nextWeeklyCount: summary.stats.weeklyCount })
      setView(VIEW.HOME)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to save workout.' : '운동 기록 저장에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const handleSaveWorkoutTemplate = async (template) => {
    if (!user?.id) return

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
      await updateWorkoutLog(user.id, workoutLogId, details)
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
    if (!user?.id) return
    try {
      await toggleLike(user.id, postId, isLiked)
      await refreshFeed(user.id)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to update like.' : '좋아요 처리에 실패했습니다.', isEnglish))
    }
  }

  const handleSubmitComment = async (postId, content) => {
    if (!user?.id) return
    try {
      await addComment(user.id, postId, content)
      await refreshFeed(user.id)
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to add comment.' : '댓글 등록에 실패했습니다.', isEnglish))
    }
  }

  const handleSelectCommunityUser = (item) => setSelectedCommunityUser(item)
  const handleClearCommunityUser = () => setSelectedCommunityUser(null)

  const handleUpdateProfile = async (nextProfile) => {
    if (!user?.id) return

    const validationError = validateDisplayName(nextProfile.displayName ?? '', isEnglish)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setLoadingAction(true)
    setErrorMessage('')

    try {
      const previousName = profile?.display_name ?? ''
      const previousAvatar = profile?.avatar_emoji ?? ''
      const previousGoal = profile?.weekly_goal ?? 4
      const savedProfile = await updateUserProfile(user.id, nextProfile)
      setProfile(savedProfile)

      const changedName = (savedProfile.display_name ?? '') !== previousName
      const changedAvatar = (savedProfile.avatar_emoji ?? '') !== previousAvatar
      const changedGoal = (savedProfile.weekly_goal ?? 4) !== previousGoal

      if (changedName || changedAvatar || changedGoal) {
        const profileLabel = savedProfile.display_name || 'profile'
        await createFeedPost(user.id, `${profileLabel} updated`, 'profile_update', {
          display_name: savedProfile.display_name,
          avatar_emoji: savedProfile.avatar_emoji,
          weekly_goal: savedProfile.weekly_goal,
        })
        await Promise.all([refreshFeed(user.id), refreshLeaderboard()])
      }
      showSuccess(isEnglish ? 'Settings saved.' : '설정을 저장했어요.', 'info')
    } catch (error) {
      setErrorMessage(getActionableErrorMessage(error, isEnglish ? 'Failed to save profile.' : '프로필 저장에 실패했습니다.', isEnglish))
    } finally {
      setLoadingAction(false)
    }
  }

  const tabs = [
    { key: VIEW.HOME, label: isEnglish ? 'Home' : '홈' },
    { key: VIEW.COMMUNITY, label: isEnglish ? 'Community' : '커뮤니티' },
    { key: VIEW.PROGRESS, label: isEnglish ? 'Records' : '기록' },
    { key: VIEW.PROFILE, label: isEnglish ? 'Profile' : '프로필' },
  ]

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Daily Fitness Loop</p>
        <h1>{isEnglish ? 'A community that keeps today\'s workout moving' : '오늘 운동을 이어가는 커뮤니티'}</h1>
      </header>

      {errorMessage && <div className="error-box">{errorMessage}</div>}
      {successState && (
        <div className={`app-toast ${successState.accent ?? 'default'}`}>
          <span className="app-toast-dot" />
          <span className="app-toast-text">{successState.message}</span>
        </div>
      )}

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
          {!user?.id && (
            <section className="card">
              <p className="subtext">{isEnglish ? 'Initialization failed.' : '초기화에 실패했어요.'}</p>
              <button type="button" className="primary-btn" onClick={initializeApp}>{isEnglish ? 'Try Again' : '다시 시도'}</button>
            </section>
          )}
          <nav className="tab-nav">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" className={`tab-btn ${view === tab.key ? 'active' : ''}`} onClick={() => setView(tab.key)}>
                <span className="tab-icon"><TabIcon type={tab.key} /></span>
                <span className="tab-text">{tab.label}</span>
              </button>
            ))}
          </nav>

          {view === VIEW.HOME && (
            <div key={VIEW.HOME} className="view-stage">
              {celebration && (
                <section className="card celebration-card">
                  <span className="celebration-eyebrow">Nice Work</span>
                  <h2>{isEnglish ? `${celebration.workoutType} saved` : `${celebration.workoutType} 기록 완료`}</h2>
                  <p className="subtext">
                    {celebration.durationMinutes
                      ? isEnglish ? `${celebration.durationMinutes} minutes were saved.` : `${celebration.durationMinutes}분 운동이 저장됐어요.`
                      : isEnglish ? 'Today\'s workout was saved.' : '오늘 운동 기록이 저장됐어요.'}{' '}
                    {isEnglish ? `You are now at ${celebration.nextWeeklyCount} this week.` : `이번 주 누적 ${celebration.nextWeeklyCount}회입니다.`}
                  </p>
                  <div className="celebration-actions">
                    <button type="button" className="secondary-btn" onClick={() => setView(VIEW.COMMUNITY)}>{isEnglish ? 'See Community' : '커뮤니티 반응 보기'}</button>
                    <button type="button" className="ghost-btn" onClick={() => setView(VIEW.PROGRESS)}>{isEnglish ? 'View Records' : '기록 흐름 보기'}</button>
                  </div>
                </section>
              )}
              <HomeDashboard
                user={user}
                profile={profile}
                todayDone={todayDone}
                currentLevel={latestResult?.level ?? testResult?.level ?? null}
                currentScore={latestResult?.score ?? testResult?.score ?? null}
                stats={workoutStats}
                challenge={challenge}
                badges={badges}
                todayFocus={todayFocus}
                onCompleteWorkout={handleWorkoutComplete}
                workoutLoading={loadingAction}
                onOpenCommunity={() => setView(VIEW.COMMUNITY)}
                onOpenProgress={() => setView(VIEW.PROGRESS)}
                onOpenTest={() => {
                  setView(VIEW.PROGRESS)
                  setShowTestForm(true)
                }}
              />
              <WorkoutPanel
                onComplete={handleWorkoutComplete}
                onSaveRoutine={handleSaveWorkoutTemplate}
                onDeleteRoutine={handleDeleteWorkoutTemplate}
                loading={loadingAction}
                todayDone={todayDone}
                todayCount={workoutStats.todayCount}
                recentWorkout={{ workoutType: workoutStats.lastWorkoutType, durationMinutes: workoutStats.lastWorkoutDuration, note: workoutStats.lastWorkoutNote }}
                routineTemplates={workoutTemplates}
              />
            </div>
          )}

          {view === VIEW.PROGRESS && (
            <div key={VIEW.PROGRESS} className="view-stage">
              <section className="card record-hub-card">
                <h2>{isEnglish ? 'Record Center' : '기록 센터'}</h2>
                <p className="subtext">{isEnglish ? 'See records and tests in one place.' : '기록과 테스트를 한 곳에서 봅니다.'}</p>
                <div className="record-hub-actions">
                  <button type="button" className="ghost-btn" onClick={() => setShowTestForm((prev) => !prev)}>
                    {showTestForm ? (isEnglish ? 'Close Test' : '테스트 입력 닫기') : isEnglish ? 'Retake Level Test' : '체력 테스트 다시하기'}
                  </button>
                  <button type="button" className="secondary-btn" onClick={() => setView(VIEW.HOME)}>{isEnglish ? 'Log Today\'s Workout' : '오늘 운동 기록하러 가기'}</button>
                </div>
              </section>

              {showTestForm && <TestForm onSubmit={handleSubmitTest} loading={loadingAction} />}
              {testResult && <ResultView score={testResult.score} level={testResult.level} onStartWorkout={() => setView(VIEW.HOME)} />}
              <ProgressPanel stats={workoutStats} latestResult={latestResult} badges={badges} weeklyGoal={profile?.weekly_goal || 4} />
              <MonthlyCalendar history={workoutHistory} />
              <WorkoutHistory history={workoutHistory} onUpdate={handleUpdateWorkout} onDelete={handleDeleteWorkout} loading={loadingAction} />
            </div>
          )}

          {view === VIEW.COMMUNITY && (
            <div key={VIEW.COMMUNITY} className="view-stage">
              <section className="card community-overview-card">
                <h2>{isEnglish ? 'Community' : '커뮤니티'}</h2>
                <p className="subtext">{isEnglish ? 'Start with people who feel close to your level.' : '비슷한 사람부터 가볍게 둘러보세요.'}</p>
              </section>
              <SuggestedUsers rows={suggestedUsers} currentLevel={latestResult?.level ?? testResult?.level ?? null} loading={loadingFeed} selectedUserId={selectedCommunityUser?.user_id ?? null} onSelectUser={handleSelectCommunityUser} />
              <RankingBoard rows={leaderboard} loading={loadingFeed} selectedUserId={selectedCommunityUser?.user_id ?? null} onSelectUser={handleSelectCommunityUser} />
              <FeedList posts={feedPosts} onToggleLike={handleToggleLike} onSubmitComment={handleSubmitComment} loading={loadingFeed} currentLevel={latestResult?.level ?? testResult?.level ?? null} selectedUser={selectedCommunityUser} onClearSelectedUser={handleClearCommunityUser} />
            </div>
          )}

          {view === VIEW.PROFILE && (
            <div key={VIEW.PROFILE} className="view-stage">
              <ProfilePanel
                key={`${profile?.display_name ?? ''}-${profile?.avatar_emoji ?? ''}-${profile?.weekly_goal ?? 4}-${user?.id ?? 'guest'}-${language}`}
                user={user}
                profile={profile}
                latestResult={latestResult}
                stats={workoutStats}
                badges={badges}
                challenge={challenge}
                loading={loadingAction}
                authLoading={loadingAuth}
                language={language}
                onSetLanguage={setLanguage}
                onGoogleSignIn={handleGoogleSignIn}
                onKakaoSignIn={handleKakaoSignIn}
                onSignOut={handleSignOut}
                onSaveProfile={handleUpdateProfile}
              />
            </div>
          )}
        </>
      )}
    </main>
  )
}

