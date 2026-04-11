import { useState } from 'react'
import UserAvatar from './UserAvatar'
import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'
import { localizeLevelText } from '../utils/level'
import { shareOrDownloadCard } from '../utils/shareCard'

const FILTERS = {
  ko: [
    { key: 'all', label: '전체' },
    { key: 'following', label: '팔로잉' },
    { key: 'same_level', label: '내 레벨' },
    { key: 'workout_complete', label: '운동' },
    { key: 'level_up', label: '레벨업' },
    { key: 'profile_update', label: '프로필' },
    { key: 'challenge_complete', label: '챌린지' },
  ],
  en: [
    { key: 'all', label: 'All' },
    { key: 'following', label: 'Following' },
    { key: 'same_level', label: 'My Level' },
    { key: 'workout_complete', label: 'Workout' },
    { key: 'level_up', label: 'Level Up' },
    { key: 'profile_update', label: 'Profile' },
    { key: 'challenge_complete', label: 'Challenge' },
  ],
}

function shortUser(userId, displayName, isEnglish) {
  if (displayName?.trim()) {
    if (displayName.includes('@')) {
      const localName = displayName.split('@')[0]?.trim()
      if (localName) return localName
    }
    return displayName.trim()
  }

  if (!userId) return isEnglish ? 'Guest' : '게스트'
  return `${isEnglish ? 'Guest' : '게스트'}-${userId.slice(0, 6)}`
}

function getTypeLabel(type, isEnglish) {
  const labels = {
    workout_complete: isEnglish ? 'Workout' : '운동',
    level_up: isEnglish ? 'Level Up' : '레벨업',
    profile_update: isEnglish ? 'Profile' : '프로필',
    challenge_complete: isEnglish ? 'Challenge' : '챌린지',
    test_result: isEnglish ? 'Test' : '테스트',
  }

  return labels[type] ?? (isEnglish ? 'Update' : '업데이트')
}

function getPostContent(post, language) {
  const isEnglish = language === 'en'
  const note = post.metadata?.note?.trim()

  switch (post.type) {
    case 'workout_complete': {
      if (note) return note
      return isEnglish ? 'Workout logged.' : '운동 완료.'
    }
    case 'test_result':
      return isEnglish
        ? `${localizeLevelText(post.metadata?.level, language)} · ${post.metadata?.score ?? 0} pts`
        : `${localizeLevelText(post.metadata?.level, language)} · ${post.metadata?.score ?? 0}점`
    case 'level_up':
      return isEnglish
        ? `${localizeLevelText(post.metadata?.to, language)} reached`
        : `${localizeLevelText(post.metadata?.to, language)} 도달`
    case 'profile_update':
      return isEnglish ? 'Profile updated.' : '프로필 업데이트'
    case 'challenge_complete':
      return isEnglish
        ? `Goal done · ${post.metadata?.goal ?? 0}`
        : `주간 목표 완료 · ${post.metadata?.goal ?? 0}회`
    default:
      return post.content
  }
}

function getPostPhotoUrls(post) {
  if (Array.isArray(post.metadata?.photoUrls) && post.metadata.photoUrls.length) return post.metadata.photoUrls
  if (post.metadata?.photoUrl) return [post.metadata.photoUrl]
  return []
}

function getWorkoutStoryMeta(post, language, isEnglish) {
  if (post.type !== 'workout_complete') return null

  const workoutType = getWorkoutTypeLabel(post.metadata?.workoutType, language)
  const parts = [workoutType]

  if (post.metadata?.durationMinutes) {
    parts.push(isEnglish ? `${post.metadata.durationMinutes} min` : `${post.metadata.durationMinutes}분`)
  }

  return parts.join(' · ')
}

function getWorkoutStatsForPost(post, isEnglish) {
  if (post.type !== 'workout_complete') return []

  const stats = []

  if (post.metadata?.durationMinutes) {
    stats.push({
      label: isEnglish ? 'Time' : '시간',
      value: isEnglish ? `${post.metadata.durationMinutes} min` : `${post.metadata.durationMinutes}분`,
    })
  }

  if (post.metadata?.estimatedCalories || post.metadata?.calories) {
    const calories = post.metadata.estimatedCalories ?? post.metadata.calories
    stats.push({
      label: isEnglish ? 'Burn' : '소모',
      value: `${calories} kcal`,
    })
  }

  if (post.metadata?.date) {
    stats.push({
      label: isEnglish ? 'Date' : '날짜',
      value: post.metadata.date,
    })
  }

  return stats.slice(0, 3)
}

function getSharePayloadForPost(post, language, isEnglish) {
  const title = getTypeLabel(post.type, isEnglish)
  const content = getPostContent(post, language)
  const stats = getWorkoutStatsForPost(post, isEnglish)
  const primaryStat = stats[0]?.value ?? (isEnglish ? `${post.likeCount ?? 0} likes` : `좋아요 ${post.likeCount ?? 0}`)
  const detail = stats.length
    ? stats.map((item) => `${item.label} ${item.value}`).join(' · ')
    : content

  return {
    eyebrow: isEnglish ? 'Gym Community' : '운동 커뮤니티',
    title,
    metric: primaryStat,
    detail,
    footer: isEnglish ? 'Shared workout story' : '운동 공유 카드',
  }
}

function FeedCard({
  post,
  onToggleLike,
  onSubmitComment,
  onOpenImage,
  onSelectUser,
  onReportPost,
  onBlockUser,
  currentUserId,
}) {
  const { language, isEnglish } = useI18n()
  const [comment, setComment] = useState('')
  const [commentOpen, setCommentOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const comments = post.comments ?? []
  const photoUrls = getPostPhotoUrls(post)
  const storyMeta = getWorkoutStoryMeta(post, language, isEnglish)
  const workoutStats = getWorkoutStatsForPost(post, isEnglish)
  const authorName = shortUser(post.user_id, post.authorDisplayName, isEnglish)
  const authorLevel = post.authorLevel
    ? localizeLevelText(post.authorLevel, language)
    : isEnglish ? 'Level pending' : '레벨 미정'

  const submitComment = async (event) => {
    event.preventDefault()
    if (!comment.trim()) return
    await onSubmitComment?.(post.id, comment)
    setComment('')
    setCommentOpen(false)
  }

  const handleSharePost = async () => {
    await shareOrDownloadCard(
      getSharePayloadForPost(post, language, isEnglish),
      `gym-community-post-${post.id}.svg`,
    )
  }

  return (
    <article className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={() =>
            onSelectUser?.({
              user_id: post.user_id,
              display_name: post.authorDisplayName,
              avatar_emoji: post.authorAvatarEmoji,
              avatar_url: post.authorAvatarUrl,
              latest_level: post.authorLevel,
              latest_score: post.authorScore,
            })
          }
        >
          <UserAvatar
            className="h-12 w-12 rounded-2xl"
            imageUrl={post.authorAvatarUrl}
            fallback={post.authorAvatarEmoji || 'RUN'}
            alt={post.authorDisplayName || (isEnglish ? 'Author avatar' : '작성자 아바타')}
          />
          <div className="min-w-0">
            <span className="block truncate text-base font-black text-gray-950 dark:text-white">{authorName}</span>
            <span className="mt-1 inline-flex max-w-full rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              {authorLevel}
            </span>
          </div>
        </button>

        <div className="grid justify-items-end gap-1 text-right">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-200">
            {getTypeLabel(post.type, isEnglish)}
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            {formatDateTimeByLanguage(post.created_at, language, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {storyMeta ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
          {storyMeta}
        </div>
      ) : null}

      {!!workoutStats.length && (
        <div className="grid grid-cols-3 gap-2">
          {workoutStats.map((item) => (
            <span key={item.label} className="grid gap-1 rounded-2xl border border-gray-100 p-3 dark:border-white/10">
              <small className="text-xs font-black text-gray-700 dark:text-gray-200">{item.label}</small>
              <strong className="truncate text-sm font-black text-gray-950 dark:text-white">{item.value}</strong>
            </span>
          ))}
        </div>
      )}

      <p className="m-0 text-base font-semibold leading-7 text-gray-700 dark:text-gray-200">
        {getPostContent(post, language)}
      </p>

      {!!photoUrls.length && (
        <div className={`grid gap-2 ${photoUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {photoUrls.map((url, index) => (
            <button
              key={`${post.id}-photo-${index}`}
              type="button"
              className="group relative overflow-hidden rounded-2xl bg-gray-100 text-left dark:bg-white/10"
              onClick={() => onOpenImage(url)}
            >
              <OptimizedImage
                className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                imageUrl={url}
                preset="feedThumbnail"
                alt={isEnglish ? 'Workout proof' : '운동 인증 사진'}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                sizes="(max-width: 640px) 44vw, 260px"
              />
              <span className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-black text-gray-700 shadow-sm dark:bg-neutral-950/80 dark:text-white">
                {isEnglish ? 'View photo' : '사진 보기'}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-white/10">
        <button
          type="button"
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-black transition ${
            post.likedByMe
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
              : 'bg-gray-100 text-gray-700 hover:text-rose-500 dark:bg-white/10 dark:text-gray-100'
          }`}
          onClick={() => onToggleLike(post.id, post.likedByMe)}
          aria-pressed={post.likedByMe}
          data-testid={`feed-like-${post.id}`}
          aria-label={
            isEnglish
              ? `${post.likedByMe ? 'Unlike' : 'Like'} post. ${post.likeCount} likes`
              : `게시물 ${post.likedByMe ? '좋아요 취소' : '좋아요'}. 좋아요 ${post.likeCount}개`
          }
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 20.2s-7.2-4.3-9.1-8.5C1.4 8.4 3.4 5 6.8 5c1.9 0 3.4 1 4.2 2.4C11.8 6 13.3 5 15.2 5c3.4 0 5.4 3.4 3.9 6.7-1.9 4.2-7.1 8.5-7.1 8.5Z" />
          </svg>
          {isEnglish ? `Likes ${post.likeCount}` : `좋아요 ${post.likeCount}`}
        </button>

        <button
          type="button"
          className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
          onClick={() => {
            setCommentOpen((prev) => !prev)
            setMenuOpen(false)
          }}
          aria-expanded={commentOpen}
        >
          {commentOpen
            ? (isEnglish ? `Hide ${comments.length}` : `접기 ${comments.length}`)
            : (isEnglish ? `Replies ${comments.length}` : `댓글 ${comments.length}`)}
        </button>

        <button
          type="button"
          className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-emerald-800 dark:bg-white/10 dark:text-gray-100 dark:hover:text-emerald-300"
          onClick={handleSharePost}
        >
          {isEnglish ? 'Share card' : '공유 카드'}
        </button>

        {post.user_id !== currentUserId && (
          <div className="relative">
            <button
              type="button"
              className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              {menuOpen
                ? (isEnglish ? 'Close options' : '옵션 닫기')
                : (isEnglish ? 'Options' : '옵션')}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-10 grid w-36 gap-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-black text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10"
                  onClick={() => {
                    setMenuOpen(false)
                    onReportPost?.(post)
                  }}
                >
                  {isEnglish ? 'Report' : '신고'}
                </button>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-black text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  onClick={() => {
                    setMenuOpen(false)
                    onBlockUser?.(post.user_id, post.authorDisplayName)
                  }}
                >
                  {isEnglish ? 'Block' : '차단'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {commentOpen && (
        <form className="grid grid-cols-[1fr_auto] gap-2" onSubmit={submitComment}>
          <input
            className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-950 outline-none transition placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={isEnglish ? 'Comment' : '댓글'}
            maxLength={120}
          />
          <button type="submit" className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800">
            {isEnglish ? 'Post' : '등록'}
          </button>
        </form>
      )}

      {!!comments.length && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {comments.map((item) => (
            <li key={item.id} className="rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 dark:bg-white/10">
              <strong className="mr-2 font-black text-gray-950 dark:text-white">
                {shortUser(item.user_id, item.authorDisplayName, isEnglish)}
              </strong>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{item.content}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function FeedList({
  posts,
  onToggleLike,
  onSubmitComment,
  onReportPost,
  onBlockUser,
  loading,
  currentLevel,
  selectedUser,
  onClearSelectedUser,
  onSelectUser,
  followingIds = [],
  currentUserId,
}) {
  const { language, isEnglish } = useI18n()
  const [filter, setFilter] = useState('all')
  const [openImageUrl, setOpenImageUrl] = useState('')

  const visiblePosts = posts.filter((post) => {
    if (selectedUser?.user_id && post.user_id !== selectedUser.user_id) return false
    if (filter === 'all') return true
    if (filter === 'following') return post.user_id === currentUserId || followingIds.includes(post.user_id)
    if (filter === 'same_level') return Boolean(currentLevel) && post.authorLevel === currentLevel
    return post.type === filter
  })
  const emptyTitle = filter === 'following'
    ? (isEnglish ? 'No following posts yet.' : '팔로우 피드가 비었어요.')
    : (isEnglish ? 'Start the community with your first workout.' : '첫 기록으로 피드를 열어요.')
  const emptyBody = filter === 'following'
    ? (isEnglish ? 'Follow more people to build your crew feed.' : '마음에 드는 사람을 팔로우하면 여기가 채워져요.')
    : (isEnglish ? 'Save a workout, add a photo, or cheer on a teammate from here.' : '운동을 저장하면 응원과 댓글이 여기서 시작돼요.')

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
            {isEnglish ? 'Feed' : '피드'}
          </span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {isEnglish ? 'Community' : '커뮤니티'}
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
          {isEnglish ? `${visiblePosts.length} posts` : `${visiblePosts.length}개`}
        </span>
      </div>

      {selectedUser?.user_id && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-500/15">
          <strong className="min-w-0 truncate text-sm font-black text-emerald-900 dark:text-emerald-100">
            {isEnglish
              ? `${shortUser(selectedUser.user_id, selectedUser.display_name, isEnglish)}'s posts`
              : `${shortUser(selectedUser.user_id, selectedUser.display_name, isEnglish)}님의 게시물`}
          </strong>
          <button type="button" className="min-h-9 rounded-lg bg-white px-3 text-xs font-black text-emerald-700 shadow-sm dark:bg-neutral-900 dark:text-emerald-200" onClick={onClearSelectedUser}>
            {isEnglish ? 'All' : '전체'}
          </button>
        </div>
      )}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {(FILTERS[language] ?? FILTERS.ko).map((item) => {
          const isActive = filter === item.key

          return (
            <button
              key={item.key}
              type="button"
              className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-black transition ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'
              }`}
              onClick={() => setFilter(item.key)}
              aria-pressed={isActive}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="grid gap-3" aria-label={isEnglish ? 'Loading feed' : '피드 불러오는 중'}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-3xl bg-gray-100 dark:bg-white/10" />
          ))}
        </div>
      )}

      {!loading && !visiblePosts.length && (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            {filter === 'following'
              ? (isEnglish ? 'Following' : '팔로잉')
              : (isEnglish ? 'Feed' : '피드')}
          </span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">{emptyTitle}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{emptyBody}</p>
        </div>
      )}

      <div className="grid gap-4">
        {visiblePosts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            onToggleLike={onToggleLike}
            onSubmitComment={onSubmitComment}
            onOpenImage={setOpenImageUrl}
            onSelectUser={onSelectUser}
            onReportPost={onReportPost}
            onBlockUser={onBlockUser}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {openImageUrl && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenImageUrl('')}
        >
          <div className="grid max-h-[86dvh] w-full max-w-2xl gap-3 overflow-hidden rounded-3xl bg-white p-3 shadow-sm dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="justify-self-end rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-700 dark:bg-white/10 dark:text-gray-100" onClick={() => setOpenImageUrl('')}>
              {isEnglish ? 'Close' : '닫기'}
            </button>
            <img className="max-h-[72dvh] w-full rounded-2xl object-contain" src={openImageUrl} alt={isEnglish ? 'Expanded workout image' : '확대한 운동 이미지'} />
          </div>
        </div>
      )}
    </section>
  )
}
