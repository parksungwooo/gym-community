import { useCallback, useEffect, useMemo, useState } from 'react'
import { LAST_REMINDER_STORAGE_KEY, getReminderStatus } from '../features/profile/profileFlow'

export function useReminder({
  isAuthenticated,
  userId,
  isEnglish,
  language,
  effectiveProfile,
  todayDone,
  navigateToView,
  homeView,
  showSuccess,
  captureError,
}) {
  const [reminderPermission, setReminderPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported',
  )

  const reminderStatus = useMemo(
    () => getReminderStatus(effectiveProfile, todayDone, language),
    [effectiveProfile, language, todayDone],
  )

  const handleRequestReminderPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showSuccess(
        isEnglish ? 'Browser notifications are not supported here.' : '이 환경에서는 브라우저 알림을 쓸 수 없어요.',
        'info',
      )
      return
    }

    try {
      const permission = await window.Notification.requestPermission()
      setReminderPermission(permission)
      showSuccess(
        permission === 'granted'
          ? (isEnglish ? 'Browser alerts are on.' : '브라우저 알림을 켰어요.')
          : permission === 'denied'
            ? (isEnglish ? 'Browser alerts blocked. In-app reminders stay on.' : '브라우저 알림은 막혔지만, 앱 안 알림은 계속 보여요.')
            : (isEnglish ? 'Reminder permission request was dismissed.' : '알림 권한 요청이 닫혔어요.'),
        'info',
      )
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to request reminder permission.' : '알림 권한을 요청하지 못했어요.')
    }
  }, [captureError, isEnglish, showSuccess])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return undefined
    }

    const syncPermission = () => {
      setReminderPermission(window.Notification.permission)
    }

    window.addEventListener('focus', syncPermission)
    document.addEventListener('visibilitychange', syncPermission)

    return () => {
      window.removeEventListener('focus', syncPermission)
      document.removeEventListener('visibilitychange', syncPermission)
    }
  }, [])

  useEffect(() => {
    if (
      typeof window === 'undefined'
      || !isAuthenticated
      || !userId
      || reminderPermission !== 'granted'
      || !reminderStatus.enabled
      || todayDone
    ) {
      return undefined
    }

    const maybeSendReminder = () => {
      const nextStatus = getReminderStatus(effectiveProfile, todayDone, language)

      if (!nextStatus.enabled || !nextStatus.due) return

      const storageKey = `${LAST_REMINDER_STORAGE_KEY}.${userId}`
      const lastReminderDate = window.localStorage.getItem(storageKey)

      if (lastReminderDate === nextStatus.todayKey) {
        return
      }

      const notification = new window.Notification(
        isEnglish ? 'Workout reminder' : '운동 리마인더',
        {
          body: isEnglish
            ? 'Your reminder time has arrived. Log one workout to keep the flow going.'
            : '운동할 시간이에요. 오늘 한 번만 움직여볼까요?',
        },
      )

      notification.onclick = () => {
        window.focus()
        navigateToView(homeView)
      }

      window.localStorage.setItem(storageKey, nextStatus.todayKey)
    }

    maybeSendReminder()
    const intervalId = window.setInterval(maybeSendReminder, 60000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [
    effectiveProfile,
    homeView,
    isAuthenticated,
    isEnglish,
    language,
    navigateToView,
    reminderPermission,
    reminderStatus.enabled,
    todayDone,
    userId,
  ])

  return {
    reminderStatus,
    reminderPermission,
    handleRequestReminderPermission,
  }
}
