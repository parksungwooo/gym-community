import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  PARTY_MAX_MEMBERS,
  PARTY_STORAGE_KEY,
  addPartyMember,
  buildCurrentPartyMember,
  buildPartyInviteCandidates,
  buildPartySnapshot,
  createParty,
  getPartyInviteText,
  hydrateParty,
} from '../features/party/partyRules'

function loadStoredParty() {
  if (typeof window === 'undefined') return null

  const rawParty = window.localStorage.getItem(PARTY_STORAGE_KEY)
  if (!rawParty) return null

  try {
    return JSON.parse(rawParty)
  } catch {
    return null
  }
}

export function useParty({
  userId,
  effectiveProfile,
  activitySummary,
  workoutStats,
  visibleLeaderboard,
  followingIds,
  isEnglish,
  showSuccess,
  captureError,
}) {
  const [party, setParty] = useState(loadStoredParty)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!party) {
      window.localStorage.removeItem(PARTY_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(party))
  }, [party])

  const currentPartyMember = useMemo(() => buildCurrentPartyMember({
    currentUserId: userId,
    profile: effectiveProfile,
    activitySummary,
    stats: workoutStats,
  }), [activitySummary, effectiveProfile, userId, workoutStats])

  const hydratedParty = useMemo(
    () => hydrateParty(party, currentPartyMember),
    [currentPartyMember, party],
  )

  const partySnapshot = useMemo(
    () => buildPartySnapshot({ party: hydratedParty, currentMember: currentPartyMember }),
    [currentPartyMember, hydratedParty],
  )

  const partyInviteCandidates = useMemo(
    () => buildPartyInviteCandidates({
      leaderboard: visibleLeaderboard,
      followingIds,
      currentUserId: userId,
      party: hydratedParty,
    }),
    [followingIds, hydratedParty, userId, visibleLeaderboard],
  )

  const handleCreateParty = useCallback(() => {
    const partyName = isEnglish
      ? `${currentPartyMember.display_name}'s crew`
      : `${currentPartyMember.display_name} 파티`
    const nextParty = createParty({ name: partyName, owner: currentPartyMember })

    setParty(nextParty)
    showSuccess(
      isEnglish ? 'Party created. Invite up to 5 mates.' : '파티를 만들었어요. 친구 5명까지 초대할 수 있어요.',
      'success',
    )
  }, [currentPartyMember, isEnglish, showSuccess])

  const handleInvitePartyMember = useCallback(() => {
    if (!hydratedParty) {
      handleCreateParty()
      return
    }

    if ((hydratedParty.members?.length ?? 0) >= PARTY_MAX_MEMBERS) {
      showSuccess(isEnglish ? 'Party is full.' : '파티가 가득 찼어요.', 'info')
      return
    }

    const nextCandidate = partyInviteCandidates[0]
    if (!nextCandidate) {
      showSuccess(isEnglish ? 'Share the invite link with a friend.' : '초대 링크를 친구에게 보내보세요.', 'info')
      return
    }

    setParty((currentParty) => addPartyMember(
      hydrateParty(currentParty, currentPartyMember),
      nextCandidate,
    ))
    showSuccess(
      isEnglish ? `${nextCandidate.display_name} joined the party.` : `${nextCandidate.display_name}님이 파티에 합류했어요.`,
      'success',
    )
  }, [currentPartyMember, handleCreateParty, hydratedParty, isEnglish, partyInviteCandidates, showSuccess])

  const handleSharePartyInvite = useCallback(async () => {
    if (!hydratedParty) {
      handleCreateParty()
      return
    }

    const appUrl = typeof window === 'undefined' ? '' : window.location.origin
    const inviteText = getPartyInviteText(hydratedParty, appUrl)

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: hydratedParty.name,
          text: inviteText,
        })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteText)
      }

      showSuccess(isEnglish ? 'Party invite is ready.' : '파티 초대장을 준비했어요.', 'info')
    } catch (error) {
      if (error?.name === 'AbortError') return
      captureError(error, isEnglish ? 'Failed to share party invite.' : '파티 초대를 공유하지 못했어요.')
    }
  }, [captureError, handleCreateParty, hydratedParty, isEnglish, showSuccess])

  return {
    party,
    partySnapshot,
    partyInviteCandidates,
    handleCreateParty,
    handleInvitePartyMember,
    handleSharePartyInvite,
  }
}
