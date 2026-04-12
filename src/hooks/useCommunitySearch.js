import { useEffect, useState } from 'react'
import { withTimeout } from '../features/app/appFlowUtils'
import { searchPublicUsers } from '../services/communityService'

export function useCommunitySearch({
  blockedIds,
  captureError,
  isEnglish,
  userId,
}) {
  const [communitySearchQuery, setCommunitySearchQuery] = useState('')
  const [communitySearchResults, setCommunitySearchResults] = useState([])
  const [loadingCommunitySearch, setLoadingCommunitySearch] = useState(false)

  useEffect(() => {
    const trimmedQuery = communitySearchQuery.trim()
    let cancelled = false

    const timer = window.setTimeout(async () => {
      if (trimmedQuery.length < 2) {
        if (!cancelled) {
          setCommunitySearchResults([])
          setLoadingCommunitySearch(false)
        }
        return
      }

      setLoadingCommunitySearch(true)

      try {
        const rows = await withTimeout(
          searchPublicUsers(trimmedQuery, 12),
          10000,
          isEnglish ? 'Search is taking too long.' : '사람 검색이 지연되고 있어요.',
        )

        if (!cancelled) {
          setCommunitySearchResults(
            rows.filter((item) => item.user_id !== userId && !blockedIds.includes(item.user_id)),
          )
        }
      } catch (error) {
        if (!cancelled) {
          setCommunitySearchResults([])
          captureError(error, isEnglish ? 'Failed to search users.' : '사람을 찾지 못했어요.')
        }
      } finally {
        if (!cancelled) {
          setLoadingCommunitySearch(false)
        }
      }
    }, trimmedQuery.length < 2 ? 0 : 260)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [blockedIds, captureError, communitySearchQuery, isEnglish, userId])

  return {
    communitySearchQuery,
    setCommunitySearchQuery,
    communitySearchResults,
    setCommunitySearchResults,
    loadingCommunitySearch,
    setLoadingCommunitySearch,
  }
}
