function getTodayKey() {
  return new Date().toLocaleDateString('sv-SE')
}

export function getE2EAppSnapshot() {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  if (params.get('e2e') !== '1') return null

  const now = new Date()
  const today = getTodayKey()
  const workoutHistory = [
    {
      id: 'workout-e2e-1',
      recorded_at: now.toISOString(),
      workout_type: '러닝',
      duration_minutes: 30,
      note: '가볍게 템포를 올렸어요.',
      estimated_calories: 286,
      photo_urls: [],
      share_to_feed: true,
    },
    {
      id: 'workout-e2e-2',
      recorded_at: new Date(now.getTime() - 86_400_000).toISOString(),
      workout_type: '스트레칭',
      duration_minutes: 20,
      note: '몸을 풀어주는 데 집중했어요.',
      estimated_calories: 74,
      photo_urls: [],
      share_to_feed: false,
    },
  ]

  return {
    user: null,
    todayDone: false,
    latestResult: {
      score: 12,
      level: '워밍',
      created_at: now.toISOString(),
    },
    profile: {
      id: 'profile-e2e',
      display_name: '플로우',
      avatar_emoji: 'RUN',
      avatar_url: null,
      weekly_goal: 4,
      bio: '주 4회 운동 흐름을 만들고 있어요.',
      fitness_tags: ['러닝', '초보'],
      default_share_to_feed: true,
      reminder_enabled: false,
      reminder_time: '19:00',
      total_xp: 148,
      weekly_points: 40,
      activity_level: 2,
      activity_level_label: 'Warm Up',
      streak_days: 3,
      last_activity_date: today,
      height_cm: 172,
      target_weight_kg: 68,
      is_admin: false,
      is_pro: false,
      subscription_tier: 'free',
    },
    feedPosts: [
      {
        id: 'feed-e2e-1',
        user_id: 'runner-e2e-1',
        type: 'workout_complete',
        content: '러닝 30분 완료',
        created_at: now.toISOString(),
        metadata: {
          workoutType: '러닝',
          durationMinutes: 30,
          note: '한강 쪽으로 가볍게 뛰었어요.',
        },
        authorDisplayName: '플로우 메이트',
        authorAvatarEmoji: 'RUN',
        authorAvatarUrl: null,
        authorLevel: '워밍',
        authorScore: 12,
        likeCount: 3,
        likedByMe: false,
        comments: [
          {
            id: 'comment-e2e-1',
            content: '좋은 흐름이에요!',
            authorDisplayName: '린',
          },
        ],
        activity_level: 2,
        activity_level_label: 'Warm Up',
        total_xp: 148,
        weekly_points: 40,
      },
    ],
    matePosts: [
      {
        id: 'mate-e2e-1',
        user_id: 'mate-e2e-1',
        title: '토요일 아침 러닝 같이 하실 분',
        workout_type: '러닝',
        location_label: '망원동',
        meeting_time: '토요일 08:00',
        preferred_level: '초보',
        participant_limit: 3,
        interested_count: 1,
        interested_by_me: false,
        status: 'open',
        created_at: now.toISOString(),
        authorDisplayName: '아침메이트',
        authorAvatarEmoji: 'RUN',
        authorAvatarUrl: null,
        authorBio: '주말 러닝 같이해요.',
        fitness_tags: ['러닝', '초보'],
      },
    ],
    leaderboard: [
      {
        user_id: 'runner-e2e-1',
        display_name: '플로우 메이트',
        avatar_emoji: 'RUN',
        avatar_url: null,
        latest_level: '워밍',
        latest_score: 12,
        weekly_count: 3,
        total_workouts: 8,
        streak_days: 3,
        weekly_points: 40,
        total_xp: 148,
        activity_level: 2,
        activity_level_label: 'Warm Up',
      },
    ],
    workoutHistory,
    workoutTemplates: [
      {
        id: 'routine-e2e-1',
        name: '아침 러닝',
        workout_type: '러닝',
        duration_minutes: 30,
        note: '',
      },
    ],
    weightLogs: [
      {
        id: 'weight-e2e-1',
        weight_kg: 69,
        recorded_at: now.toISOString(),
      },
    ],
    recentActivityEvents: [
      {
        id: 'xp-e2e-1',
        event_type: 'workout_complete',
        xp_amount: 28,
        weekly_points: 20,
        created_at: now.toISOString(),
        metadata: {
          workoutType: '러닝',
          durationMinutes: 30,
        },
      },
    ],
    achievementBadges: [
      { id: 'badge-e2e-1', badge_key: 'first_workout', awarded_at: now.toISOString() },
      { id: 'badge-e2e-2', badge_key: 'goal_first_clear', awarded_at: now.toISOString() },
    ],
    followingIds: [],
    blockedIds: [],
    followStats: {
      followerCount: 2,
      followingCount: 1,
    },
    notifications: [],
    unreadNotificationCount: 0,
  }
}
