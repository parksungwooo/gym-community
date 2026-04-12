import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getTodayDateString } from '../features/app/appFlowUtils'
import { deleteGuestWorkouts, getGuestWorkouts } from '../lib/guestStorage'
import { completeWorkout } from '../services/communityService'

export function useGuestSync({
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
}) {
  const guestSyncPromiseRef = useRef(null)
  const guestSyncAttemptedUserRef = useRef('')
  const [guestSyncState, setGuestSyncState] = useState({
    phase: 'idle',
    pendingCount: 0,
    failedCount: 0,
  })

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
              : `湲곕줉 ${syncedIds.length}媛쒕? 怨꾩젙?쇰줈 ??꼈?댁슂.`,
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
          : '湲곕줉 ?숆린?붿뿉 ?ㅽ뙣?덉뼱?? ?ㅼ떆 ?대낵寃뚯슂.',
      )
    }
  }, [captureError, isEnglish, openAuthPrompt, setErrorMessage, syncGuestWorkoutsToAccount, user])

  useEffect(() => {
    if (loadingInit) return undefined

    if (!isAuthenticated) {
      guestSyncAttemptedUserRef.current = ''
      const timer = window.setTimeout(() => {
        void refreshGuestSyncState(false)
      }, 0)

      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [isAuthenticated, loadingInit, refreshGuestSyncState])

  useEffect(() => {
    if (loadingInit || !user?.id) return undefined
    if (guestSyncAttemptedUserRef.current === user.id) return undefined

    guestSyncAttemptedUserRef.current = user.id
    const timer = window.setTimeout(() => {
      void syncGuestWorkoutsToAccount(user).catch((error) => {
        console.error('Failed to sync guest workouts:', error)
        captureError(
          error,
          isEnglish
            ? 'Could not sync local workouts right now. You can retry below.'
            : '지금은 기록을 옮기지 못했어요. 아래에서 다시 시도해 주세요.',
        )
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [captureError, isEnglish, loadingInit, syncGuestWorkoutsToAccount, user])

  const guestSyncNotice = useMemo(() => {
    if (!guestSyncState.pendingCount) return null

    if (guestSyncState.phase === 'guest_pending' && !isAuthenticated) {
      return {
        tone: 'pending',
        kicker: isEnglish ? 'Local Save' : '로컬 저장',
        title: isEnglish ? 'Your workouts are safe on this device.' : '운동 기록이 이 기기에 저장되어 있어요.',
        body: isEnglish
          ? 'Log in whenever you are ready and we will move them to your account.'
          : '로그인하면 계정으로 바로 옮겨드릴게요.',
        meta: isEnglish
          ? `${guestSyncState.pendingCount} workout${guestSyncState.pendingCount === 1 ? '' : 's'} waiting on this device`
          : `${guestSyncState.pendingCount}개의 운동 기록이 대기 중이에요`,
        actionLabel: isEnglish ? 'Log in to sync' : '로그인하고 동기화',
        actionKind: 'auth',
      }
    }

    if (guestSyncState.phase === 'syncing') {
      return {
        tone: 'syncing',
        kicker: isEnglish ? 'Syncing' : '동기화 중',
        title: isEnglish ? 'Moving local workouts to your account.' : '운동 기록을 계정으로 옮기는 중이에요.',
        body: isEnglish ? 'Keep using the app while this finishes.' : '완료될 때까지 앱을 계속 사용해도 괜찮아요.',
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
        kicker: isEnglish ? 'Sync Needed' : '동기화 필요',
        title: isEnglish ? 'Some local workouts still need sync.' : '아직 옮기지 못한 기록이 있어요.',
        body: isEnglish ? 'Nothing was lost. Retry when the connection is stable.' : '기록은 안전해요. 연결이 안정적일 때 다시 시도해 주세요.',
        meta: isEnglish
          ? `${pendingCount} workout${pendingCount === 1 ? '' : 's'} waiting`
          : `${pendingCount}개의 기록 대기 중`,
        actionLabel: isEnglish ? 'Retry sync' : '다시 시도',
        actionKind: 'retry',
      }
    }

    return null
  }, [guestSyncState, isAuthenticated, isEnglish])
  return {
    guestSyncState,
    guestSyncNotice,
    refreshGuestSyncState,
    syncGuestWorkoutsToAccount,
    handleRetryGuestSync,
  }
}
