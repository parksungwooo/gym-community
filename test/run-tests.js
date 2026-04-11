import assert from 'node:assert/strict'
import process from 'node:process'

import { createAuthPromptState, sanitizePendingAction } from '../src/features/auth/authFlow.js'
import { getActionableErrorMessage } from '../src/features/app/appFlowUtils.js'
import { buildCommunityAccessResult } from '../src/features/community/communityFlow.js'
import { buildGuestWorkoutRecord } from '../src/lib/guestStorage.js'
import { buildWeeklyLeague, getLeagueWeekKey } from '../src/features/league/leagueRules.js'
import { buildNotificationNavigation } from '../src/features/notifications/notificationFlow.js'
import {
  PARTY_MAX_MEMBERS,
  addPartyMember,
  buildCurrentPartyMember,
  buildPartySnapshot,
  createParty,
} from '../src/features/party/partyRules.js'
import {
  PRO_FEATURE_CATALOG,
  PRO_LEAGUE_REWARD_MULTIPLIER,
  applyProActivationToProfile,
  buildProActivationResult,
  getProComparisonRows,
  getProFeatureDefinition,
  getProHomeNudge,
  getProPaywallHighlights,
  getProWorkoutNudge,
} from '../src/features/pro/proStrategy.js'
import { getTodayWorkoutRecommendation } from '../src/features/workout/recommendations.js'
import { XP_RULE_TYPES, calculateLeagueReward, calculateXpAward, getXpAmountByType } from '../src/features/xp/xpRules.js'
import { getActivityEventMeta, getActivityLevelProgress } from '../src/utils/activityLevel.js'
import { buildAppHistoryState, getHashForView, parseViewFromHash, shouldPushHomeBackGuard } from '../src/utils/appRouting.js'
import { getImageSourceCandidates } from '../src/utils/imageOptimization.js'
import { buildKakaoShareUrl } from '../src/utils/kakaoShare.js'
import { buildOAuthProfilePatch } from '../src/utils/oauthProfile.js'
import { getCheckoutPreparation, getPaywallCopy, getPaywallTriggerCopy, isProMember, PREMIUM_CONTEXT } from '../src/utils/premium.js'
import { buildAdvancedAnalytics, buildAiTrainingPlan } from '../src/utils/premiumInsights.js'
import { getNextThemeMode, normalizeThemeMode, resolveThemeMode } from '../src/utils/theme.js'

const tests = [
  {
    name: 'login flow blocks protected action and stores auth prompt payload',
    run() {
      const result = createAuthPromptState(false, 'save_workout', {
        type: 'complete_workout',
        payload: { workoutType: '러닝' },
      })

      assert.equal(result.blocked, true)
      assert.deepEqual(result.authPrompt, {
        reason: 'save_workout',
        pendingAction: {
          type: 'complete_workout',
          payload: { workoutType: '러닝' },
        },
      })
    },
  },
  {
    name: 'workout save flow reopens composer when pending action contains new photos',
    run() {
      const result = sanitizePendingAction({
        type: 'complete_workout',
        reason: 'save_workout',
        view: 'home',
        payload: {
          workoutType: '웨이트',
          durationMinutes: 45,
          note: 'leg day',
          shareToFeed: false,
          photoItems: [{ kind: 'new', file: { name: 'proof.jpg', lastModified: 1, type: 'image/jpeg' } }],
        },
      })

      assert.equal(result.type, 'reopen_workout')
      assert.deepEqual(result.payload, {
        name: '',
        workoutType: '웨이트',
        durationMinutes: 45,
        note: 'leg day',
        defaultShareToFeed: false,
      })
    },
  },
  {
    name: 'follow flow keeps pending follow payload when auth is required',
    run() {
      const result = createAuthPromptState(false, 'follow', {
        type: 'toggle_follow',
        reason: 'follow',
        view: 'community',
        payload: { targetUserId: 'target-user', isFollowing: false },
      })

      assert.equal(result.authPrompt?.pendingAction?.type, 'toggle_follow')
      assert.deepEqual(result.authPrompt?.pendingAction?.payload, {
        targetUserId: 'target-user',
        isFollowing: false,
      })
    },
  },
  {
    name: 'mate post flow keeps pending draft payload when auth is required',
    run() {
      const result = createAuthPromptState(false, 'mate_post', {
        type: 'create_mate_post',
        reason: 'mate_post',
        view: 'community',
        payload: {
          title: '합정 저녁 러닝 메이트 구해요',
          workoutType: '러닝',
          locationLabel: '합정역 근처',
        },
      })

      assert.equal(result.authPrompt?.pendingAction?.type, 'create_mate_post')
      assert.equal(result.authPrompt?.pendingAction?.payload?.title, '합정 저녁 러닝 메이트 구해요')
    },
  },
  {
    name: 'notification flow opens actor profile for follow notifications',
    run() {
      const result = buildNotificationNavigation({
        type: 'follow',
        actor_user_id: 'user-123',
        actorDisplayName: 'Runner',
        actorAvatarEmoji: 'RN',
        actorAvatarUrl: 'https://example.com/avatar.webp',
      }, 'community')

      assert.equal(result.nextView, 'community')
      assert.deepEqual(result.selectedUser, {
        user_id: 'user-123',
        display_name: 'Runner',
        avatar_emoji: 'RN',
        avatar_url: 'https://example.com/avatar.webp',
      })
    },
  },
  {
    name: 'community gate allows access even when nickname is missing',
    run() {
      const result = buildCommunityAccessResult('community', false, 'community')

      assert.equal(result.allowed, true)
      assert.equal(result.redirectView, 'community')
    },
  },
  {
    name: 'route helpers parse and format hash views',
    run() {
      assert.equal(getHashForView('profile'), '#/profile')
      assert.equal(parseViewFromHash('#/community', 'home', ['home', 'community', 'profile']), 'community')
      assert.equal(parseViewFromHash('#/unknown', 'home', ['home', 'community', 'profile']), 'home')
    },
  },
  {
    name: 'home back guard only activates on home without overlays',
    run() {
      assert.deepEqual(buildAppHistoryState('community', { workoutSheet: false }), {
        workoutSheet: false,
        appView: 'community',
      })
      assert.equal(shouldPushHomeBackGuard('home', false, {}), true)
      assert.equal(shouldPushHomeBackGuard('home', true, {}), false)
      assert.equal(shouldPushHomeBackGuard('community', false, {}), false)
      assert.equal(shouldPushHomeBackGuard('home', false, { appHomeGuard: true }), false)
    },
  },
  {
    name: 'guest workout records preserve logged date and include a stable id',
    run() {
      const now = new Date('2026-04-10T07:08:09.000Z')
      const record = buildGuestWorkoutRecord({
        workoutType: 'Run',
        durationMinutes: 30,
      }, now)

      assert.equal(record.workoutType, 'Run')
      assert.equal(record.durationMinutes, 30)
      assert.equal(record.loggedDate, '2026-04-10')
      assert.equal(record.created_at, '2026-04-10T07:08:09.000Z')
      assert.equal(typeof record.id, 'string')
      assert.ok(record.id.length > 0)
    },
  },
  {
    name: 'guest workout records keep private share choice and photo items for later sync',
    run() {
      const record = buildGuestWorkoutRecord({
        workoutType: '러닝',
        durationMinutes: 30,
        note: 'sync me later',
        shareToFeed: false,
        photoItems: [
          {
            kind: 'new',
            label: 'proof.png',
            file: { name: 'proof.png', type: 'image/png' },
          },
        ],
      })

      assert.equal(record.shareToFeed, false)
      assert.equal(record.photoItems.length, 1)
      assert.equal(record.photoItems[0].label, 'proof.png')
      assert.equal(record.photoItems[0].file.name, 'proof.png')
      assert.equal(record.note, 'sync me later')
    },
  },
  {
    name: 'actionable error copy explains IndexedDB failures clearly',
    run() {
      const message = getActionableErrorMessage(
        new Error('IndexedDB InvalidStateError'),
        'fallback',
        true,
      )

      assert.match(message, /Local storage is unavailable/i)
    },
  },
  {
    name: 'activity level progress uses the shared XP thresholds',
    run() {
      const progress = getActivityLevelProgress(960)

      assert.equal(progress.levelValue, 7)
      assert.equal(progress.nextLevelValue, 8)
      assert.equal(progress.remainingXp, 390)
    },
  },
  {
    name: 'today workout recommendation returns renderable localized copy',
    run() {
      const recommendation = getTodayWorkoutRecommendation({
        currentLevel: { level: 1 },
        stats: { weeklyCount: 0 },
        language: 'en',
      })

      assert.equal(recommendation.title, '15-min easy walk')
      assert.equal(recommendation.label, 'First log this week')
      assert.equal(recommendation.body, 'Today works best with a low-barrier session.')
      assert.equal(recommendation.intensityLabel, 'Light')
    },
  },
  {
    name: 'XP rule engine returns total XP with expandable breakdown',
    run() {
      const award = calculateXpAward({
        workoutType: '웨이트',
        durationMinutes: 45,
        sets: 4,
        loadKg: 60,
        levelValue: 5,
        todayDone: false,
        todayCount: 0,
        historyCount: 0,
        streakCount: 7,
        weeklyCount: 3,
        weeklyGoal: 4,
        leagueBonus: 10,
        leveledUp: true,
      })

      assert.ok(award.totalXP > 0)
      assert.equal(award.totalXP, award.breakdown.reduce((total, item) => total + item.amount, 0))
      assert.ok(getXpAmountByType(award, XP_RULE_TYPES.WORKOUT_BASE) >= 10)
      assert.equal(getXpAmountByType(award, XP_RULE_TYPES.FIRST_RECORD), 25)
      assert.equal(getXpAmountByType(award, XP_RULE_TYPES.STREAK), 25)
      assert.equal(getXpAmountByType(award, XP_RULE_TYPES.WEEKLY_GOAL), 40)
      assert.equal(getXpAmountByType(award, XP_RULE_TYPES.LEAGUE), 10)
      assert.equal(getXpAmountByType(award, XP_RULE_TYPES.LEVEL_UP), 50)
    },
  },
  {
    name: 'league reward gives stronger XP to weekly top ranks',
    run() {
      assert.equal(calculateLeagueReward(1, 20), 120)
      assert.equal(calculateLeagueReward(2, 20), 80)
      assert.equal(calculateLeagueReward(5, 20), 35)
      assert.equal(calculateLeagueReward(10, 20), 0)
    },
  },
  {
    name: 'pro league reward applies the stronger paid reward multiplier',
    run() {
      assert.equal(calculateLeagueReward(1, 20, { isProLeague: true }), Math.round(120 * PRO_LEAGUE_REWARD_MULTIPLIER))
      assert.equal(calculateLeagueReward(2, 20, { isProLeague: true }), Math.round(80 * PRO_LEAGUE_REWARD_MULTIPLIER))
      assert.equal(calculateLeagueReward(10, 20, { isProLeague: true }), 0)
    },
  },
  {
    name: 'weekly league auto-joins current user and resets on Monday key',
    run() {
      const league = buildWeeklyLeague({
        now: new Date('2026-04-12T10:00:00'),
        currentUserId: 'me',
        profile: { id: 'me', display_name: '나', weekly_points: 120, total_xp: 900 },
        activitySummary: { weeklyPoints: 120, totalXp: 900, levelValue: 7 },
        stats: { weeklyCount: 4 },
        leaderboard: [
          { user_id: 'leader', display_name: '챔피언', weekly_points: 240, total_xp: 2000 },
          { user_id: 'mate', display_name: '메이트', weekly_points: 80, total_xp: 300 },
        ],
      })

      assert.equal(getLeagueWeekKey(new Date('2026-04-12T10:00:00')), '2026-04-06')
      assert.equal(league.participantCount, 3)
      assert.equal(league.currentUser.user_id, 'me')
      assert.equal(league.rank, 2)
      assert.equal(league.leader.user_id, 'leader')
      assert.equal(league.tier.key, 'bronze')
      assert.ok(league.xpToTopTen > 0)
    },
  },
  {
    name: 'pro strategy exposes paid features and upgrade nudges',
    run() {
      const definitions = getProFeatureDefinition('ko')
      const lockedHome = getProHomeNudge({ isPro: false, language: 'ko' })
      const activeWorkout = getProWorkoutNudge({ isPro: true, estimatedXp: 72, language: 'en' })
      const highlights = getProPaywallHighlights('ko')
      const comparisonRows = getProComparisonRows('en')

      assert.equal(PRO_FEATURE_CATALOG.length, 5)
      assert.equal(definitions[0].key, 'ai-plan')
      assert.match(definitions[0].titleText, /AI/)
      assert.equal(lockedHome.state, 'locked')
      assert.equal(lockedHome.metrics[1].value, '1.5x')
      assert.match(lockedHome.bonusCallout, /Pro/)
      assert.equal(activeWorkout.state, 'active')
      assert.match(activeWorkout.body, /72/)
      assert.equal(activeWorkout.previewItems.length, 3)
      assert.equal(highlights.length, 3)
      assert.match(highlights[1].metricText, /1.5/)
      assert.equal(comparisonRows.length, 5)
      assert.match(comparisonRows[0].proText, /AI/)
    },
  },
  {
    name: 'pro activation result patches profile immediately',
    run() {
      const result = buildProActivationResult({
        planId: 'annual',
        provider: 'stripe',
        language: 'ko',
        now: new Date('2026-04-12T00:00:00Z'),
      })
      const profile = applyProActivationToProfile({
        id: 'me',
        display_name: '러너',
        subscription_tier: 'free',
      }, result.activation)

      assert.equal(result.activated, true)
      assert.equal(result.activation.profilePatch.is_pro, true)
      assert.equal(result.activation.profilePatch.subscription_plan, 'annual')
      assert.equal(profile.is_pro, true)
      assert.equal(profile.isPremium, true)
      assert.equal(profile.subscription_tier, 'pro')
      assert.match(result.successCopy.title, /Pro/)
      assert.equal(result.successCopy.benefits.length, 3)
    },
  },
  {
    name: 'party rules create a six-member group with shared missions',
    run() {
      const owner = buildCurrentPartyMember({
        currentUserId: 'me',
        profile: { display_name: '리더', weekly_points: 30, total_xp: 200 },
        activitySummary: { weeklyPoints: 30, totalXp: 200 },
        stats: { weeklyCount: 2 },
      })
      let party = createParty({ name: '새벽 헬스팟', owner, now: new Date('2026-04-12T00:00:00Z') })

      Array.from({ length: 8 }).forEach((_, index) => {
        party = addPartyMember(party, {
          user_id: `mate-${index}`,
          display_name: `메이트 ${index}`,
          weekly_points: 20,
          weekly_count: 1,
          total_xp: 100,
        })
      })

      const snapshot = buildPartySnapshot({ party, currentMember: owner })

      assert.equal(snapshot.party.name, '새벽 헬스팟')
      assert.equal(snapshot.members.length, PARTY_MAX_MEMBERS)
      assert.equal(snapshot.totalWeeklyLogs, 7)
      assert.equal(snapshot.totalWeeklyXp, 130)
      assert.equal(snapshot.missions.length, 2)
      assert.equal(snapshot.missions[0].target, 100)
      assert.equal(snapshot.missions[1].target, 500000)
    },
  },
  {
    name: 'activity event meta describes workout XP events with workout details',
    run() {
      const meta = getActivityEventMeta({
        event_type: 'workout_complete',
        metadata: {
          workoutType: '러닝',
          durationMinutes: 30,
        },
      }, 'en')

      assert.equal(meta.label, 'Workout Complete')
      assert.equal(meta.description, '러닝 · 30 min')
    },
  },
    {
      name: 'premium paywall copy returns report-specific title',
      run() {
        const copy = getPaywallCopy(PREMIUM_CONTEXT.REPORTS, 'en')

        assert.equal(copy.kicker, 'Pro Reports')
        assert.match(copy.title, /Read the change/i)
      },
    },
    {
      name: 'premium paywall trigger copy matches the feature moment',
      run() {
        const aiTrigger = getPaywallTriggerCopy(PREMIUM_CONTEXT.AI_PLAN, 'ko')
        const unlimitedTrigger = getPaywallTriggerCopy(PREMIUM_CONTEXT.UNLIMITED, 'en')

        assert.match(aiTrigger.label, /AI 플랜/)
        assert.match(aiTrigger.ctaHint, /7일 무료/)
        assert.match(unlimitedTrigger.title, /Stopping here/i)
      },
    },
    {
      name: 'naver oauth metadata fills only empty profile fields',
      run() {
        const patch = buildOAuthProfilePatch({
          email: 'member@example.com',
          app_metadata: { provider: 'naver' },
          user_metadata: {
            name: '네이버회원',
            avatar_url: 'https://example.com/naver-profile.jpg',
          },
        }, {
          display_name: '',
          avatar_url: null,
          avatar_emoji: null,
        })

        assert.deepEqual(patch, {
          display_name: '네이버회원',
          avatar_url: 'https://example.com/naver-profile.jpg',
          avatar_emoji: 'NAVER',
        })

        const preserved = buildOAuthProfilePatch({
          app_metadata: { provider: 'naver' },
          user_metadata: {
            name: '새이름',
            avatar_url: 'https://example.com/new.jpg',
          },
        }, {
          display_name: '직접설정',
          avatar_url: 'https://example.com/original.jpg',
          avatar_emoji: 'RUN',
        })

        assert.deepEqual(preserved, {})
      },
    },
    {
      name: 'kakao share URL adds source and content UTM parameters',
      run() {
        const shareUrl = buildKakaoShareUrl({
          baseUrl: 'https://gym-community.vercel.app/#/progress',
          contentType: 'level_result',
        })
        const parsed = new URL(shareUrl)

        assert.equal(parsed.searchParams.get('utm_source'), 'kakaotalk')
        assert.equal(parsed.searchParams.get('utm_medium'), 'social')
        assert.equal(parsed.searchParams.get('utm_campaign'), 'gym_community_share')
        assert.equal(parsed.searchParams.get('utm_content'), 'level_result')
        assert.equal(parsed.hash, '#/progress')
      },
    },
    {
      name: 'AI premium plan uses level, goal, and history to build renderable sessions',
    run() {
      const plan = buildAiTrainingPlan({
        latestResult: { level: 'Lv3' },
        workoutHistory: [
          { date: '2026-04-10', workout_type: '웨이트', duration_minutes: 40 },
          { date: '2026-04-09', workout_type: '러닝', duration_minutes: 25 },
        ],
        workoutStats: { weeklyCount: 2, streak: 2 },
        weeklyGoal: 4,
        language: 'ko',
      })

      assert.equal(plan.weeklyTarget, '주 4회')
      assert.ok(plan.weekPlan.length >= 4)
      assert.equal(typeof plan.weekPlan[0].focus, 'string')
    },
  },
  {
    name: 'advanced premium analytics returns 1RM and recovery signals',
    run() {
      const analytics = buildAdvancedAnalytics({
        latestResult: { level: 'Lv4' },
        workoutHistory: [
          { date: '2026-04-10', workout_type: '웨이트', duration_minutes: 45 },
          { date: '2026-04-08', workout_type: '웨이트', duration_minutes: 35 },
        ],
        workoutStats: { weeklyCount: 2, streak: 3 },
        weeklyGoal: 4,
        language: 'en',
        isEnglish: true,
      })

      assert.equal(analytics.cards.length, 4)
      assert.match(analytics.cards[1].value, /kg/)
      assert.equal(analytics.chartBuckets.length, 7)
    },
  },
  {
    name: 'image source candidates fall back to the original public URL',
    run() {
      const candidates = getImageSourceCandidates(
        'https://demo.supabase.co/storage/v1/object/public/workout-photos/user/sample.jpg',
        'feedThumbnail',
      )

      assert.equal(candidates.length, 2)
      assert.match(candidates[0], /\/storage\/v1\/render\/image\/public\/workout-photos\/user\/sample\.jpg/)
      assert.equal(candidates[1], 'https://demo.supabase.co/storage/v1/object/public/workout-photos/user/sample.jpg')
    },
  },
  {
    name: 'isProMember detects common pro flags',
    run() {
      assert.equal(isProMember({ is_pro: true }), true)
      assert.equal(isProMember({ isPremium: true, premiumUntil: '2099-01-01T00:00:00Z' }), true)
      assert.equal(isProMember({ is_premium: true, premium_until: '2000-01-01T00:00:00Z' }), false)
      assert.equal(isProMember({ subscription_tier: 'pro' }), true)
      assert.equal(isProMember({ plan_tier: 'free' }), false)
    },
  },
  {
    name: 'checkout preparation exposes Stripe and Toss subscription IDs',
    run() {
      const stripeCheckout = getCheckoutPreparation('annual', 'stripe')
      const tossCheckout = getCheckoutPreparation('monthly', 'toss')

      assert.equal(stripeCheckout.mode, 'subscription')
      assert.match(stripeCheckout.priceId, /price_gym_pro_annual/)
      assert.equal(tossCheckout.priceId, 'gym_pro_monthly')
    },
  },
  {
    name: 'theme helpers default to dark navy and toggle correctly',
    run() {
      assert.equal(normalizeThemeMode('light'), 'light')
      assert.equal(normalizeThemeMode('sepia'), 'dark')
      assert.equal(resolveThemeMode(null), 'dark')
      assert.equal(getNextThemeMode('dark'), 'light')
      assert.equal(getNextThemeMode('light'), 'dark')
    },
  },
]

let failures = 0

for (const test of tests) {
  try {
    test.run()
    console.log(`PASS ${test.name}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${test.name}`)
    console.error(error)
  }
}

if (failures > 0) {
  process.exitCode = 1
} else {
  console.log(`All ${tests.length} flow checks passed.`)
}
