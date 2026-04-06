import assert from 'node:assert/strict'
import process from 'node:process'

import { createAuthPromptState, sanitizePendingAction } from '../src/features/auth/authFlow.js'
import { buildCommunityAccessResult } from '../src/features/community/communityFlow.js'
import { buildNotificationNavigation } from '../src/features/notifications/notificationFlow.js'
import { getActivityEventMeta, getActivityLevelProgress } from '../src/utils/activityLevel.js'
import { getHashForView, parseViewFromHash } from '../src/utils/appRouting.js'
import { getImageSourceCandidates } from '../src/utils/imageOptimization.js'
import { getPaywallCopy, isProMember, PREMIUM_CONTEXT } from '../src/utils/premium.js'

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
    name: 'community gate redirects to profile when nickname is missing',
    run() {
      const result = buildCommunityAccessResult('community', false, 'community')

      assert.equal(result.allowed, false)
      assert.equal(result.redirectView, 'profile')
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
    name: 'activity level progress uses the shared XP thresholds',
    run() {
      const progress = getActivityLevelProgress(960)

      assert.equal(progress.levelValue, 7)
      assert.equal(progress.nextLevelValue, 8)
      assert.equal(progress.remainingXp, 390)
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
      assert.equal(isProMember({ subscription_tier: 'pro' }), true)
      assert.equal(isProMember({ plan_tier: 'free' }), false)
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
