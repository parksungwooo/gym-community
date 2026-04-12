import { useCallback, useEffect, useRef } from 'react'
import { persistPendingAction } from '../features/auth/authFlow'
import {
  getCurrentWeekKey,
  getTodayDateString,
} from '../features/app/appFlowUtils'
import { validateDisplayName } from '../features/profile/profileFlow'
import { saveGuestWorkout } from '../lib/guestStorage'
import { signOutUser } from '../services/auth'
import {
  addComment,
  blockUser,
  completeWorkout,
  createFeedPost,
  createMatePost,
  deleteWorkoutLog,
  deleteWorkoutTemplate,
  fetchBlockedIds,
  fetchFollowStats,
  fetchFollowingIds,
  fetchWorkoutTemplates,
  followUser,
  hasWorkoutCompleted,
  saveTestResult,
  saveWeightLog,
  saveWorkoutTemplate,
  toggleLike,
  toggleMatePostInterest,
  unblockUser,
  unfollowUser,
  updateMatePostStatus,
  updateUserProfile,
  updateWorkoutLog,
} from '../services/communityService'
import { getActivityLevelProgress } from '../utils/activityLevel'
import { getLevelByScore } from '../utils/level'
import { FREE_WORKOUT_LOG_LIMIT, PREMIUM_CONTEXT } from '../utils/premium'
import { usePendingActionReplay } from './usePendingActionReplay'
import { VIEW } from './useAppNavigation'

export function useAppActions({
  appState,
  auth,
  bootstrap,
  communitySelection,
  derived,
  guestSync,
  loading,
  navigation,
  notifications,
  pro,
  report,
  workoutUi,
  isEnglish,
}) {
  const pendingReplayHandlersRef = useRef({})
  const {
    user,
    setTestResult,
    setLatestResult,
    workoutHistory,
    setWorkoutTemplates,
    workoutStats,
    profile,
    setProfile,
    setTodayDone,
    setBlockedIds,
    setFollowingIds,
    setFollowStats,
  } = appState
  const {
    guardAuthAction,
    closeAuthPrompt,
  } = auth
  const {
    loadPublicData,
    refreshFeed,
    refreshLeaderboard,
    refreshMatePosts,
    refreshUserSummary,
  } = bootstrap
  const {
    handleClearCommunityUser,
    handleSelectCommunityUser,
    refreshSelectedCommunityProfile,
    selectedCommunityUser,
  } = communitySelection
  const {
    activitySummary,
    bodyMetrics,
    challenge,
    isPro,
  } = derived
  const {
    refreshGuestSyncState,
  } = guestSync
  const {
    captureError,
    setErrorMessage,
    setLoadingAction,
    setLoadingAuth,
    runActionTask,
    showSuccess,
  } = loading
  const {
    handleChangeView,
    navigateToView,
  } = navigation
  const {
    handleOpenNotification: openNotificationFromHook,
  } = notifications
  const {
    openPaywall,
  } = pro
  const {
    handleSubmitReport,
    setReportTarget,
  } = report
  const {
    dismissWorkoutComposer,
    openWorkoutComposer,
    showTestResultOnly,
  } = workoutUi
  const isAuthenticated = Boolean(user?.id)

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
        loading.setCelebration({
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
      loading.setCelebration({
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
        await refreshSelectedCommunityProfile(targetUserId)
      }
      showSuccess(
        isFollowing
          ? (isEnglish ? 'Unfollowed' : '팔로우 취소')
          : (isEnglish ? 'Following' : '팔로우 중'),
        'info',
      )
    }, isEnglish ? 'Failed to update follow.' : '팔로우를 반영하지 못했어요.')
  }

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

  useEffect(() => {
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
  })

  usePendingActionReplay({
    isAuthenticated,
    loadingInit: loading.loadingInit,
    isEnglish,
    homeView: VIEW.HOME,
    pendingReplayHandlersRef,
    closeAuthPrompt,
    navigateToView,
    openWorkoutComposer,
    setReportTarget,
    showSuccess,
  })

  return {
    handleSignOut,
    handleSubmitTest,
    handleWorkoutComplete,
    handleSaveWorkoutTemplate,
    handleDeleteWorkoutTemplate,
    handleUpdateWorkout,
    handleDeleteWorkout,
    handleToggleLike,
    handleSubmitComment,
    handleToggleBlock,
    handleUpdateProfile,
    handleSaveWeight,
    handleCreateMatePost,
    handleToggleMateInterest,
    handleUpdateMatePostStatus,
    handleToggleFollow,
    handleOpenNotification,
  }
}
