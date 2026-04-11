import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { localizeLevelText } from '../utils/level'
import { isProMember } from '../utils/premium'

function StatChip({ label, value }) {
  return (
    <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <span className="block text-xs font-black uppercase text-gray-700 dark:text-gray-200">{label}</span>
      <strong className="mt-1 block text-base font-black text-gray-950 dark:text-white">{value}</strong>
    </article>
  )
}

export default function PublicProfileCard({
  profile,
  loading,
  isFollowing,
  isMe,
  isBlocked,
  actionLoading,
  onToggleFollow,
  onReport,
  onToggleBlock,
  onClear,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const isProfilePro = isProMember(profile)

  if (!profile && !loading) return null

  const statItems = [
    {
      label: t('활동', 'Activity'),
      value: `Lv ${profile?.activity_level ?? 1}`,
    },
    {
      label: t('이번 주', 'This week'),
      value: isEnglish ? `${profile?.weekly_count ?? 0} logs` : `${profile?.weekly_count ?? 0}회`,
    },
    {
      label: t('연속', 'Streak'),
      value: isEnglish ? `${profile?.streak_days ?? 0} days` : `${profile?.streak_days ?? 0}일`,
    },
    {
      label: t('팔로워', 'Followers'),
      value: String(profile?.follower_count ?? 0),
    },
    {
      label: t('체력', 'Level'),
      value: profile?.latest_level ? localizeLevelText(profile.latest_level, language) : t('아직 없음', 'No level yet'),
    },
    {
      label: t('총 XP', 'XP'),
      value: `${profile?.total_xp ?? 0} XP`,
    },
  ]

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      {loading ? (
        <div className="grid gap-3">
          <div className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
            <div className="flex items-center gap-3">
              <span className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />
              <div className="grid flex-1 gap-2">
                <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <UserAvatar
                className="h-16 w-16 rounded-3xl"
                imageUrl={profile?.avatar_url}
                fallback={profile?.avatar_emoji || 'RUN'}
                alt={profile?.display_name || (isEnglish ? 'Public profile' : '공개 프로필')}
              />
              <div className="grid min-w-0 gap-1">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('프로필', 'Profile')}</span>
                <h2 className="m-0 truncate text-2xl font-black leading-tight text-gray-950 dark:text-white">{profile?.display_name}</h2>
                <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
                  {profile?.bio?.trim()
                    ? profile.bio
                    : t('소개가 아직 없어요.', 'No intro yet.')}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isProfilePro && (
                <span className="min-h-11 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm">
                  {t('Pro 멤버', 'Pro member')}
                </span>
              )}
              {!isMe && (
                <>
                  <button
                    type="button"
                    className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${isFollowing ? 'bg-emerald-700 text-white shadow-sm' : 'border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-700/20 dark:text-emerald-200'}`}
                    onClick={onToggleFollow}
                    disabled={actionLoading || isBlocked}
                  >
                    {isFollowing ? (isEnglish ? 'Following' : '팔로잉') : (isEnglish ? 'Follow' : '팔로우')}
                  </button>
                  <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onReport} disabled={actionLoading}>
                    {isEnglish ? 'Report' : '신고'}
                  </button>
                  <button
                    type="button"
                    className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${isBlocked ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
                    onClick={onToggleBlock}
                    disabled={actionLoading}
                  >
                    {isBlocked ? (isEnglish ? 'Unblock' : '차단 해제') : (isEnglish ? 'Block' : '차단')}
                  </button>
                </>
              )}
              <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClear}>
                {t('닫기', 'Close')}
              </button>
            </div>
          </div>

          {!!profile?.fitness_tags?.length && (
            <div className="flex flex-wrap gap-2">
              {profile.fitness_tags.map((tag) => (
                <span key={tag} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{tag}</span>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {statItems.map((item) => (
              <StatChip key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t(
              '아래에는 이 사람 글만 보여요.',
              'The feed below shows only this person.',
            )}
          </p>
        </>
      )}
    </section>
  )
}
