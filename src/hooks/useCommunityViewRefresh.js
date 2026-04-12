import { useEffect } from 'react'

export function useCommunityViewRefresh({
  view,
  communityView,
  hasCommunityNickname,
  refreshMatePosts,
  userId,
  captureError,
  isEnglish,
}) {
  useEffect(() => {
    if (view !== communityView || !hasCommunityNickname) return undefined

    refreshMatePosts(userId).catch((error) => {
      captureError(error, isEnglish ? 'Failed to load mate board.' : '硫붿씠??寃뚯떆?먯쓣 遺덈윭?ㅼ? 紐삵뻽?듬땲??')
    })

    return undefined
  }, [captureError, communityView, hasCommunityNickname, isEnglish, refreshMatePosts, userId, view])
}
