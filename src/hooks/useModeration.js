import { useCallback, useEffect, useState } from 'react'
import {
  resolveModerationReport,
  setFeedPostVisibility,
} from '../services/communityService'

export function useModeration({
  isAuthenticated,
  isAdmin,
  userId,
  isEnglish,
  refreshModerationRef,
  refreshFeedRef,
  captureError,
  showSuccess,
  setErrorMessage,
}) {
  const [moderationReports, setModerationReports] = useState([])
  const [moderationStatus, setModerationStatus] = useState('open')
  const [loadingModeration, setLoadingModeration] = useState(false)
  const [moderationActionLoading, setModerationActionLoading] = useState(false)

  const refreshCurrentModeration = useCallback(async (nextStatus = moderationStatus) => {
    if (!refreshModerationRef.current) return []
    return refreshModerationRef.current(nextStatus)
  }, [moderationStatus, refreshModerationRef])

  const handleResolveReport = useCallback(async (reportId, nextStatus, resolutionNote = '') => {
    if (!userId || !isAdmin || !reportId) return

    setModerationActionLoading(true)
    setErrorMessage('')

    try {
      await resolveModerationReport(reportId, nextStatus, resolutionNote)
      await refreshCurrentModeration(moderationStatus)
      showSuccess(isEnglish ? 'Updated' : '처리했어요.', 'info')
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update moderation report.' : '신고 상태를 바꾸지 못했어요.')
    } finally {
      setModerationActionLoading(false)
    }
  }, [
    captureError,
    isAdmin,
    isEnglish,
    moderationStatus,
    refreshCurrentModeration,
    setErrorMessage,
    showSuccess,
    userId,
  ])

  const handleToggleReportedPostVisibility = useCallback(async (report, nextVisibility, resolutionNote = '') => {
    if (!userId || !isAdmin || !report?.post_id) return

    setModerationActionLoading(true)
    setErrorMessage('')

    try {
      await setFeedPostVisibility(report.post_id, nextVisibility, resolutionNote)
      await Promise.all([
        refreshCurrentModeration(moderationStatus),
        refreshFeedRef.current?.(userId),
      ])
      showSuccess(
        nextVisibility === 'visible'
          ? (isEnglish ? 'Restored' : '복구했어요.')
          : (isEnglish ? 'Hidden' : '숨겼어요.'),
        nextVisibility === 'visible' ? 'info' : 'danger-soft',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update post visibility.' : '게시글 노출 상태를 바꾸지 못했어요.')
    } finally {
      setModerationActionLoading(false)
    }
  }, [
    captureError,
    isAdmin,
    isEnglish,
    moderationStatus,
    refreshCurrentModeration,
    refreshFeedRef,
    setErrorMessage,
    showSuccess,
    userId,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isAuthenticated || !isAdmin) {
        setModerationReports([])
        return
      }

      refreshCurrentModeration(moderationStatus).catch((error) => {
        captureError(error, isEnglish ? 'Failed to load moderation.' : '운영 목록을 불러오지 못했어요.')
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [
    captureError,
    isAdmin,
    isAuthenticated,
    isEnglish,
    moderationStatus,
    refreshCurrentModeration,
  ])

  return {
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
  }
}
