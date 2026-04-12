import { useCallback, useEffect, useState } from 'react'
import { fetchPublicProfile } from '../services/communityService'

export function useCommunitySelection({ blockedIds }) {
  const [selectedCommunityUser, setSelectedCommunityUser] = useState(null)
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState(null)
  const [loadingSelectedCommunityProfile, setLoadingSelectedCommunityProfile] = useState(false)

  const handleSelectCommunityUser = useCallback((item) => {
    if (!item) return
    if (blockedIds.includes(item.user_id)) return

    setSelectedCommunityProfile(null)
    setSelectedCommunityUser({
      user_id: item.user_id,
      display_name: item.display_name ?? item.authorDisplayName ?? '',
      avatar_emoji: item.avatar_emoji ?? item.authorAvatarEmoji ?? 'RUN',
      avatar_url: item.avatar_url ?? item.authorAvatarUrl ?? null,
      activity_level: item.activity_level ?? null,
      activity_level_label: item.activity_level_label ?? null,
      total_xp: item.total_xp ?? 0,
      weekly_points: item.weekly_points ?? 0,
      latest_level: item.latest_level ?? item.authorLevel ?? null,
      latest_score: item.latest_score ?? item.authorScore ?? null,
      weekly_count: item.weekly_count ?? 0,
      total_workouts: item.total_workouts ?? 0,
      streak_days: item.streak_days ?? 0,
    })
  }, [blockedIds])

  const handleClearCommunityUser = useCallback(() => {
    setSelectedCommunityUser(null)
    setSelectedCommunityProfile(null)
  }, [])

  const refreshSelectedCommunityProfile = useCallback(async (targetUserId = selectedCommunityUser?.user_id) => {
    if (!targetUserId) return null

    const nextPublicProfile = await fetchPublicProfile(targetUserId)
    setSelectedCommunityProfile(nextPublicProfile)
    return nextPublicProfile
  }, [selectedCommunityUser?.user_id])

  useEffect(() => {
    if (!selectedCommunityUser?.user_id) {
      setSelectedCommunityProfile(null)
      setLoadingSelectedCommunityProfile(false)
      return undefined
    }

    let cancelled = false

    const loadPublicProfile = async () => {
      setLoadingSelectedCommunityProfile(true)

      try {
        const nextProfile = await fetchPublicProfile(selectedCommunityUser.user_id)
        if (!cancelled) {
          setSelectedCommunityProfile(nextProfile)
        }
      } catch {
        if (!cancelled) {
          setSelectedCommunityProfile(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingSelectedCommunityProfile(false)
        }
      }
    }

    loadPublicProfile()

    return () => {
      cancelled = true
    }
  }, [selectedCommunityUser?.user_id])

  useEffect(() => {
    if (selectedCommunityUser?.user_id && blockedIds.includes(selectedCommunityUser.user_id)) {
      handleClearCommunityUser()
    }
  }, [blockedIds, handleClearCommunityUser, selectedCommunityUser?.user_id])

  return {
    selectedCommunityUser,
    selectedCommunityProfile,
    loadingSelectedCommunityProfile,
    handleSelectCommunityUser,
    handleClearCommunityUser,
    refreshSelectedCommunityProfile,
    setSelectedCommunityProfile,
  }
}
