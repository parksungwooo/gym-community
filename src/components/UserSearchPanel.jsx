import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function FollowButton({ isFollowing, disabled, onClick, isEnglish }) {
  return (
    <button
      type="button"
      className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${isFollowing ? 'bg-emerald-700 text-white shadow-sm' : 'border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-700/20 dark:text-emerald-200'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {isFollowing ? (isEnglish ? 'Following' : '팔로잉') : (isEnglish ? 'Follow' : '팔로우')}
    </button>
  )
}

export default function UserSearchPanel({
  query,
  onQueryChange,
  rows,
  loading,
  currentUserId,
  followingIds = [],
  actionLoading,
  onToggleFollow,
  onSelectUser,
}) {
  const { language, isEnglish } = useI18n()
  const trimmedQuery = query.trim()

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Search' : '검색'}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'People' : '사람 찾기'}</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{trimmedQuery ? (isEnglish ? `${rows.length} found` : `${rows.length}명`) : (isEnglish ? 'Nickname' : '닉네임')}</span>
      </div>

      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {isEnglish
          ? 'Search by nickname.'
          : '닉네임 검색'}
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={isEnglish ? 'Nickname' : '닉네임'}
        />
        {!!trimmedQuery && (
          <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={() => onQueryChange('')}>
            {isEnglish ? 'Clear' : '지우기'}
          </button>
        )}
      </div>

      {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{isEnglish ? 'Tip' : '팁'}</span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">{isEnglish ? 'Type 2+ characters.' : '2글자 이상 입력해요.'}</strong>
        </div>
      )}

      {loading && trimmedQuery.length >= 2 && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <span className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
                <div className="grid flex-1 gap-2">
                  <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                  <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && trimmedQuery.length >= 2 && !rows.length && (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{isEnglish ? 'No Match' : '없음'}</span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">{isEnglish ? 'No matching users.' : '일치하는 사람이 없어요.'}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{isEnglish ? 'Try another keyword.' : '다른 키워드로 찾아요.'}</p>
        </div>
      )}

      {!!rows.length && (
        <div className="grid gap-3">
          {rows.map((item) => {
            const isMe = item.user_id === currentUserId
            const isFollowing = followingIds.includes(item.user_id)

            return (
              <article key={item.user_id} className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
                <button type="button" className="min-w-0 text-left" onClick={() => onSelectUser?.(item)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      className="h-12 w-12 rounded-2xl"
                      imageUrl={item.avatar_url}
                      fallback={item.avatar_emoji || 'RUN'}
                      alt={item.display_name || (isEnglish ? 'Search result' : '검색 결과')}
                    />
                    <div>
                      <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{item.display_name}</strong>
                      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
                        {isEnglish
                          ? `${item.weekly_count} this week · ${item.total_workouts} total`
                          : `${item.weekly_count} 이번 주 · ${item.total_workouts} 누적`}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">
                    {item.latest_level ? localizeLevelText(item.latest_level, language) : isEnglish ? 'No level yet' : '레벨 없음'}
                  </span>
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">
                    {item.latest_score ? (isEnglish ? `${item.latest_score} pts` : `${item.latest_score}점`) : isEnglish ? 'No score' : '점수 없음'}
                  </span>
                </div>

                {!isMe && (
                  <FollowButton
                    isFollowing={isFollowing}
                    disabled={actionLoading}
                    isEnglish={isEnglish}
                    onClick={() => onToggleFollow?.(item.user_id, isFollowing)}
                  />
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
