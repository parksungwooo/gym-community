import { useMemo, useState } from 'react'
import UserAvatar from './UserAvatar'

const WORKOUT_OPTIONS = ['all', '러닝', '웨이트', '사이클', '스트레칭', '산책', '기타']

const TIME_SLOT_OPTIONS = [
  { value: 'weekday_morning', ko: '평일 아침', en: 'Weekday morning' },
  { value: 'weekday_evening', ko: '평일 저녁', en: 'Weekday evening' },
  { value: 'weekend_morning', ko: '주말 아침', en: 'Weekend morning' },
  { value: 'weekend_evening', ko: '주말 저녁', en: 'Weekend evening' },
  { value: 'flexible', ko: '시간 조율 가능', en: 'Flexible' },
]

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', ko: '초급', en: 'Beginner' },
  { value: 'steady', ko: '중급', en: 'Steady' },
  { value: 'intense', ko: '고강도', en: 'Intense' },
]

function formatTimeSlot(value, isEnglish) {
  const matched = TIME_SLOT_OPTIONS.find((item) => item.value === value)
  if (!matched) return value || (isEnglish ? 'Flexible' : '시간 조율 가능')
  return isEnglish ? matched.en : matched.ko
}

function formatDifficulty(value, isEnglish) {
  const matched = DIFFICULTY_OPTIONS.find((item) => item.value === value)
  if (!matched) return isEnglish ? 'Beginner' : '초급'
  return isEnglish ? matched.en : matched.ko
}

function formatMateDate(value, isEnglish) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value.slice(0, 10)
  }
}

function createInitialDraft() {
  return {
    title: '',
    workoutType: '러닝',
    locationLabel: '',
    timeSlot: 'weekday_evening',
    difficulty: 'beginner',
    capacity: 2,
    body: '',
  }
}

export default function MateBoard({
  isEnglish,
  posts = [],
  loading,
  actionLoading,
  currentUserId,
  onCreatePost,
  onToggleInterest,
  onToggleStatus,
  onSelectUser,
}) {
  const t = (ko, en) => (isEnglish ? en : ko)
  const [scope, setScope] = useState('open')
  const [workoutFilter, setWorkoutFilter] = useState('all')
  const [showComposer, setShowComposer] = useState(false)
  const [draft, setDraft] = useState(createInitialDraft)

  const filteredPosts = useMemo(() => {
    return posts.filter((item) => {
      const matchesScope = scope === 'all'
        || (scope === 'open' && item.status === 'open')
        || (scope === 'mine' && item.user_id === currentUserId)
        || (scope === 'closed' && item.status === 'closed')
      const matchesWorkout = workoutFilter === 'all' || item.workout_type === workoutFilter
      return matchesScope && matchesWorkout
    })
  }, [currentUserId, posts, scope, workoutFilter])

  const openCount = posts.filter((item) => item.status === 'open').length

  const handleDraftChange = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await onCreatePost?.(draft)
    if (result === false) return
    setDraft(createInitialDraft())
    setShowComposer(false)
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('메이트', 'Mates')}</span>
          <h2 className="m-0 text-xl font-black leading-tight text-gray-950 dark:text-white">{t('함께할 사람', 'Find a mate')}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">
            {isEnglish ? `${openCount} open` : `열림 ${openCount}`}
          </span>
          <button
            type="button"
            className={`min-h-10 rounded-lg px-3 text-xs font-black shadow-sm transition disabled:opacity-50 ${showComposer ? 'bg-emerald-700 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10'}`}
            onClick={() => setShowComposer((prev) => !prev)}
            disabled={actionLoading}
          >
            {showComposer ? t('닫기', 'Close') : t('글 쓰기', 'Post')}
          </button>
        </div>
      </div>

      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {t(
          '시간, 장소, 운동만 적어보세요.',
          'Time, place, workout.',
        )}
      </p>

      {showComposer && (
        <form className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-neutral-950" onSubmit={handleSubmit}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
              value={draft.title}
              onChange={(event) => handleDraftChange('title', event.target.value)}
              placeholder={t('예: 망원 저녁 러닝', 'ex: Evening run in Mangwon')}
              maxLength={60}
              required
            />
            <input
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
              value={draft.locationLabel}
              onChange={(event) => handleDraftChange('locationLabel', event.target.value)}
              placeholder={t('예: 망원동 / 합정역 근처', 'ex: Mangwon / near Hapjeong')}
              maxLength={40}
              required
            />
            <select
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
              value={draft.workoutType}
              onChange={(event) => handleDraftChange('workoutType', event.target.value)}
            >
              {WORKOUT_OPTIONS.filter((item) => item !== 'all').map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
              value={draft.timeSlot}
              onChange={(event) => handleDraftChange('timeSlot', event.target.value)}
            >
              {TIME_SLOT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {isEnglish ? item.en : item.ko}
                </option>
              ))}
            </select>
            <select
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
              value={draft.difficulty}
              onChange={(event) => handleDraftChange('difficulty', event.target.value)}
            >
              {DIFFICULTY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {isEnglish ? item.en : item.ko}
                </option>
              ))}
            </select>
            <input
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
              type="number"
              min="1"
              max="20"
              value={draft.capacity}
              onChange={(event) => handleDraftChange('capacity', event.target.value)}
              placeholder={t('모집 인원', 'Spots')}
            />
          </div>

          <textarea
            className="min-h-20 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
            rows="3"
            maxLength={180}
            value={draft.body}
            onChange={(event) => handleDraftChange('body', event.target.value)}
            placeholder={t('한 줄 소개', 'One short note')}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="submit" className="min-h-10 rounded-lg bg-emerald-700 px-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50" disabled={actionLoading}>
              {t('올리기', 'Post')}
            </button>
            <button
              type="button"
              className="min-h-10 rounded-lg bg-gray-100 px-3 text-xs font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
              onClick={() => {
                setDraft(createInitialDraft())
                setShowComposer(false)
              }}
              disabled={actionLoading}
            >
              {t('취소', 'Cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'open', label: t('모집 중', 'Open') },
            { key: 'mine', label: t('내 글', 'Mine') },
            { key: 'closed', label: t('마감', 'Closed') },
            { key: 'all', label: t('전체', 'All') },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-black transition ${scope === item.key ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
              onClick={() => setScope(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {WORKOUT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-black transition ${workoutFilter === item ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
              onClick={() => setWorkoutFilter(item)}
            >
              {item === 'all' ? t('운동 전체', 'All workouts') : item}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-3 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="grid flex-1 gap-2">
                  <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                  <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                </div>
              </div>
              <div className="flex gap-2">
                <span className="h-8 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
                <span className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !filteredPosts.length && (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-4 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{t('첫 모집글', 'First post')}</span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">{t('맞는 글이 없어요.', 'No matching posts.')}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t(
              '먼저 하나 올려보세요.',
              'Post one first.',
            )}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {filteredPosts.map((post) => {
          const isMine = post.user_id === currentUserId
          const isClosed = post.status === 'closed'
          const canShowInterest = !isMine && !isClosed

          return (
            <article key={post.id} className={`grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-neutral-950 ${isClosed ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2.5 text-left"
                  onClick={() => onSelectUser?.({
                    user_id: post.user_id,
                    display_name: post.display_name,
                    avatar_emoji: post.avatar_emoji,
                    avatar_url: post.avatar_url,
                  })}
                >
                  <UserAvatar
                    className="h-10 w-10 rounded-xl"
                    imageUrl={post.avatar_url}
                    fallback={post.avatar_emoji || 'RUN'}
                    alt={post.display_name || (isEnglish ? 'Mate author' : '메이트 작성자')}
                  />
                  <div className="min-w-0">
                    <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{post.display_name || (isEnglish ? 'Community member' : '커뮤니티 멤버')}</strong>
                    <span className="mt-0.5 block text-xs font-semibold text-gray-700 dark:text-gray-200">{isEnglish ? post.activity_level_label : `Lv ${post.activity_level ?? 1}`}</span>
                  </div>
                </button>

                <div className="flex flex-wrap justify-end gap-2">
                  {isMine && <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{t('내 글', 'Mine')}</span>}
                  <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${isClosed ? 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200'}`}>
                    {isClosed ? t('마감', 'Closed') : t('모집 중', 'Open')}
                  </span>
                </div>
              </div>

              <div className="grid gap-1">
                <h3 className="m-0 text-base font-black leading-6 text-gray-950 dark:text-white">{post.title}</h3>
                <p className="m-0 text-sm font-semibold leading-5 text-gray-700 dark:text-gray-200">{post.location_label}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{post.workout_type}</span>
                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{formatTimeSlot(post.time_slot, isEnglish)}</span>
                <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{formatDifficulty(post.difficulty, isEnglish)}</span>
                <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                  {isEnglish ? `${post.capacity} spots` : `${post.capacity}명 모집`}
                </span>
              </div>

              {post.body && (
                <p className="m-0 rounded-xl bg-white p-2.5 text-sm font-semibold leading-6 text-gray-800 dark:bg-white/10 dark:text-gray-100">{post.body}</p>
              )}

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="grid gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  <span>{formatMateDate(post.created_at, isEnglish)}</span>
                  <strong>{isEnglish ? `${post.interest_count} interested` : `관심 ${post.interest_count}`}</strong>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {canShowInterest && (
                    <button
                      type="button"
                      className={`min-h-10 rounded-lg px-3 text-xs font-black transition disabled:opacity-50 ${post.interested_by_me ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
                      disabled={actionLoading}
                      onClick={() => onToggleInterest?.(post.id, post.interested_by_me)}
                    >
                      {post.interested_by_me
                        ? t('취소', 'Undo')
                        : t('관심', 'Interest')}
                    </button>
                  )}

                  {isMine && !isClosed && (
                    <button
                      type="button"
                      className="min-h-10 rounded-lg bg-gray-100 px-3 text-xs font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
                      disabled={actionLoading}
                      onClick={() => onToggleStatus?.(post.id, 'closed')}
                    >
                      {t('마감', 'Close')}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
