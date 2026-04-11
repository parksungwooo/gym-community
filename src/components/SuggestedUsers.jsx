import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'

function buildReason(item, currentLevel, language) {
  if (currentLevel && item.latest_level === currentLevel) {
    return language === 'en'
      ? `Same ${localizeLevelText(currentLevel, language)}`
      : `${localizeLevelText(currentLevel, language)} 그룹`
  }

  if ((item.weekly_points ?? 0) >= 60) {
    return language === 'en' ? 'Active this week' : '이번 주 활발'
  }

  if ((item.weekly_count ?? 0) >= 4) {
    return language === 'en' ? 'Good rhythm' : '주간 페이스 유지'
  }

  if ((item.total_workouts ?? 0) >= 10) {
    return language === 'en' ? 'Building a habit' : '꾸준히 하는 중'
  }

  return language === 'en' ? 'Similar pace' : '비슷한 페이스'
}

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

function Insight({ label, value }) {
  return (
    <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <span className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200">{label}</span>
      <strong className="mt-1 block text-base font-black text-gray-950 dark:text-white">{value}</strong>
    </article>
  )
}

export default function SuggestedUsers({
  rows,
  currentLevel,
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

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('사람', 'People')}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('함께할 사람', 'Suggested people')}</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{isEnglish ? `${rows.length} picks` : `${rows.length}명 추천`}</span>
      </div>

      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {t(
          '비슷한 페이스부터 만나보세요.',
          'Start with a similar pace.',
        )}
      </p>

      {loading && (
        <div className="grid gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
              <div className="flex items-center gap-3">
                <span className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
                <div className="grid flex-1 gap-2">
                  <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                  <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                </div>
              </div>
              <div className="flex gap-2">
                <span className="h-8 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
                <span className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
                <span className="h-8 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !rows.length && (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{t('곧 채워져요', 'Coming soon')}</span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">{t('곧 맞는 사람이 보여요.', 'Suggestions appear here.')}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t(
              '기록이 쌓이면 비슷한 페이스를 찾아드릴게요.',
              'More logs will unlock suggestions.',
            )}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {rows.map((item) => {
          const isMe = item.user_id === currentUserId
          const isFollowing = followingIds.includes(item.user_id)
          const levelLabel = item.latest_level
            ? localizeLevelText(item.latest_level, language)
            : t('레벨 미정', 'Level pending')

          return (
            <article
              key={item.user_id}
              className={`grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950 ${
                selectedUserId === item.user_id ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectUser?.(item)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      className="h-12 w-12 rounded-2xl"
                      imageUrl={item.avatar_url}
                      fallback={item.avatar_emoji || 'RUN'}
                      alt={item.display_name || (isEnglish ? 'Suggested user' : '추천 사용자')}
                    />
                    <div className="min-w-0">
                      <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{item.display_name}</strong>
                      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{buildReason(item, currentLevel, language)}</p>
                    </div>
                  </div>
                </button>

                {!isMe && (
                  <FollowButton
                    isFollowing={isFollowing}
                    disabled={actionLoading}
                    isEnglish={isEnglish}
                    onClick={() => onToggleFollow?.(item.user_id, isFollowing)}
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{`Lv ${item.activity_level ?? 1}`}</span>
                <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                  {t(`${item.weekly_points ?? 0}P 이번 주`, `${item.weekly_points ?? 0} pts this week`)}
                </span>
                <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{levelLabel}</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Insight
                  label={t('이번 주 운동', 'This week')}
                  value={t(`${item.weekly_count ?? 0}회`, `${item.weekly_count ?? 0}`)}
                />
                <Insight
                  label={t('누적 운동', 'All-time')}
                  value={t(`${item.total_workouts ?? 0}회`, `${item.total_workouts ?? 0}`)}
                />
                <Insight
                  label={t('총 XP', 'Total XP')}
                  value={`${item.total_xp ?? 0} XP`}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
