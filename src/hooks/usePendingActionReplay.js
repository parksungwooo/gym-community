import { useCallback, useEffect } from 'react'
import { consumePendingAction } from '../features/auth/authFlow'

export function usePendingActionReplay({
  isAuthenticated,
  loadingInit,
  isEnglish,
  homeView,
  pendingReplayHandlersRef,
  closeAuthPrompt,
  navigateToView,
  openWorkoutComposer,
  setReportTarget,
  showSuccess,
}) {
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
        navigateToView(homeView)
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
    homeView,
    isEnglish,
    navigateToView,
    openWorkoutComposer,
    pendingReplayHandlersRef,
    setReportTarget,
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
}
