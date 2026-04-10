import { supabase } from '../lib/supabaseClient'
import { assertServiceSuccess } from './serviceErrors'

export async function fetchFeedPostSummary(postId) {
  const { data, error } = await supabase
    .from('feed_posts')
    .select('id,user_id,type,content')
    .eq('id', postId)
    .maybeSingle()

  assertServiceSuccess(error, 'feed_posts.fetch_summary')

  return data
}

export async function createFeedPost(userId, content, type = 'general', metadata = {}) {
  const { error } = await supabase.from('feed_posts').insert({
    user_id: userId,
    content,
    type,
    metadata,
  })

  assertServiceSuccess(error, 'feed_posts.insert')
}

export async function toggleLike(userId, postId, isLiked) {
  if (isLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    assertServiceSuccess(error, 'likes.delete')

    return
  }

  const { error } = await supabase.from('likes').insert({
    user_id: userId,
    post_id: postId,
  })

  assertServiceSuccess(error, 'likes.insert')
}

export async function addComment(userId, postId, content) {
  const { error } = await supabase.from('comments').insert({
    user_id: userId,
    post_id: postId,
    content,
  })

  assertServiceSuccess(error, 'comments.insert')
}

export async function fetchFeedWithRelations(currentUserId, blockedUserIds = []) {
  const { data: posts, error: postError } = await supabase.rpc('get_public_feed_posts', {
    viewer_user_id: currentUserId ?? null,
    limit_count: 50,
  })

  assertServiceSuccess(postError, 'rpc.get_public_feed_posts')

  const visiblePosts = (posts ?? []).filter((post) => !blockedUserIds.includes(post.user_id))

  if (!visiblePosts.length) {
    return []
  }

  const postIds = visiblePosts.map((post) => post.id)

  const { data: comments, error: commentError } = await supabase
    .from('comments')
    .select('id,post_id,user_id,content,created_at')
    .in('post_id', postIds)
    .order('created_at', { ascending: true })

  assertServiceSuccess(commentError, 'comments.fetch_for_feed')

  const commentRows = comments ?? []
  const commentUserIds = [...new Set(commentRows.map((comment) => comment.user_id).filter(Boolean))]
  let commentProfileMap = {}

  if (commentUserIds.length > 0) {
    const { data: commentProfiles, error: commentProfileError } = await supabase
      .from('users')
      .select('id,display_name')
      .in('id', commentUserIds)

    assertServiceSuccess(commentProfileError, 'users.fetch_comment_profiles')

    commentProfileMap = (commentProfiles ?? []).reduce((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {})
  }

  const commentMap = commentRows.reduce((acc, comment) => {
    if (!acc[comment.post_id]) {
      acc[comment.post_id] = []
    }

    acc[comment.post_id].push({
      ...comment,
      authorDisplayName: commentProfileMap[comment.user_id]?.display_name ?? null,
    })
    return acc
  }, {})

  return visiblePosts.map((post) => ({
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    type: post.type,
    metadata: post.metadata ?? {},
    created_at: post.created_at,
    visibility_status: post.visibility_status,
    authorDisplayName: post.author_display_name ?? null,
    authorAvatarEmoji: post.author_avatar_emoji ?? null,
    authorAvatarUrl: post.author_avatar_url ?? null,
    authorLevel: post.author_level ?? null,
    authorScore: post.author_score ?? null,
    likeCount: Number(post.like_count) || 0,
    likedByMe: post.liked_by_me === true,
    comments: commentMap[post.id] ?? [],
  }))
}

export async function fetchLeaderboard(limit = 10) {
  const { data, error } = await supabase.rpc('get_public_leaderboard', {
    limit_count: limit,
  })

  assertServiceSuccess(error, 'rpc.get_public_leaderboard')

  return data ?? []
}
