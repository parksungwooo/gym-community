import { useCallback, useState } from 'react'
import { submitReport } from '../services/communityService'

export function useReportModal({
  userId,
  isEnglish,
  guardAuthAction,
  setLoadingAction,
  setErrorMessage,
  captureError,
  showSuccess,
}) {
  const [reportTarget, setReportTarget] = useState(null)

  const openReportComposer = useCallback((target) => {
    setReportTarget(target)
  }, [])

  const closeReportComposer = useCallback(() => {
    setReportTarget(null)
  }, [])

  const handleSubmitReport = useCallback(async ({ reason, details, subjectOverride = null }) => {
    const activeTarget = subjectOverride ?? reportTarget
    if (!activeTarget) return

    if (guardAuthAction('report', {
      type: 'submit_report',
      reason: 'report',
      view: 'community',
      payload: {
        kind: activeTarget.kind,
        targetUserId: activeTarget.targetUserId ?? null,
        postId: activeTarget.postId ?? null,
        reason,
        details,
      },
    })) return

    setLoadingAction(true)
    setErrorMessage('')

    try {
      await submitReport(userId, {
        targetUserId: activeTarget.targetUserId ?? null,
        postId: activeTarget.postId ?? null,
        reason,
        details,
      })
      setReportTarget(null)
      showSuccess(isEnglish ? 'Report sent' : '신고 접수', 'info')
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to submit report.' : '신고를 접수하지 못했어요.')
    } finally {
      setLoadingAction(false)
    }
  }, [
    captureError,
    guardAuthAction,
    isEnglish,
    reportTarget,
    setErrorMessage,
    setLoadingAction,
    showSuccess,
    userId,
  ])

  return {
    reportTarget,
    setReportTarget,
    openReportComposer,
    closeReportComposer,
    handleSubmitReport,
  }
}
