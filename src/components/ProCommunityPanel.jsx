import UserAvatar from './UserAvatar'
import { useI18n } from '../i18n.js'
import { PREMIUM_CONTEXT, isProMember } from '../utils/premium'

function ProLockedPanel({ onOpenPaywall }) {
  const { isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)

  return (
    <section className="grid gap-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/20 dark:bg-neutral-900 sm:p-6">
      <div className="grid gap-2">
        <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">Pro Club</span>
        <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
          {t('진짜 꾸준한 사람들끼리 모이는 공간', 'A tighter club for people who keep showing up')}
        </h2>
        <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">
          {t(
            'Pro 배지, 전용 리더보드, 비공개 소모임으로 운동을 더 오래 이어가게 만듭니다.',
            'Pro badges, a dedicated leaderboard, and private circles help consistency last longer.',
          )}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [t('Pro 배지', 'Pro badge'), t('프로필과 피드에서 신뢰도 상승', 'Higher trust on profile and feed')],
          [t('전용 리더보드', 'Pro leaderboard'), t('광고 없이 진짜 활동량으로 경쟁', 'Compete by real activity without feed ads')],
          [t('비공개 챌린지', 'Private challenges'), t('친구끼리만 주간 목표 운영', 'Run weekly goals with friends only')],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <strong className="text-base font-black text-gray-950 dark:text-white">{title}</strong>
            <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{body}</p>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
        onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.PRO_COMMUNITY)}
      >
        {t('Pro 커뮤니티 열기', 'Unlock Pro Club')}
      </button>
    </section>
  )
}

export default function ProCommunityPanel({
  isPro,
  rows,
  currentUserId,
  onSelectUser,
  onOpenPaywall,
}) {
  const { isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const proRows = rows.filter((item) => isProMember(item) || item.user_id === currentUserId).slice(0, 5)
  const visibleRows = proRows.length ? proRows : rows.slice(0, 3)

  if (!isPro) {
    return <ProLockedPanel onOpenPaywall={onOpenPaywall} />
  }

  return (
    <section className="grid gap-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-400/20 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">Pro Club</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {t('Pro 전용 리더보드', 'Pro leaderboard')}
          </h2>
        </div>
        <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">PRO</span>
      </div>

      <div className="grid gap-3">
        {visibleRows.map((item, index) => (
          <button
            key={item.user_id}
            type="button"
            className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-neutral-950"
            onClick={() => onSelectUser?.(item)}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 text-sm font-black text-white">#{index + 1}</span>
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                className="h-12 w-12 rounded-2xl"
                imageUrl={item.avatar_url}
                fallback={item.avatar_emoji || 'PRO'}
                alt={item.display_name || (isEnglish ? 'Pro member' : 'Pro 멤버')}
              />
              <div className="min-w-0">
                <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{item.display_name || t('Pro 멤버', 'Pro member')}</strong>
                <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">PRO</span>
              </div>
            </div>
            <div className="grid justify-items-end gap-1 text-right">
              <strong className="text-sm font-black text-gray-950 dark:text-white">{item.weekly_points ?? 0}P</strong>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t(`${item.weekly_count ?? 0}회`, `${item.weekly_count ?? 0} logs`)}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
          <strong className="text-base font-black text-gray-950 dark:text-white">{t('비공개 4주 챌린지', 'Private 4-week challenge')}</strong>
          <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t('친구 5명까지 초대해 주간 목표와 랭킹을 따로 운영하세요.', 'Invite up to five friends and run a private weekly board.')}
          </p>
        </article>
        <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
          <strong className="text-base font-black text-gray-950 dark:text-white">{t('광고 없는 피드', 'Ad-free feed')}</strong>
          <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t('운동 인증과 응원만 남겨 집중도를 유지합니다.', 'Keeps the feed focused on proof and encouragement.')}
          </p>
        </article>
      </div>
    </section>
  )
}
