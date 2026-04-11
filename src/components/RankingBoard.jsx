import { useMemo, useState } from 'react'
import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function getRankTone(index) {
  if (index === 0) return 'border-yellow-200 bg-yellow-50/80 text-yellow-900 dark:border-yellow-300/30 dark:bg-yellow-300/10 dark:text-yellow-100'
  if (index === 1) return 'border-gray-200 bg-gray-50/80 text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-gray-100'
  if (index === 2) return 'border-orange-200 bg-orange-50/80 text-orange-900 dark:border-orange-300/30 dark:bg-orange-300/10 dark:text-orange-100'
  return 'border-gray-100 bg-white text-gray-900 dark:border-white/10 dark:bg-neutral-900 dark:text-white'
}

function FollowButton({ isFollowing, disabled, onClick, isEnglish }) {
  return (
    <button
      type="button"
      className={`min-h-10 rounded-lg px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
        isFollowing
          ? 'bg-emerald-700 text-white shadow-sm'
          : 'border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200'
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {isFollowing ? (isEnglish ? 'Following' : '팔로잉') : (isEnglish ? 'Follow' : '팔로우')}
    </button>
  )
}

export default function RankingBoard({
  rows,
  loading,
  selectedUserId,
  onSelectUser,
  currentUserId,
  followingIds = [],
  onToggleFollow,
  actionLoading,
}) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const [expanded, setExpanded] = useState(false)
  const [timeframe, setTimeframe] = useState('week')
  const visibleRows = useMemo(() => (expanded ? rows : rows.slice(0, 3)), [expanded, rows])
  const topScore = rows[0]?.weekly_points ?? rows[0]?.total_xp ?? 0

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
            {t('랭킹', 'Ranking')}
          </span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {t('이번 주', 'This week')}
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
          {t(`1위 ${topScore}P`, `Top ${topScore} pts`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/10">
        {[
          ['week', t('주간', 'Weekly')],
          ['month', t('월간', 'Monthly')],
        ].map(([key, label]) => {
          const isActive = timeframe === key

          return (
            <button
              key={key}
              type="button"
              className={`min-h-10 rounded-lg px-3 text-sm font-black transition ${
                isActive
                  ? 'bg-white text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white'
                  : 'text-gray-700 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'
              }`}
              onClick={() => setTimeframe(key)}
              aria-pressed={isActive}
            >
              {label}
            </button>
          )
        })}
      </div>

      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {t(
          '이번 주 기록 기준이에요.',
          timeframe === 'week' ? 'Based on weekly activity points.' : 'Monthly view blends total XP with recent weekly points.',
        )}
      </p>

      {loading && (
        <div className="grid gap-3" aria-label={isEnglish ? 'Loading ranking' : '랭킹 불러오는 중'}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
          ))}
        </div>
      )}

      {!loading && !rows.length && (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
            {t('랭킹 대기 중', 'Ranking loading up')}
          </span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">
            {t('아직 랭킹이 비었어요.', 'Ranking is still empty.')}
          </strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t('첫 기록을 남기면 바로 채워져요.', 'Logs will show here.')}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {visibleRows.map((item, index) => {
          const isMe = item.user_id === currentUserId
          const isFollowing = followingIds.includes(item.user_id)
          const isSelected = selectedUserId === item.user_id

          return (
            <article
              key={item.user_id}
              className={`grid gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 ${getRankTone(index)} ${
                isSelected ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <button
                type="button"
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-left"
                onClick={() => onSelectUser?.(item)}
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/80 text-sm font-black text-gray-950 shadow-sm dark:bg-neutral-950/60 dark:text-white">
                  #{index + 1}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    className="h-12 w-12 rounded-2xl"
                    imageUrl={item.avatar_url}
                    fallback={item.avatar_emoji || 'RUN'}
                    alt={item.display_name || (isEnglish ? 'Ranked user' : '랭킹 사용자')}
                  />
                  <div className="min-w-0">
                    <strong className="block truncate text-base font-black">
                      {item.display_name}
                    </strong>
                    <p className="m-0 truncate text-xs font-bold text-gray-700 dark:text-gray-100">
                      {t(
                        `${item.weekly_points ?? 0}P · ${item.weekly_count ?? 0}회`,
                        `${item.weekly_points ?? 0} pts · ${item.weekly_count ?? 0} logs`,
                      )}
                    </p>
                  </div>
                </div>
                <div className="grid justify-items-end gap-1">
                  <strong className="text-sm font-black">{`Lv ${item.activity_level ?? 1}`}</strong>
                  <span className="max-w-24 truncate text-xs font-bold text-gray-700 dark:text-gray-100">
                    {item.latest_level
                      ? localizeLevelText(item.latest_level, language)
                      : t(`총 ${item.total_xp ?? 0} XP`, `${item.total_xp ?? 0} XP total`)}
                  </span>
                </div>
              </button>

              {!isMe && (
                <div className="flex justify-end">
                  <FollowButton
                    isFollowing={isFollowing}
                    disabled={actionLoading}
                    isEnglish={isEnglish}
                    onClick={() => onToggleFollow?.(item.user_id, isFollowing)}
                  />
                </div>
              )}
            </article>
          )
        })}
      </div>

      {!loading && rows.length > 3 && (
        <button
          type="button"
          className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? t('상위 3명', 'Top 3')
            : t(`전체 ${rows.length}`, `All ${rows.length}`)}
        </button>
      )}
    </section>
  )
}
