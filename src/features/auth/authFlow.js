export const PENDING_AUTH_ACTION_KEY = 'gym-community.pending-auth-action.v1'

function defaultIsFileLike(value) {
  if (!value) return false
  if (typeof File !== 'undefined' && value instanceof File) return true
  return Boolean(value?.name && value?.lastModified && typeof value?.type === 'string')
}

export function sanitizePendingAction(action, isFileLike = defaultIsFileLike) {
  if (!action) return null

  if (action.type === 'complete_workout') {
    const hasNewPhotos = Array.isArray(action.payload?.photoItems)
      && action.payload.photoItems.some((item) => item?.kind === 'new' || isFileLike(item) || isFileLike(item?.file))

    if (hasNewPhotos) {
      return {
        type: 'reopen_workout',
        reason: action.reason,
        view: action.view,
        payload: {
          name: action.payload?.name || '',
          workoutType: action.payload?.workoutType || '러닝',
          durationMinutes: action.payload?.durationMinutes || 30,
          note: action.payload?.note || '',
          defaultShareToFeed: action.payload?.shareToFeed !== false,
        },
      }
    }
  }

  if (action.type === 'update_profile') {
    const hasAvatarFile = isFileLike(action.payload?.avatarFile)

    if (hasAvatarFile) {
      return {
        type: 'update_profile',
        reason: action.reason,
        view: action.view,
        payload: {
          ...action.payload,
          avatarUrl: action.payload?.existingAvatarUrl ?? null,
          avatarFile: undefined,
          needsAvatarReattach: true,
        },
      }
    }
  }

  return action
}

export function persistPendingAction(action) {
  if (typeof window === 'undefined') return

  const safeAction = sanitizePendingAction(action)

  if (!safeAction) {
    window.sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY)
    return
  }

  window.sessionStorage.setItem(PENDING_AUTH_ACTION_KEY, JSON.stringify(safeAction))
}

export function consumePendingAction() {
  if (typeof window === 'undefined') return null

  const rawValue = window.sessionStorage.getItem(PENDING_AUTH_ACTION_KEY)

  if (!rawValue) return null

  window.sessionStorage.removeItem(PENDING_AUTH_ACTION_KEY)

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

export function createAuthPromptState(isAuthenticated, reason, pendingAction = null) {
  if (isAuthenticated) {
    return {
      blocked: false,
      authPrompt: null,
    }
  }

  return {
    blocked: true,
    authPrompt: {
      reason,
      pendingAction,
    },
  }
}
