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
      title: isEnglish ? 'The 3-minute level test makes this tab much smarter.' : '3분 레벨 테스트를 하면 기록 탭이 훨씬 똑똑해져요.',
      body: isEnglish
        ? 'Summaries, badges, and progress cues become more personal once your level is set.'
        : '레벨이 정해지면 요약, 배지, 진행 안내가 지금보다 훨씬 개인적으로 바뀝니다.',
      tone: 'neutral',
    }
  }

  if (!hasHistory) {
    return {
      label: isEnglish ? 'First record' : '첫 기록',
      title: isEnglish ? 'Your calendar wakes up after the first saved workout.' : '첫 운동 기록이 쌓이면 달력과 요약이 바로 살아나요.',
      body: isEnglish
        ? 'One short entry is enough to start trends, streaks, and weekly pacing.'
        : '짧은 기록 하나만 있어도 추세, 연속 기록, 주간 페이스가 모두 읽히기 시작합니다.',
      tone: 'neutral',
    }
  }

  if (!hasWeightBaseline) {
    return {
      label: isEnglish ? 'Health baseline' : '몸 상태 기준점',
      title: isEnglish ? 'Log your current weight once to make changes easier to read.' : '몸무게를 한 번 기록해두면 변화가 훨씬 읽히기 쉬워져요.',
      body: isEnglish
        ? 'The rest of this screen becomes much clearer when one baseline is in place.'
        : '기준점이 하나 생기면 이 화면 전체가 훨씬 덜 막막하게 보입니다.',
      tone: 'warm',
    }
  }

  if (todayCount === 0 && remainingGoal === 1) {
    return {
      label: isEnglish ? 'Best next step' : '지금 제일 좋은 한 수',
      title: isEnglish ? 'One more workout finishes this week’s goal.' : '이번 주 목표까지 운동 1번만 더 남았어요.',
      body: isEnglish
        ? `You are already at ${weeklyCount}/${goal}. This is a light finish, not a catch-up sprint.`
        : `지금 ${weeklyCount}/${goal} 상태예요. 나중에 몰아치기보다 오늘 가볍게 끝내는 편이 훨씬 편합니다.`,
      tone: 'warm',
    }
  }

  if (todayCount === 0 && streak >= 3) {
    return {
      label: isEnglish ? 'Streak watch' : '연속 기록',
      title: isEnglish ? `${streak} days are alive right now.` : `지금 ${streak}일 연속 흐름이 살아 있어요.`,
      body: isEnglish
        ? 'A short log today is enough to keep the chain from breaking.'
        : '오늘은 짧은 기록 하나만 남겨도 이 흐름을 끊지 않을 수 있어요.',
      tone: 'growth',
    }
  }

  if (todayCount > 0 && todayXp > 0) {
    return {
      label: isEnglish ? 'Growth note' : '성장 메모',
      title: isEnglish
        ? `Today already has ${todayCount} saved log${todayCount > 1 ? 's' : ''} and ${todayXp} XP.`
        : `오늘은 이미 기록 ${todayCount}개와 ${todayXp} XP가 쌓였어요.`,
      body: isEnglish
        ? 'This is a good moment to review the day, not start from scratch again later.'
        : '지금은 다시 처음부터 시작하는 날이 아니라, 오늘 흐름을 정리해두기 좋은 타이밍이에요.',
      tone: 'growth',
    }
  }

  if (remainingGoal > 1) {
    return {
      label: isEnglish ? 'Weekly rhythm' : '주간 페이스',
      title: isEnglish ? `${remainingGoal} workouts are left for this week’s target.` : `이번 주 목표까지 운동 ${remainingGoal}번 남았어요.`,
      body: isEnglish
        ? 'The calendar gets easier to trust when you keep the pace even.'
        : '주간 페이스를 고르게 가져가면 이 기록 화면이 훨씬 믿을 만해집니다.',
      tone: 'cool',
    }
  }

  return {
    label: isEnglish ? 'Records' : '기록',
    title: isEnglish ? 'This page gets sharper every time you save one clean log.' : '기록 탭은 운동 하나를 남길 때마다 훨씬 또렷해져요.',
    body: isEnglish
      ? 'Calendar, streak, weight, and XP all become more useful when you keep them gently updated.'
      : '달력, 연속 기록, 몸무게, XP는 억지로 몰아쓰기보다 가볍게 이어갈수록 더 유용해집니다.',
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
      title: isEnglish ? 'Follow a few people to make the feed feel alive.' : '사람을 몇 명만 팔로우해도 피드가 훨씬 살아나요.',
      body: isEnglish
        ? 'Home and community both become much more personal once your circle exists.'
        : '내가 보는 홈과 커뮤니티는 연결된 사람이 생기는 순간부터 훨씬 내 앱처럼 바뀝니다.',
      tone: 'cool',
    }
  }

  if (activeUtility === 'discover') {
    return {
      label: isEnglish ? 'Discover mode' : '발견 모드',
      title: isEnglish
        ? `${suggestedUsers.length} suggested profile${suggestedUsers.length === 1 ? '' : 's'} are ready to explore.`
        : `지금 둘러볼 만한 추천 프로필이 ${suggestedUsers.length}명 있어요.`,
      body: isEnglish
        ? 'Pick a few people whose pace feels close to yours and the feed will get better fast.'
        : '내 페이스와 비슷한 사람 몇 명만 골라도 피드 품질이 아주 빨리 좋아집니다.',
      tone: 'cool',
    }
  }

  if (activeUtility === 'ranking') {
    return {
      label: isEnglish ? 'Weekly board' : '주간 보드',
      title: isEnglish
        ? `${visibleLeaderboard.length} people are on this week’s ranking board.`
        : `이번 주 랭킹 보드에 ${visibleLeaderboard.length}명이 올라와 있어요.`,
      body: isEnglish
        ? 'Use it to compare pace, not to pressure yourself.'
        : '이 화면은 조급해지기보다 페이스를 비교해보는 용도로 볼 때 가장 좋습니다.',
      tone: 'cool',
    }
  }

  if (activeTab === 'mate') {
    if (openMateCount > 0) {
      return {
        label: isEnglish ? 'Mate window' : '메이트 타이밍',
        title: isEnglish ? `${openMateCount} mate posts are open right now.` : `지금 열려 있는 메이트 모집이 ${openMateCount}개예요.`,
        body: isEnglish
          ? 'If motivation is low today, borrowing someone else’s momentum can help.'
          : '오늘 혼자 버거우면, 남의 리듬을 빌리는 쪽이 생각보다 훨씬 쉽습니다.',
        tone: 'warm',
      }
    }

    return {
      label: isEnglish ? 'Quiet board' : '조용한 게시판',
      title: isEnglish ? 'Mate posts are quiet right now.' : '지금은 메이트 게시판이 조금 조용해요.',
      body: isEnglish
        ? 'A clear post with time and purpose usually gets the board moving again.'
        : '시간과 목적이 분명한 글 하나가 게시판 분위기를 다시 움직이게 만드는 경우가 많아요.',
      tone: 'neutral',
    }
  }

  if (recentFollowingPosts > 0) {
    return {
      label: isEnglish ? 'Community pulse' : '커뮤니티 온도',
      title: isEnglish
        ? `${recentFollowingPosts} fresh updates are waiting from people you follow.`
        : `팔로우한 사람들의 새 기록 ${recentFollowingPosts}개가 기다리고 있어요.`,
      body: isEnglish
        ? 'This is the moment when community starts feeling personal instead of random.'
        : '이럴 때 커뮤니티가 낯선 공간이 아니라 내 흐름이 있는 공간처럼 느껴지기 시작합니다.',
      tone: 'cool',
    }
  }

  if (!currentLevel) {
    return {
      label: isEnglish ? 'Profile booster' : '프로필 부스터',
      title: isEnglish ? 'The level test makes people and suggestions feel more relevant.' : '레벨 테스트를 하면 사람 추천과 피드 톤이 더 잘 맞아집니다.',
      body: isEnglish
        ? 'It is not required, but it helps the app understand your pace.'
        : '필수는 아니지만, 앱이 내 페이스를 이해하는 데 꽤 큰 도움이 됩니다.',
      tone: 'neutral',
    }
  }

  if (recentCommunityPosts > 0) {
    return {
      label: isEnglish ? 'Live feed' : '움직이는 피드',
      title: isEnglish
        ? `${recentCommunityPosts} recent community updates are already live.`
        : `최근 커뮤니티 업데이트 ${recentCommunityPosts}개가 이미 올라와 있어요.`,
      body: isEnglish
        ? 'If the feed feels random today, use discover and follows to tune it.'
        : '피드가 아직 낯설게 느껴지면, 사람 발견과 팔로우를 통해 내 취향 쪽으로 맞추면 됩니다.',
      tone: 'cool',
    }
  }

  return {
    label: isEnglish ? 'Community rhythm' : '커뮤니티 리듬',
    title: isEnglish ? 'Feed and mates are both ready when you want a little momentum.' : '피드와 메이트는 동기부여가 조금 필요할 때 가장 힘을 발휘해요.',
    body: isEnglish
      ? 'Posts, follows, and a few familiar faces are what make this tab feel alive over time.'
      : '글, 팔로우, 익숙한 얼굴 몇 명이 쌓이기 시작하면 이 탭은 시간이 갈수록 훨씬 살아납니다.',
    tone: 'neutral',
  }
}
