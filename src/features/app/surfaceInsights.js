function countRecentPosts(posts, currentUserId, predicate = () => true, windowHours = 48) {
  const now = Date.now()
  const windowMs = windowHours * 60 * 60 * 1000

  return posts.filter((post) => (
    post?.created_at
    && post.user_id !== currentUserId
    && predicate(post)
    && now - new Date(post.created_at).getTime() <= windowMs
  )).length
}

export function buildProgressInsight({
  currentLevel,
  workoutStats,
  weeklyGoal,
  bodyMetrics,
  activitySummary,
  workoutHistory,
  isEnglish,
}) {
  const todayCount = Number(workoutStats?.todayCount) || 0
  const weeklyCount = Number(workoutStats?.weeklyCount) || 0
  const goal = Number(weeklyGoal) || 4
  const remainingGoal = Math.max(goal - weeklyCount, 0)
  const streak = Number(activitySummary?.currentStreak) || Number(workoutStats?.streak) || 0
  const todayXp = Number(activitySummary?.todayXp) || 0
  const hasWeightBaseline = bodyMetrics?.latestWeightKg != null
  const hasHistory = (workoutHistory?.length ?? 0) > 0

  if (!currentLevel) {
    return {
      label: isEnglish ? 'Setup' : '시작 준비',
      title: isEnglish ? 'The level test sharpens this tab.' : '레벨 테스트를 하면 기록이 더 또렷해져요.',
      body: isEnglish
        ? 'Summaries and cues fit better once your level is set.'
        : '요약과 안내가 내 페이스에 더 잘 맞아요.',
      tone: 'neutral',
    }
  }

  if (!hasHistory) {
    return {
      label: isEnglish ? 'First record' : '첫 기록',
      title: isEnglish ? 'The calendar wakes up after the first log.' : '첫 기록부터 흐름이 보이기 시작해요.',
      body: isEnglish
        ? 'One entry starts the trend.'
        : '한 번만 남겨도 기록이 살아나요.',
      tone: 'neutral',
    }
  }

  if (!hasWeightBaseline) {
    return {
      label: isEnglish ? 'Health baseline' : '몸 상태 기준',
      title: isEnglish ? 'Log your weight once to read changes better.' : '몸무게를 한 번 남기면 변화가 더 잘 보여요.',
      body: isEnglish
        ? 'One baseline makes the screen clearer.'
        : '기준점 하나면 화면이 더 쉬워져요.',
      tone: 'warm',
    }
  }

  if (todayCount === 0 && remainingGoal === 1) {
    return {
      label: isEnglish ? 'Next step' : '지금 할 일',
      title: isEnglish ? 'One more workout finishes this week\'s goal.' : '오늘 한 번이면 주간 목표예요.',
      body: isEnglish
        ? `${weeklyCount}/${goal} so far. Finish light today.`
        : `지금 ${weeklyCount}/${goal}. 가볍게 채우면 돼요.`,
      tone: 'warm',
    }
  }

  if (todayCount === 0 && streak >= 3) {
    return {
      label: isEnglish ? 'Streak watch' : '연속 기록',
      title: isEnglish ? `${streak} days in a row right now.` : `지금 ${streak}일째 이어가고 있어요.`,
      body: isEnglish
        ? 'A short log keeps it alive.'
        : '짧게 남겨도 흐름은 이어져요.',
      tone: 'growth',
    }
  }

  if (todayCount > 0 && todayXp > 0) {
    return {
      label: isEnglish ? 'Growth note' : '성장 메모',
      title: isEnglish
        ? `${todayCount} log${todayCount > 1 ? 's' : ''} and ${todayXp} XP today.`
        : `오늘 기록 ${todayCount}개, XP ${todayXp}`,
      body: isEnglish
        ? 'Good time to wrap the day.'
        : '이제 오늘 흐름만 정리하면 돼요.',
      tone: 'growth',
    }
  }

  if (remainingGoal > 1) {
    return {
      label: isEnglish ? 'Weekly rhythm' : '주간 흐름',
      title: isEnglish ? `${remainingGoal} workouts left this week.` : `이번 주 ${remainingGoal}번 남았어요.`,
      body: isEnglish
        ? 'Even pacing makes this screen clearer.'
        : '고르게 가면 기록도 더 잘 보여요.',
      tone: 'cool',
    }
  }

  return {
    label: isEnglish ? 'Records' : '기록',
    title: isEnglish ? 'This page sharpens with every log.' : '기록이 쌓일수록 더 또렷해져요.',
    body: isEnglish
      ? 'Calendar, weight, and XP get better as you keep going.'
      : '달력, 몸무게, XP가 함께 정리돼요.',
    tone: 'neutral',
  }
}

export function buildCommunityInsight({
  currentLevel,
  currentUserId,
  followingIds,
  suggestedUsers,
  visibleLeaderboard,
  visibleFeedPosts,
  visibleMatePosts,
  activeTab,
  activeUtility,
  isEnglish,
}) {
  const followingSet = new Set(followingIds)
  const recentFollowingPosts = countRecentPosts(
    visibleFeedPosts,
    currentUserId,
    (post) => followingSet.has(post.user_id),
  )
  const recentCommunityPosts = countRecentPosts(
    visibleFeedPosts,
    currentUserId,
    () => true,
  )
  const openMateCount = visibleMatePosts.filter((post) => post?.status !== 'closed').length

  if (followingIds.length === 0) {
    return {
      label: isEnglish ? 'First circle' : '첫 연결',
      title: isEnglish ? 'Follow a few people and the feed wakes up.' : '몇 명만 팔로우해도 피드가 살아나요.',
      body: isEnglish
        ? 'Your feed gets personal fast.'
        : '내 피드가 금방 개인화돼요.',
      tone: 'cool',
    }
  }

  if (activeUtility === 'discover') {
    return {
      label: isEnglish ? 'Discover' : '사람 찾기',
      title: isEnglish
        ? `${suggestedUsers.length} suggested profile${suggestedUsers.length === 1 ? '' : 's'} right now.`
        : `추천 ${suggestedUsers.length}명이 보여요.`,
      body: isEnglish
        ? 'Start with people close to your pace.'
        : '비슷한 페이스부터 보면 돼요.',
      tone: 'cool',
    }
  }

  if (activeUtility === 'ranking') {
    return {
      label: isEnglish ? 'Weekly ranking' : '주간 랭킹',
      title: isEnglish
        ? `${visibleLeaderboard.length} people are on the board this week.`
        : `이번 주 ${visibleLeaderboard.length}명이 달리고 있어요.`,
      body: isEnglish
        ? 'Look for pace, not pressure.'
        : '압박보다 흐름만 보면 돼요.',
      tone: 'cool',
    }
  }

  if (activeTab === 'mate') {
    if (openMateCount > 0) {
      return {
        label: isEnglish ? 'Mate posts' : '메이트 모집',
        title: isEnglish ? `${openMateCount} mate post${openMateCount === 1 ? '' : 's'} are open now.` : `${openMateCount}개 열려 있어요.`,
        body: isEnglish
          ? 'A short reply is enough to join.'
          : '가볍게 한 줄만 남겨도 돼요.',
        tone: 'warm',
      }
    }

    return {
      label: isEnglish ? 'Mate board' : '메이트',
      title: isEnglish ? 'Mate posts are quiet right now.' : '지금은 조용해요.',
      body: isEnglish
        ? 'A clear post gets it moving again.'
        : '짧고 분명한 글이 잘 열어요.',
      tone: 'neutral',
    }
  }

  if (recentFollowingPosts > 0) {
    return {
      label: isEnglish ? 'Following' : '팔로우',
      title: isEnglish
        ? `${recentFollowingPosts} new update${recentFollowingPosts === 1 ? '' : 's'} from people you follow.`
        : `새 글 ${recentFollowingPosts}개가 올라왔어요.`,
      body: isEnglish
        ? 'This is where the feed starts to feel personal.'
        : '이제 피드가 좀 더 내 취향이에요.',
      tone: 'cool',
    }
  }

  if (!currentLevel) {
    return {
      label: isEnglish ? 'Level test' : '레벨 테스트',
      title: isEnglish ? 'The level test makes suggestions fit better.' : '테스트를 하면 추천이 더 잘 맞아요.',
      body: isEnglish
        ? 'It helps the app understand your pace.'
        : '내 페이스를 읽는 데 도움이 돼요.',
      tone: 'neutral',
    }
  }

  if (recentCommunityPosts > 0) {
    return {
      label: isEnglish ? 'Live feed' : '실시간 피드',
      title: isEnglish
        ? `${recentCommunityPosts} recent update${recentCommunityPosts === 1 ? '' : 's'} are live.`
        : `최근 글 ${recentCommunityPosts}개가 올라와 있어요.`,
      body: isEnglish
        ? 'Use follows and filters to tune it.'
        : '팔로우와 필터로 더 맞출 수 있어요.',
      tone: 'cool',
    }
  }

  return {
    label: isEnglish ? 'Community' : '커뮤니티',
    title: isEnglish ? 'Feed and mates are ready when you need a push.' : '피드와 메이트가 준비돼 있어요.',
    body: isEnglish
      ? 'Posts and familiar faces make this tab feel alive.'
      : '글과 사람이 쌓일수록 더 살아나요.',
    tone: 'neutral',
  }
}
