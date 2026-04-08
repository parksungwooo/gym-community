function getDaypart(isEnglish, hour = new Date().getHours()) {
  if (hour < 11) {
    return {
      label: isEnglish ? 'Morning cue' : '아침 리듬',
      encouragement: isEnglish ? 'A short start now makes the rest of the day easier.' : '지금 짧게 시작하면 하루가 훨씬 가벼워져요.',
    }
  }

  if (hour < 18) {
    return {
      label: isEnglish ? 'Daytime cue' : '낮 체크인',
      encouragement: isEnglish ? 'A small log is enough to keep today moving.' : '오늘 흐름은 짧은 기록 하나면 충분해요.',
    }
  }

  return {
    label: isEnglish ? 'Evening cue' : '저녁 마무리',
    encouragement: isEnglish ? 'One clean save tonight keeps the week from slipping.' : '오늘 밤 한 번만 기록해도 이번 주 리듬이 무너지지 않아요.',
  }
}

function countRecentFollowingPosts(visibleFeedPosts, followingIds, currentUserId) {
  const followingSet = new Set(followingIds)
  const now = Date.now()
  const recentWindowMs = 1000 * 60 * 60 * 48

  return visibleFeedPosts.filter((post) => (
    post?.user_id
    && post.user_id !== currentUserId
    && followingSet.has(post.user_id)
    && post.created_at
    && now - new Date(post.created_at).getTime() <= recentWindowMs
  )).length
}

export function buildHomeInsight({
  challenge,
  activitySummary,
  currentLevel,
  currentUserId,
  followingIds,
  visibleFeedPosts,
  visibleMatePosts,
  todayDone,
  isEnglish,
}) {
  const goal = Number(challenge?.goal) || 0
  const current = Number(challenge?.current) || 0
  const remainingGoal = Math.max(goal - current, 0)
  const streak = Number(activitySummary?.currentStreak) || 0
  const todayXp = Number(activitySummary?.todayXp) || 0
  const levelValue = Number(activitySummary?.levelValue) || 1
  const followingUpdateCount = countRecentFollowingPosts(
    visibleFeedPosts,
    followingIds,
    currentUserId,
  )
  const openMateCount = visibleMatePosts.filter((post) => post?.status !== 'closed').length
  const daypart = getDaypart(isEnglish)

  if (!currentLevel) {
    return {
      label: isEnglish ? 'Setup' : '시작 준비',
      title: isEnglish ? 'The level test sharpens this home screen.' : '레벨 테스트로 홈이 더 정확해져요.',
      body: isEnglish
        ? 'Workouts, feed, and suggestions fit better once your level is set.'
        : '운동, 피드, 추천이 내 페이스에 더 잘 맞아집니다.',
      tone: 'setup',
    }
  }

  if (!todayDone && remainingGoal === 1) {
    return {
      label: isEnglish ? 'Next step' : '지금 할 일',
      title: isEnglish ? 'One more log clears this week’s goal.' : '오늘 한 번이면 주간 목표 완료예요.',
      body: isEnglish
        ? `${current}/${goal} so far. Finish it while it still feels light.`
        : `지금 ${current}/${goal}. 오늘 가볍게 끝내면 돼요.`,
      tone: 'goal',
    }
  }

  if (todayDone && remainingGoal === 0) {
    return {
      label: isEnglish ? 'Weekly win' : '주간 클리어',
      title: isEnglish ? 'This week’s goal is done.' : '이번 주 목표 완료.',
      body: isEnglish
        ? `Rest a bit, or keep going from Activity Lv ${levelValue}.`
        : `쉬어도 좋고, 활동 Lv ${levelValue}로 더 가도 좋아요.`,
      tone: 'win',
    }
  }

  if (followingUpdateCount > 0) {
    return {
      label: isEnglish ? 'Community pulse' : '커뮤니티 온도',
      title: isEnglish
        ? `${followingUpdateCount} new updates from people you follow.`
        : `팔로우한 새 기록 ${followingUpdateCount}개가 있어요.`,
      body: isEnglish
        ? todayDone
          ? 'Good time to check in.'
          : 'A few posts can make starting easier.'
        : todayDone
          ? '지금 잠깐 둘러보기 좋아요.'
          : '먼저 보면 시작이 쉬워져요.',
      tone: 'community',
    }
  }

  if (!todayDone && streak >= 3) {
    return {
      label: isEnglish ? 'Streak watch' : '연속 기록',
      title: isEnglish ? `${streak} days in a row right now.` : `지금 ${streak}일 연속이에요.`,
      body: isEnglish
        ? 'A short log keeps it alive.'
        : '짧게 남겨도 이어집니다.',
      tone: 'streak',
    }
  }

  if (todayXp > 0) {
    return {
      label: isEnglish ? 'Growth note' : '성장 메모',
      title: isEnglish ? `${todayXp} XP already earned today.` : `오늘 ${todayXp} XP 적립.`,
      body: isEnglish
        ? 'Keep the momentum tidy.'
        : '오늘 흐름만 잘 정리하면 돼요.',
      tone: 'growth',
    }
  }

  if (!todayDone && openMateCount > 0) {
    return {
      label: isEnglish ? 'Meet people' : '함께 움직이기',
      title: isEnglish ? `${openMateCount} mate posts are open now.` : `메이트 모집 ${openMateCount}개가 열려 있어요.`,
      body: isEnglish
        ? 'Borrow someone else’s momentum.'
        : '혼자 힘들면 같이 가도 좋아요.',
      tone: 'community',
    }
  }

  return {
    label: daypart.label,
    title: isEnglish ? 'One clean save is enough today.' : '오늘은 한 번이면 충분해요.',
    body: daypart.encouragement,
    tone: 'default',
  }
}
