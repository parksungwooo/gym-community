export function buildSuggestedUsers({ leaderboard, blockedIds, currentUserId, currentLevel }) {
  const visibleRows = (leaderboard ?? []).filter((item) => item.user_id !== currentUserId && !blockedIds.includes(item.user_id))
  const sameLevelRows = visibleRows.filter((item) => currentLevel && item.latest_level === currentLevel)

  if (sameLevelRows.length) {
    return sameLevelRows.slice(0, 2)
  }

  return visibleRows.slice(0, 2)
}

export function buildCommunityAccessResult(nextView) {
  return {
    allowed: true,
    redirectView: nextView,
  }
}
