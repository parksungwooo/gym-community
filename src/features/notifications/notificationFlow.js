export function buildNotificationNavigation(notification, communityView) {
  if (!notification) {
    return {
      nextView: communityView,
      selectedUser: null,
    }
  }

  if (notification.type === 'follow' && notification.actor_user_id) {
    return {
      nextView: communityView,
      selectedUser: {
        user_id: notification.actor_user_id,
        display_name: notification.actorDisplayName,
        avatar_emoji: notification.actorAvatarEmoji,
        avatar_url: notification.actorAvatarUrl,
      },
    }
  }

  return {
    nextView: communityView,
    selectedUser: null,
  }
}
