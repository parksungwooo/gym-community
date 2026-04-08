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
      title: isEnglish ? 'The 3-minute level test unlocks better guidance.' : '3분 레벨 테스트를 하면 홈이 더 똑똑해져요.',
      body: isEnglish
        ? 'Once your level is set, workouts, feed, and suggestions can feel much more personal.'
        : '레벨이 잡히면 운동 제안, 피드, 추천 사람이 지금보다 훨씬 개인적으로 바뀝니다.',
      tone: 'setup',
    }
  }

  if (!todayDone && remainingGoal === 1) {
    return {
      label: isEnglish ? 'Best next step' : '지금 제일 좋은 한 수',
      title: isEnglish ? 'One workout today clears this week’s goal.' : '오늘 한 번만 기록하면 이번 주 목표가 끝나요.',
      body: isEnglish
        ? `You are already at ${current}/${goal}. Keep the pace while it still feels light.`
        : `지금 ${current}/${goal} 상태예요. 힘들게 몰아치기 전에 오늘 가볍게 끝내두는 편이 좋아요.`,
      tone: 'goal',
    }
  }

  if (todayDone && remainingGoal === 0) {
    return {
      label: isEnglish ? 'Weekly win' : '주간 클리어',
      title: isEnglish ? 'This week’s goal is already done.' : '이번 주 목표는 이미 채웠어요.',
      body: isEnglish
        ? `You can coast a little now, or keep building from Activity Lv ${levelValue}.`
        : `이제는 조금 쉬어도 되고, 아니면 활동 레벨 ${levelValue} 흐름을 더 밀어도 좋아요.`,
      tone: 'win',
    }
  }

  if (followingUpdateCount > 0) {
    return {
      label: isEnglish ? 'Community pulse' : '커뮤니티 온도',
      title: isEnglish
        ? `${followingUpdateCount} fresh updates are waiting from people you follow.`
        : `팔로우한 사람들의 새 기록 ${followingUpdateCount}개가 기다리고 있어요.`,
      body: isEnglish
        ? todayDone
          ? 'Your own log is in. This is a good moment to stay in the loop.'
          : 'Seeing one or two posts first can make starting today feel much easier.'
        : todayDone
          ? '내 기록은 남겼으니, 지금 잠깐 둘러보면 커뮤니티 리듬이 더 잘 이어져요.'
          : '남의 기록을 먼저 한두 개 보면 오늘 운동 시작 장벽이 훨씬 낮아집니다.',
      tone: 'community',
    }
  }

  if (!todayDone && streak >= 3) {
    return {
      label: isEnglish ? 'Streak watch' : '연속 기록',
      title: isEnglish ? `${streak} days are alive right now.` : `지금 ${streak}일 연속 흐름이 살아 있어요.`,
      body: isEnglish
        ? 'Even a short save is enough to keep the chain from breaking tonight.'
        : '오늘은 짧은 기록 하나만 남겨도 이 흐름을 끊지 않을 수 있어요.',
      tone: 'streak',
    }
  }

  if (todayXp > 0) {
    return {
      label: isEnglish ? 'Growth note' : '성장 메모',
      title: isEnglish ? `You already stacked ${todayXp} XP today.` : `오늘은 벌써 ${todayXp} XP를 쌓았어요.`,
      body: isEnglish
        ? 'This is a good day to keep the momentum tidy instead of starting from zero tomorrow.'
        : '내일 다시 0에서 시작하지 않도록, 오늘 흐름을 깔끔하게 이어가기 좋은 날이에요.',
      tone: 'growth',
    }
  }

  if (!todayDone && openMateCount > 0) {
    return {
      label: isEnglish ? 'Meet people' : '함께 움직이기',
      title: isEnglish ? `${openMateCount} mate posts are open now.` : `지금 열려 있는 메이트 모집이 ${openMateCount}개예요.`,
      body: isEnglish
        ? 'If motivation is low today, borrowing someone else’s momentum can help.'
        : '오늘 동기부여가 약하면 혼자 버티기보다 남의 리듬을 빌리는 편이 더 쉽습니다.',
      tone: 'community',
    }
  }

  return {
    label: daypart.label,
    title: isEnglish ? 'Today just needs one clean save.' : '오늘은 깔끔한 기록 하나면 충분해요.',
    body: daypart.encouragement,
    tone: 'default',
  }
}
