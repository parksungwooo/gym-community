import { useCallback, useEffect, useRef, useState } from 'react'
import { buildNotificationNavigation } from '../features/notifications/notificationFlow'
import { supabase } from '../lib/supabaseClient'
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/communityService'

export function useNotifications({
  isAuthenticated,
  userId,
  isEnglish,
  communityView,
  refreshNotificationsRef,
  showSuccess,
  captureError,
}) {
  const notificationRefreshTimeoutRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const refreshNotifications = useCallback(async (nextUserId = userId) => {
    if (!refreshNotificationsRef.current) return null
    return refreshNotificationsRef.current(nextUserId)
  }, [refreshNotificationsRef, userId])

  const openNotificationCenter = useCallback(async () => {
    if (!userId) return

    setShowNotificationCenter(true)

    try {
      await refreshNotifications(userId)
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to load notifications.' : '알림을 불러오지 못했어요.')
    }
  }, [captureError, isEnglish, refreshNotifications, userId])

  const closeNotificationCenter = useCallback(() => {
    setShowNotificationCenter(false)
  }, [])

  const handleMarkAllNotificationsRead = useCallback(async () => {
    if (!userId || unreadNotificationCount === 0) return

    try {
      await markAllNotificationsRead(userId)
      setNotifications((prev) => prev.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
        unread: false,
      })))
      setUnreadNotificationCount(0)
      showSuccess(isEnglish ? 'All read' : '모두 읽음', 'info')
    } catch (error) {
      captureError(error, isEnglish ? 'Failed to update notifications.' : '알림 상태를 바꾸지 못했어요.')
    }
  }, [captureError, isEnglish, showSuccess, unreadNotificationCount, userId])

  const handleOpenNotification = useCallback(async (notification, callbacks = {}) => {
    if (!notification || !userId) return

    if (notification.unread) {
      try {
        await markNotificationRead(userId, notification.id)
        setNotifications((prev) => prev.map((item) => (
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString(), unread: false }
            : item
        )))
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        captureError(error, isEnglish ? 'Failed to open notification.' : '알림을 여는 중 문제가 생겼어요.')
      }
    }

    closeNotificationCenter()

    const navigation = buildNotificationNavigation(notification, communityView)

    if (navigation.selectedUser) {
      callbacks.onSelectUser?.(navigation.selectedUser)
    } else {
      callbacks.onClearUser?.()
    }

    callbacks.onChangeView?.(navigation.nextView)
  }, [captureError, closeNotificationCenter, communityView, isEnglish, userId])

  useEffect(() => {
    if (!isAuthenticated || !userId) return undefined

    const scheduleNotificationRefresh = () => {
      if (notificationRefreshTimeoutRef.current) {
        window.clearTimeout(notificationRefreshTimeoutRef.current)
      }

      notificationRefreshTimeoutRef.current = window.setTimeout(() => {
        refreshNotifications(userId).catch(() => {})
        notificationRefreshTimeoutRef.current = null
      }, 180)
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            showSuccess(
              isEnglish ? 'New notification.' : '새 알림이 왔어요.',
              'info',
            )
          }

          scheduleNotificationRefresh()
        },
      )
      .subscribe()

    return () => {
      if (notificationRefreshTimeoutRef.current) {
        window.clearTimeout(notificationRefreshTimeoutRef.current)
        notificationRefreshTimeoutRef.current = null
      }

      supabase.removeChannel(channel)
    }
  }, [isAuthenticated, isEnglish, refreshNotifications, showSuccess, userId])

  return {
    notifications,
    setNotifications,
    unreadNotificationCount,
    setUnreadNotificationCount,
    showNotificationCenter,
    setShowNotificationCenter,
    loadingNotifications,
    setLoadingNotifications,
    openNotificationCenter,
    closeNotificationCenter,
    handleMarkAllNotificationsRead,
    handleOpenNotification,
  }
}
