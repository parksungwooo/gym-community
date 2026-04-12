import { useEffect, useMemo, useState } from 'react'
import { formatDateTimeByLanguage, getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { buildWeeklyLeague } from '../features/league/leagueRules.js'
import { PARTY_MAX_MEMBERS } from '../features/party/partyRules.js'
import { getProHomeNudge, getProMissionPreview } from '../features/pro/proStrategy.js'
import { XP_RULE_TYPES, getXpAmountByType } from '../features/xp/xpRules.js'
import { getTodayWorkoutRecommendation } from '../features/workout/recommendations'
import { localizeLevelText } from '../utils/level'
import OptimizedImage from './OptimizedImage'
import TodayWorkoutRecommendationCard from './TodayWorkoutRecommendationCard'
import UserAvatar from './UserAvatar'

const QUICK_WORKOUT_PRESETS = [
  { key: 'walk', name: { ko: '빠른 걷기', en: 'Fast walk' }, workoutType: '걷기', durationMinutes: 15, iconType: 'walk' },
  { key: 'run', name: { ko: '러닝', en: 'Run' }, workoutType: '러닝', durationMinutes: 25, iconType: 'run' },
  { key: 'strength', name: { ko: '웨이트', en: 'Strength' }, workoutType: '웨이트', durationMinutes: 35, iconType: 'strength' },
  { key: 'mobility', name: { ko: '스트레칭', en: 'Mobility' }, workoutType: '스트레칭', durationMinutes: 12, iconType: 'mobility' },
]

const LEAGUE_TIER_RANK = {
  bronze: 1,
  silver: 2,
  gold: 3,
  diamond: 4,
}

function getDisplayText(value, language = 'ko', fallback = '') {
  if (value && typeof value === 'object') {
    return value[language] ?? value.ko ?? value.en ?? fallback
  }

  return value ?? fallback
}

function clampPercent(value) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(parsed, 100))
}

function MiniMetricCard({ label, value, detail, accent = false, featured = false, warning = false }) {
  const toneClasses = warning
    ? 'border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-500/15'
    : accent
      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20'
      : 'border-gray-100 bg-white dark:border-white/10 dark:bg-neutral-900'
  const labelClasses = warning
    ? 'text-rose-700 dark:text-rose-200'
    : accent
      ? 'text-emerald-800 dark:text-emerald-200'
      : 'text-gray-700 dark:text-gray-200'

  return (
    <article className={`grid ${featured ? 'min-h-28' : 'min-h-24'} gap-1 rounded-3xl border p-3 shadow-sm sm:p-4 ${toneClasses}`}>
      <span className={`text-[11px] font-black uppercase leading-4 ${labelClasses}`}>
        {label}
      </span>
      <strong className={`${featured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'} font-black leading-tight text-gray-950 dark:text-white`}>
        {value}
      </strong>
      {detail ? <span className="text-xs font-bold leading-4 text-gray-700 dark:text-gray-200">{detail}</span> : null}
    </article>
  )
}

function QuestRow({ title, detail, reward, progressLabel, progressPercent, complete, urgent }) {
  return (
    <li className={`grid gap-3 rounded-2xl border p-4 ${
      complete
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20'
        : urgent
          ? 'border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-500/15'
          : 'border-gray-100 bg-white dark:border-white/10 dark:bg-neutral-950'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong className="text-base font-black text-gray-950 dark:text-white">{title}</strong>
          <span className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{detail}</span>
        </div>
        <span className={`grid h-8 min-w-8 place-items-center rounded-full text-xs font-black ${
          complete
            ? 'bg-emerald-700 text-white'
            : urgent
              ? 'bg-rose-600 text-white'
              : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'
        }`}>
          {complete ? 'OK' : reward}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          <div className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-700' : 'bg-emerald-500'}`} style={{ width: `${clampPercent(progressPercent)}%` }} />
        </div>
        <span className="text-xs font-black text-gray-700 dark:text-gray-200">{progressLabel}</span>
      </div>
    </li>
  )
}

function DailyQuestCard({ quests, isEnglish, loading, onPrimaryAction }) {
  const completeCount = quests.filter((quest) => quest.complete).length
  const allDone = completeCount === quests.length

  return (
    <section className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" aria-label={isEnglish ? 'Daily quests' : '오늘의 미션'}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
            {isEnglish ? 'Daily quests' : '오늘의 미션'}
          </span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {allDone ? (isEnglish ? 'All clear. Nice streak.' : '오늘 미션 클리어') : (isEnglish ? 'Clear these today' : '오늘은 이것만 해요')}
          </h2>
        </div>
        <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
          {completeCount}/{quests.length}
        </span>
      </div>

      <ul className="m-0 grid list-none gap-3 p-0">
        {quests.map((quest) => (
          <QuestRow key={quest.key} {...quest} />
        ))}
      </ul>

      <button
        type="button"
        className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onPrimaryAction}
        disabled={loading || allDone}
      >
        {allDone
          ? (isEnglish ? 'Come back tomorrow' : '내일 또 이어가요')
          : (isEnglish ? 'Clear mission now' : '미션 완료하고 XP 받기')}
      </button>
    </section>
  )
}

function formatLeagueResetLabel(resetAt, language = 'ko') {
  return formatDateTimeByLanguage(resetAt, language, {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLeagueTimeLeft(resetAt, isEnglish) {
  const remainingMs = Math.max(new Date(resetAt).getTime() - Date.now(), 0)
  const totalHours = Math.floor(remainingMs / 3600000)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days > 0) {
    return isEnglish ? `${days}d ${hours}h left` : `${days}일 ${hours}시간 남음`
  }

  const minutes = Math.max(1, Math.floor((remainingMs % 3600000) / 60000))

  return isEnglish ? `${hours}h ${minutes}m left` : `${hours}시간 ${minutes}분 남음`
}

function getLeagueSnapshot(league) {
  return {
    rank: league.rank,
    tierKey: league.tier.key,
    weeklyXp: league.currentUser.weekly_points,
  }
}

function readStoredLeagueSnapshot(storageKey) {
  if (typeof window === 'undefined') return null

  const rawSnapshot = window.localStorage.getItem(storageKey)
  if (!rawSnapshot) return null

  try {
    return JSON.parse(rawSnapshot)
  } catch {
    return null
  }
}

function useLeagueMotion(league) {
  const storageKey = `gym-community:league:${league.weekKey}:${league.currentUser.user_id}`
  const previousSnapshot = readStoredLeagueSnapshot(storageKey)

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(storageKey, JSON.stringify(getLeagueSnapshot(league)))
  }, [league, storageKey])

  return useMemo(() => {
    if (!previousSnapshot) {
      return { rankDelta: 0, tierDelta: 0, xpDelta: 0, moved: false, upgraded: false }
    }

    const rankDelta = Number(previousSnapshot.rank) - Number(league.rank)
    const tierDelta = (LEAGUE_TIER_RANK[league.tier.key] ?? 0) - (LEAGUE_TIER_RANK[previousSnapshot.tierKey] ?? 0)
    const xpDelta = Number(league.currentUser.weekly_points) - Number(previousSnapshot.weeklyXp ?? league.currentUser.weekly_points)

    return {
      rankDelta,
      tierDelta,
      xpDelta,
      moved: rankDelta !== 0,
      upgraded: tierDelta > 0,
    }
  }, [league.currentUser.weekly_points, league.rank, league.tier.key, previousSnapshot])
}

function LeagueTierIcon({ tierKey, className = '' }) {
  const baseClass = `h-16 w-16 ${className}`

  if (tierKey === 'diamond') {
    return (
      <svg className={baseClass} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M14 21 24 9h16l10 12-18 34Z" className="fill-cyan-200" />
        <path d="M14 21h36L32 55Z" className="fill-emerald-300" />
        <path d="M24 9 32 21 40 9" className="fill-cyan-400" />
        <path d="M14 21h36M24 9h16l10 12-18 34-18-34Z" className="fill-none stroke-white/90 stroke-[3]" />
      </svg>
    )
  }

  if (tierKey === 'gold') {
    return (
      <svg className={baseClass} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="22" className="fill-yellow-300" />
        <circle cx="32" cy="32" r="15" className="fill-amber-500" />
        <path d="m32 18 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" className="fill-white/90" />
      </svg>
    )
  }

  if (tierKey === 'silver') {
    return (
      <svg className={baseClass} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="22" className="fill-gray-200" />
        <circle cx="32" cy="32" r="15" className="fill-gray-400" />
        <path d="M22 36h20M24 28h16" className="fill-none stroke-white stroke-[5] stroke-linecap-round" />
      </svg>
    )
  }

  return (
    <svg className={baseClass} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="22" className="fill-orange-500" />
      <circle cx="32" cy="32" r="15" className="fill-amber-800" />
      <path d="M23 39c3-10 15-10 18 0" className="fill-none stroke-white stroke-[5] stroke-linecap-round" />
      <path d="M24 25h16" className="fill-none stroke-white stroke-[5] stroke-linecap-round" />
    </svg>
  )
}

function LeagueProgressBar({ label, value, target, colorClass = 'bg-emerald-300', caption }) {
  const progress = target > 0 ? clampPercent((value / target) * 100) : 100

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase text-gray-100">{label}</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-950">
          {value}/{target} XP
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${progress}%` }} />
      </div>
      {caption ? <span className="text-xs font-bold text-gray-100">{caption}</span> : null}
    </div>
  )
}

function LeagueWidget({ league, isEnglish, language, onSeeCommunity }) {
  const t = (ko, en) => (isEnglish ? en : ko)
  const motion = useLeagueMotion(league)
  const [timeLeft, setTimeLeft] = useState(() => formatLeagueTimeLeft(league.resetAt, isEnglish))
  const tierLabel = league.tier.label[language] ?? league.tier.label.ko
  const nextTierLabel = league.tier.nextTier?.label?.[language] ?? league.tier.nextTier?.label?.ko
  const cutoffTarget = Math.max(league.topTenCutoffXp, league.currentUser.weekly_points, 1)
  const nextTierTarget = league.tier.nextTier?.minWeeklyXp ?? Math.max(league.currentUser.weekly_points, 1)
  const rewardPreview = league.isTopTen
    ? t(`결산 보상 +${league.rewardXp} XP · 챔피언 배지`, `End-week reward +${league.rewardXp} XP · champion badge`)
    : t(`상위 10% 진입 시 +80 XP와 희귀 배지`, `Top 10% unlocks +80 XP and rare badge`)
  const topTargetCopy = league.isChampion
    ? t('이번 주 챔피언 자리예요.', 'You are the weekly champion.')
    : league.isTopTen
      ? t(`상위 10% 보상권. 결산 보상 +${league.rewardXp} XP`, `Top 10% reward zone. +${league.rewardXp} XP`)
      : t(`상위 10%까지 ${league.xpToTopTen} XP`, `${league.xpToTopTen} XP to top 10%`)

  useEffect(() => {
    const updateTimeLeft = () => setTimeLeft(formatLeagueTimeLeft(league.resetAt, isEnglish))
    updateTimeLeft()
    const timerId = window.setInterval(updateTimeLeft, 60000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [isEnglish, league.resetAt])

  return (
    <section className={`relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gray-950 p-5 text-white shadow-sm sm:p-6 ${
      motion.upgraded ? 'motion-safe:animate-pulse ring-2 ring-emerald-300' : ''
    }`} aria-label={t('주간 리그', 'Weekly league')}>
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400" aria-hidden="true" />
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-5">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className={`grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br ${league.tier.accentClass} shadow-lg shadow-black/20 ${
            motion.upgraded ? 'motion-safe:animate-bounce' : ''
          }`}>
            <LeagueTierIcon tierKey={league.tier.key} />
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="w-fit rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-black uppercase text-emerald-950">
                {t('주간 리그', 'Weekly league')}
              </span>
              {league.isProLeague ? (
                <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase text-gray-950">
                  {t('Pro 보상 1.5배', 'Pro reward 1.5x')}
                </span>
              ) : null}
              <span className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-gray-100">
                {timeLeft}
              </span>
              {motion.moved ? (
                <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${
                  motion.rankDelta > 0
                    ? 'bg-emerald-300 text-emerald-950 motion-safe:animate-pulse'
                    : 'bg-rose-400 text-rose-950 motion-safe:animate-pulse'
                }`}>
                  {motion.rankDelta > 0
                    ? t(`순위 +${motion.rankDelta}`, `Rank +${motion.rankDelta}`)
                    : t(`순위 ${motion.rankDelta}`, `Rank ${motion.rankDelta}`)}
                </span>
              ) : null}
              {motion.upgraded ? (
                <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-950 motion-safe:animate-pulse">
                  {t('리그 승급!', 'League up!')}
                </span>
              ) : null}
            </div>
            <div>
              <h2 className="m-0 text-3xl font-black leading-tight text-white">
                {league.isChampion ? t('이번 주 챔피언', 'Weekly champion') : `${tierLabel} League`}
              </h2>
              <p className="m-0 mt-2 text-base font-black leading-7 text-emerald-100">{topTargetCopy}</p>
            </div>
          </div>

          <div className="grid justify-items-start gap-1 rounded-3xl border border-white/10 bg-white/10 p-4 text-left sm:justify-items-end sm:text-right">
            <span className="text-xs font-black uppercase text-emerald-100">{t('현재 순위', 'Current rank')}</span>
            <strong className="text-4xl font-black leading-none text-white">#{league.rank}</strong>
            <span className="text-xs font-bold text-gray-100">
              {t(`${league.participantCount}명 중`, `of ${league.participantCount}`)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <LeagueProgressBar
            label={t('상위 10% 컷', 'Top 10% cut')}
            value={league.currentUser.weekly_points}
            target={cutoffTarget}
            colorClass="bg-emerald-300"
            caption={league.isTopTen
              ? t('보상권 안에 들어왔어요. 끝까지 지키면 됩니다.', 'You are in the reward zone. Hold it.')
              : t(`${league.xpToTopTen} XP만 더 쌓으면 보상권이에요.`, `${league.xpToTopTen} XP to the reward zone.`)}
          />
          <LeagueProgressBar
            label={nextTierLabel ? t(`${nextTierLabel} 승급`, `${nextTierLabel} promotion`) : t('최고 리그', 'Top league')}
            value={league.currentUser.weekly_points}
            target={nextTierTarget}
            colorClass="bg-cyan-300"
            caption={nextTierLabel
              ? t(`${nextTierLabel}까지 ${league.tier.xpToNextTier} XP`, `${league.tier.xpToNextTier} XP to ${nextTierLabel}`)
              : t('Diamond 리그를 유지 중이에요.', 'Diamond league is secured.')}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 text-center text-gray-950">
            <span className="block text-xs font-black uppercase text-emerald-800">{t('남은 XP', 'XP left')}</span>
            <strong className="mt-1 block text-xl font-black">{league.xpToTopTen}</strong>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center text-gray-950">
            <span className="block text-xs font-black uppercase text-emerald-800">{t('컷', 'Cut')}</span>
            <strong className="mt-1 block text-xl font-black">{league.topTenCutoffXp} XP</strong>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center text-gray-950">
            <span className="block text-xs font-black uppercase text-emerald-800">{t('보상', 'Reward')}</span>
            <strong className="mt-1 block text-xl font-black">+{league.rewardXp}</strong>
          </div>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300 text-2xl font-black text-emerald-950 shadow-sm">
              #1
            </div>
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-100">{t('이번 주 챔피언', 'Champion')}</span>
              <strong className="text-xl font-black leading-tight text-white">{league.leader.display_name}</strong>
              <span className="text-sm font-bold text-gray-100">{league.leader.weekly_points} XP</span>
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl bg-gray-950/50 p-4">
            <span className="text-xs font-black uppercase text-emerald-200">{t('보상 미리보기', 'Reward preview')}</span>
            <strong className="text-base font-black text-white">{rewardPreview}</strong>
            <p className="m-0 text-xs font-semibold leading-5 text-gray-100">
              {t(
                `월요일 00시 리셋 · 결산 ${formatLeagueResetLabel(league.resetAt, language)}`,
                `Monday 00:00 reset · Ends ${formatLeagueResetLabel(league.resetAt, language)}`,
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="min-h-12 rounded-lg bg-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-200"
          onClick={onSeeCommunity}
        >
          {t('전체 리그 보기', 'Open full league')}
        </button>
      </div>
    </section>
  )
}

function formatPartyNumber(value) {
  const number = Number(value) || 0
  if (number >= 1000000) return `${Math.round(number / 100000) / 10}M`
  if (number >= 1000) return `${Math.round(number / 100) / 10}K`
  return String(number)
}

function PartyProgressBar({ label, value, target, caption, complete }) {
  const progress = clampPercent((Number(value) / Math.max(Number(target), 1)) * 100)

  return (
    <div className={`grid gap-2 rounded-2xl border p-4 ${
      complete
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20'
        : 'border-gray-100 bg-white dark:border-white/10 dark:bg-neutral-950'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <strong className="text-sm font-black text-gray-950 dark:text-white">{label}</strong>
          {caption ? <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{caption}</span> : null}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${
          complete ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'
        }`}>
          {formatPartyNumber(value)}/{formatPartyNumber(target)}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
        <div className={`h-full rounded-full transition-all duration-700 ${complete ? 'bg-emerald-700' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function PartyMemberRow({ member, index, isEnglish }) {
  return (
    <article className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-white/10">
      <UserAvatar
        className="h-10 w-10 rounded-2xl"
        imageUrl={member.avatar_url}
        fallback={member.avatar_emoji || 'RUN'}
        alt={member.display_name || (isEnglish ? 'Party member' : '파티원')}
      />
      <div className="min-w-0">
        <strong className="block truncate text-sm font-black text-gray-950 dark:text-white">{member.display_name}</strong>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
          {isEnglish ? `${member.weekly_count} logs` : `${member.weekly_count}회 기록`}
        </span>
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-800 shadow-sm dark:bg-neutral-950 dark:text-gray-100">
        #{index + 1} · {member.weekly_points} XP
      </span>
    </article>
  )
}

function PartyWidget({
  partySnapshot,
  inviteCandidates = [],
  isEnglish,
  language,
  onCreateParty,
  onInvitePartyMember,
  onSharePartyInvite,
}) {
  const t = (ko, en) => (isEnglish ? en : ko)
  const party = partySnapshot?.party
  const members = partySnapshot?.members ?? []
  const levelLabel = partySnapshot?.level?.label?.[language] ?? partySnapshot?.level?.label?.ko ?? 'Spark Crew'

  if (!party) {
    return (
      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" aria-label={t('파티', 'Party')}>
        <div className="grid gap-2">
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200">
            {t('파티', 'Party')}
          </span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {t('혼자 말고 같이 쌓아요', 'Turn solo training into a crew game')}
          </h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {t('최대 6명이 함께 주간 미션을 밀고, 같은 보상을 받아요.', 'Up to 6 members push weekly missions and earn the same rewards.')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('공동 미션', 'Shared missions')}</span>
            <strong className="mt-1 block text-base font-black text-gray-950 dark:text-white">
              {t('100회 기록 · 500,000 XP', '100 logs · 500,000 XP')}
            </strong>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-700/20">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('공동 보상', 'Shared reward')}</span>
            <strong className="mt-1 block text-base font-black text-gray-950 dark:text-white">
              {t('모두 XP + 희귀 배지', 'XP for all + rare badge')}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
          onClick={onCreateParty}
        >
          {t('파티 만들기', 'Create party')}
        </button>
      </section>
    )
  }

  const topMembers = [...members].sort((left, right) => right.weekly_points - left.weekly_points).slice(0, 3)
  const rewardMission = partySnapshot.missions.find((mission) => mission.complete) ?? partySnapshot.missions[0]

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" aria-label={t('파티', 'Party')}>
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200">
            {t('파티 미션', 'Party mission')}
          </span>
          <div>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{party.name}</h2>
            <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {t(`Lv.${partySnapshot.level.value} ${levelLabel} · ${members.length}/${PARTY_MAX_MEMBERS}명`, `Lv.${partySnapshot.level.value} ${levelLabel} · ${members.length}/${PARTY_MAX_MEMBERS}`)}
            </p>
          </div>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gray-950 text-center text-lg font-black text-white shadow-sm dark:bg-white dark:text-gray-950">
          P{partySnapshot.level.value}
        </div>
      </div>

      <div className="grid gap-3">
        {partySnapshot.missions.map((mission) => (
          <PartyProgressBar
            key={mission.type}
            label={mission.title[language] ?? mission.title.ko}
            value={mission.value}
            target={mission.target}
            complete={mission.complete}
            caption={mission.complete
              ? t(`완료! 모두 +${mission.rewardXp} XP`, `Cleared! +${mission.rewardXp} XP for everyone`)
              : t(`달성 시 모두 +${mission.rewardXp} XP · ${mission.badgeKey}`, `Reward: +${mission.rewardXp} XP for everyone · ${mission.badgeKey}`)}
          />
        ))}
      </div>

      <div className="grid gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('기여도 TOP', 'Top contributors')}</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-100">
            {formatPartyNumber(partySnapshot.totalWeeklyXp)} XP
          </span>
        </div>
        <div className="grid gap-2">
          {topMembers.map((member, index) => (
            <PartyMemberRow key={member.user_id} member={member} index={index} isEnglish={isEnglish} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-700/20">
        <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('보상 미리보기', 'Reward preview')}</span>
        <strong className="text-base font-black leading-6 text-gray-950 dark:text-white">
          {t(
            `공동 목표 달성 시 전원 +${rewardMission?.rewardXp ?? 80} XP와 파티 배지`,
            `Clear together: +${rewardMission?.rewardXp ?? 80} XP each and a party badge`,
          )}
        </strong>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onInvitePartyMember}
          disabled={members.length >= PARTY_MAX_MEMBERS}
        >
          {inviteCandidates.length
            ? t(`${inviteCandidates[0].display_name} 초대`, `Invite ${inviteCandidates[0].display_name}`)
            : t('파티 초대하기', 'Invite party')}
        </button>
        <button
          type="button"
          className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
          onClick={onSharePartyInvite}
        >
          {t('초대 링크 공유', 'Share invite')}
        </button>
      </div>
    </section>
  )
}

function ProGrowthWidget({
  nudge,
  missions = [],
  isPro,
  isEnglish,
  onOpenPaywall,
}) {
  if (!nudge) return null
  const t = (ko, en) => (isEnglish ? en : ko)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gray-950 p-5 text-white shadow-sm sm:p-6" aria-label="Pro growth">
      <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400" aria-hidden="true" />
      <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="grid gap-2">
            <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase text-emerald-100">
              {nudge.badge}
            </span>
            <h2 className="m-0 text-2xl font-black leading-tight text-white sm:text-3xl">{nudge.title}</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-100">{nudge.body}</p>
            {nudge.bonusCallout ? (
              <p className="m-0 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-black leading-6 text-emerald-50">
                {nudge.bonusCallout}
              </p>
            ) : null}
          </div>
          {isPro ? (
            <span className="grid min-h-12 place-items-center rounded-lg bg-emerald-300 px-5 text-sm font-black text-emerald-950 shadow-sm">
              {nudge.ctaLabel}
            </span>
          ) : (
            <button
              type="button"
              className="min-h-12 rounded-lg bg-emerald-300 px-5 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-200"
              onClick={() => onOpenPaywall?.(nudge.context)}
            >
              {nudge.ctaLabel}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {nudge.metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur">
              <span className="block text-[11px] font-black uppercase text-emerald-100">{metric.label}</span>
              <strong className="mt-1 block text-xl font-black leading-tight text-white">{metric.value}</strong>
            </article>
          ))}
        </div>

        {!isPro ? (
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase text-emerald-100">Pro preview</span>
              {nudge.secondaryCtaLabel ? (
                <button
                  type="button"
                  className="min-h-10 rounded-lg bg-white/10 px-3 text-xs font-black text-gray-100 transition hover:bg-white/15"
                  onClick={() => onOpenPaywall?.(nudge.secondaryContext ?? nudge.context)}
                >
                  {nudge.secondaryCtaLabel}
                </button>
              ) : null}
            </div>
            <div className="grid gap-2 rounded-2xl bg-gray-950/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-white">Free</span>
                <span className="text-sm font-black text-gray-100">{t('기록 + 기본 XP', 'Log + base XP')}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-300 px-3 py-2 text-emerald-950">
                <span className="text-sm font-black">Pro</span>
                <span className="text-sm font-black">{t('AI 플랜 + 리그 1.5배 + 파티 보너스', 'AI plan + 1.5x league + party bonus')}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {missions.map((mission) => (
                <article key={mission.key} className="rounded-2xl bg-gray-950/60 p-3">
                  <strong className="block text-sm font-black text-white">{mission.titleText}</strong>
                  <span className="mt-1 block text-xs font-bold leading-5 text-gray-100">{mission.rewardText}</span>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function QuickWorkoutIcon({ type }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  }

  if (type === 'strength') {
    return (
      <svg {...commonProps}>
        <path d="M4 10v4" />
        <path d="M8 8v8" />
        <path d="M16 8v8" />
        <path d="M20 10v4" />
        <path d="M8 12h8" />
      </svg>
    )
  }

  if (type === 'mobility') {
    return (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M6 9c2 2 4 3 6 3s4-1 6-3" />
        <path d="M7 19c1.6-2.5 3.2-3.8 5-3.8s3.4 1.3 5 3.8" />
      </svg>
    )
  }

  if (type === 'run') {
    return (
      <svg {...commonProps}>
        <path d="M13 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="m7 21 3-6" />
        <path d="m14 21-2-5-3-2 2-5 3 2 3 1" />
        <path d="m5 11 4-2" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M7 19c1.5-3 3.2-4.5 5-4.5S15.5 16 17 19" />
      <path d="M8 7h8" />
      <path d="M9 7c-.8 2-1.2 4-1.2 6" />
      <path d="M15 7c.8 2 1.2 4 1.2 6" />
    </svg>
  )
}

function getIconType(workoutType) {
  if (workoutType === '웨이트') return 'strength'
  if (workoutType === '스트레칭' || workoutType === '요가' || workoutType === '필라테스') return 'mobility'
  if (workoutType === '러닝') return 'run'
  return 'walk'
}

function QuickWorkoutCard({ item, language, isEnglish, onStart }) {
  const title = getDisplayText(item.name, language, item.workoutType)
  const workoutType = item.workout_type ?? item.workoutType
  const duration = Number(item.duration_minutes ?? item.durationMinutes) || 20

  return (
    <button
      type="button"
      className="grid min-h-28 gap-3 rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-white/10 dark:bg-neutral-900"
      onClick={() => onStart?.({
        ...item,
        name: title,
        workoutType,
        durationMinutes: duration,
      })}
      aria-label={isEnglish ? `Start ${title} for ${duration} minutes` : `${title} ${duration}분 시작`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2">
        <QuickWorkoutIcon type={item.iconType ?? getIconType(workoutType)} />
      </span>
      <span className="text-base font-black leading-6 text-gray-950 dark:text-white">{title}</span>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{isEnglish ? `${duration} min` : `${duration}분`}</span>
    </button>
  )
}

function getHomeFeedPhotoUrl(post) {
  if (Array.isArray(post?.metadata?.photoUrls) && post.metadata.photoUrls.length > 0) {
    return post.metadata.photoUrls[0]
  }

  return post?.metadata?.photoUrl ?? null
}

function getHomeFeedMeta(post, language, isEnglish) {
  if (post?.type === 'challenge_complete') return isEnglish ? 'Challenge complete' : '주간 목표 완료'
  if (post?.type === 'level_up') return isEnglish ? 'Level up' : '레벨업'
  if (post?.type !== 'workout_complete') return isEnglish ? 'Community update' : '커뮤니티 소식'

  const workoutType = getWorkoutTypeLabel(post?.metadata?.workoutType, language)
  const duration = Number(post?.metadata?.durationMinutes)
  const parts = [workoutType]

  if (Number.isFinite(duration) && duration > 0) {
    parts.push(isEnglish ? `${duration} min` : `${duration}분`)
  }

  return parts.join(' • ')
}

function getHomeFeedCopy(post, language, isEnglish) {
  if (post?.content?.trim()) return post.content

  if (post?.type === 'workout_complete') {
    return isEnglish
      ? `${getWorkoutTypeLabel(post?.metadata?.workoutType, language)} session saved.`
      : `${getWorkoutTypeLabel(post?.metadata?.workoutType, language)} 운동을 완료했어요.`
  }

  if (post?.type === 'challenge_complete') return isEnglish ? 'Weekly challenge cleared.' : '주간 목표를 달성했어요.'
  if (post?.type === 'level_up') return isEnglish ? 'Shared a level-up moment.' : '레벨업 순간을 공유했어요.'

  return isEnglish ? 'Shared a fresh progress update.' : '새로운 성장 기록을 공유했어요.'
}

function HomeFeedPreviewCard({ post, sourceLabel, onSelectUser, onSeeCommunity }) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const authorName = post.authorDisplayName || t('게스트', 'Guest')
  const authorLevel = post.authorLevel
    ? localizeLevelText(post.authorLevel, language)
    : t('레벨 대기', 'Level pending')
  const photoUrl = getHomeFeedPhotoUrl(post)
  const storyMeta = getHomeFeedMeta(post, language, isEnglish)
  const content = getHomeFeedCopy(post, language, isEnglish)

  return (
    <article className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
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
              activity_level: post.activity_level ?? null,
              activity_level_label: post.activity_level_label ?? null,
              total_xp: post.total_xp ?? 0,
              weekly_points: post.weekly_points ?? 0,
            })}
        >
          <UserAvatar
            className="h-12 w-12 rounded-2xl"
            imageUrl={post.authorAvatarUrl}
            fallback={post.authorAvatarEmoji || 'RUN'}
            alt={post.authorDisplayName || t('작성자 아바타', 'Author avatar')}
          />
          <div className="min-w-0">
            <strong className="block truncate text-base font-black text-gray-950 dark:text-white">{authorName}</strong>
            <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">
              {authorLevel}
            </span>
          </div>
        </button>

        <div className="grid justify-items-end gap-1 text-right">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-200">{sourceLabel}</span>
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

      {photoUrl ? (
        <div className="overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/10">
          <OptimizedImage
            className="aspect-[4/3] w-full object-cover"
            imageUrl={photoUrl}
            preset="feedThumbnail"
            alt={t('운동 인증 사진 미리보기', 'Workout proof preview')}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 720px) 92vw, 420px"
          />
        </div>
      ) : null}

      <div className="grid gap-2">
        <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">{storyMeta}</span>
        <p className="m-0 text-base font-semibold leading-7 text-gray-800 dark:text-gray-100">{content}</p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
        <div className="flex flex-wrap gap-2 text-xs font-black text-gray-700 dark:text-gray-200">
          <span>{t(`좋아요 ${post.likeCount ?? 0}`, `${post.likeCount ?? 0} likes`)}</span>
          <span>{t(`댓글 ${post.comments?.length ?? 0}`, `${post.comments?.length ?? 0} comments`)}</span>
        </div>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
          onClick={onSeeCommunity}
        >
          {t('열기', 'Open')}
        </button>
      </div>
    </article>
  )
}

export default function HomeDashboard({
  profile,
  todayDone,
  currentLevel,
  stats,
  challenge,
  activitySummary,
  leaderboard = [],
  currentUserId,
  partySnapshot,
  partyInviteCandidates = [],
  homeInsight,
  reminder,
  reminderPermission,
  feedPreview = {},
  routineTemplates = [],
  workoutHistory = [],
  workoutLoading,
  celebration,
  isPro = false,
  onOpenWorkoutComposer,
  onCompleteRecommendedWorkout,
  onStartRoutine,
  onOpenTest,
  onSeeCommunity,
  onSelectFeedPreviewUser,
  onRequestReminderPermission,
  onCreateParty,
  onInvitePartyMember,
  onSharePartyInvite,
  onOpenPaywall,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const weeklyGoal = challenge?.goal ?? profile?.weekly_goal ?? 4
  const weeklyCount = challenge?.current ?? stats.weeklyCount ?? 0
  const goalProgress = clampPercent(challenge?.progress ?? ((weeklyCount / Math.max(weeklyGoal, 1)) * 100))
  const activityLevelProgress = clampPercent(activitySummary?.progressPercent ?? 0)
  const todayXp = Number(activitySummary?.todayXp) || 0
  const streak = Number(activitySummary?.currentStreak ?? stats.streak ?? 0) || 0
  const currentLevelLabel = currentLevel
    ? localizeLevelText(currentLevel, language)
    : t('레벨 대기', 'Level pending')
  const todayRecommendation = getTodayWorkoutRecommendation({
    currentLevel,
    activitySummary,
    stats,
    todayDone,
    workoutHistory,
    weeklyGoal,
    isPremium: isPro,
    language,
    isEnglish,
  })
  const weeklyLeague = buildWeeklyLeague({
    leaderboard,
    currentUserId,
    profile,
    activitySummary,
    stats,
    isProLeague: isPro,
  })
  const proHomeNudge = getProHomeNudge({
    isPro,
    weeklyLeague,
    partySnapshot,
    activitySummary,
    language,
  })
  const proMissionPreview = getProMissionPreview(language)
  const recommendedXp = Number(todayRecommendation?.estimatedXp) || 30
  const dailyMissionXp = getXpAmountByType(todayRecommendation?.xpAward, XP_RULE_TYPES.DAILY_MISSION)
  const weeklyGoalXp = getXpAmountByType(todayRecommendation?.xpAward, XP_RULE_TYPES.WEEKLY_GOAL)
  const nextWeeklyCount = Math.min(weeklyCount + (todayDone ? 0 : 1), weeklyGoal)
  const streakAtRisk = streak > 0 && !todayDone
  const dailyQuests = [
    {
      key: 'log-today',
      title: todayDone ? t('오늘 운동 기록 완료', 'Workout logged today') : t('운동 1회 기록하기', 'Log one workout'),
      detail: todayDone
        ? t(`오늘 이미 +${Math.max(todayXp, recommendedXp)} XP를 챙겼어요.`, `You already earned +${Math.max(todayXp, recommendedXp)} XP today.`)
        : t(`${todayRecommendation.summary}로 바로 끝낼 수 있어요.`, `${todayRecommendation.summary} gets it done.`),
      reward: `+${recommendedXp}`,
      progressLabel: todayDone ? '1/1' : '0/1',
      progressPercent: todayDone ? 100 : 0,
      complete: Boolean(todayDone),
      urgent: streakAtRisk,
    },
    {
      key: 'week-goal',
      title: weeklyCount >= weeklyGoal ? t('이번 주 목표 완료', 'Weekly goal complete') : t('이번 주 목표 한 칸 채우기', 'Fill one weekly goal slot'),
      detail: weeklyCount >= weeklyGoal
        ? t('이번 주 루프는 이미 완성됐어요.', 'This week is already locked in.')
        : t(`저장하면 ${nextWeeklyCount}/${weeklyGoal}까지 올라가요.`, `Saving moves you to ${nextWeeklyCount}/${weeklyGoal}.`),
      reward: weeklyGoalXp > 0 ? `+${weeklyGoalXp}` : (dailyMissionXp > 0 ? `+${dailyMissionXp}` : `${nextWeeklyCount}/${weeklyGoal}`),
      progressLabel: `${weeklyCount}/${weeklyGoal}`,
      progressPercent: goalProgress,
      complete: weeklyCount >= weeklyGoal,
      urgent: false,
    },
  ]
  const topRoutine = routineTemplates[0] ?? null
  const topRoutineName = getDisplayText(topRoutine?.name, language, t('저장 루틴', 'Saved routine'))
  const quickWorkouts = [
    {
      key: 'recommended-today',
      name: todayRecommendation.title,
      workoutType: todayRecommendation.workoutType,
      durationMinutes: todayRecommendation.durationMinutes,
      iconType: getIconType(todayRecommendation.workoutType),
      note: '',
    },
    ...routineTemplates.slice(0, 1).map((routine, index) => {
      const routineName = getDisplayText(routine.name, language, t('저장 루틴', 'Saved routine'))

      return {
        ...routine,
        key: `routine-${routine.id ?? routineName ?? index}`,
        name: routineName,
        durationMinutes: routine.duration_minutes ?? routine.durationMinutes ?? 20,
        workoutType: routine.workout_type ?? routine.workoutType ?? '운동',
        iconType: 'strength',
      }
    }),
    ...QUICK_WORKOUT_PRESETS,
  ].slice(0, 4)
  const featuredFeedSection =
    (feedPreview.following?.length ? { label: t('팔로잉', 'Following'), items: feedPreview.following } : null)
    ?? (feedPreview.recommended?.length ? { label: t('추천', 'Recommended'), items: feedPreview.recommended } : null)
    ?? (feedPreview.popular?.length ? { label: t('인기', 'Popular'), items: feedPreview.popular } : null)
    ?? { label: t('피드', 'Feed'), items: [] }
  const featuredPost = featuredFeedSection.items[0] ?? null
  const emptyFeedAction = !currentLevel
    ? { label: t('레벨 체크하기', 'Take level test'), onClick: onOpenTest }
    : { label: t('커뮤니티 보기', 'Open community'), onClick: onSeeCommunity }
  const reminderDue = reminder?.enabled && !todayDone

  const completeRecommendation = (recommendation) => {
    onCompleteRecommendedWorkout?.({
      workoutType: recommendation.workoutType,
      durationMinutes: recommendation.durationMinutes,
      note: recommendation.note,
      shareToFeed: profile?.default_share_to_feed !== false,
      source: 'today_recommendation',
    })
  }

  const customizeRecommendation = (recommendation) => {
    onStartRoutine?.({
      name: recommendation.title,
      workoutType: recommendation.workoutType,
      durationMinutes: recommendation.durationMinutes,
      note: '',
    })
  }

  return (
    <section className="grid gap-6">
      <TodayWorkoutRecommendationCard
        recommendation={todayRecommendation}
        completed={todayDone}
        celebration={celebration}
        isPro={isPro}
        loading={workoutLoading}
        profile={profile}
        activitySummary={activitySummary}
        weeklyCount={weeklyCount}
        weeklyGoal={weeklyGoal}
        onComplete={completeRecommendation}
        onCustomize={customizeRecommendation}
        onOpenPaywall={onOpenPaywall}
        onSeeCommunity={onSeeCommunity}
      />

      <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label={t('오늘 요약', 'Today summary')}>
        <MiniMetricCard
          label={t('스트릭', 'Streak')}
          value={t(`${streak}일`, `${streak}d`)}
          detail={streakAtRisk ? t('오늘 끊길 수 있어요', 'At risk today') : t('계속 가요', 'Keep going')}
          featured
          warning={streakAtRisk}
        />
        <MiniMetricCard
          label={t('오늘 XP', 'Today XP')}
          value={`+${todayXp}`}
          detail="XP"
          accent
        />
        <MiniMetricCard
          label={t('이번 주', 'This week')}
          value={`${weeklyCount}/${weeklyGoal}`}
          detail={`${goalProgress}%`}
        />
      </section>

      {streakAtRisk ? (
        <section className="grid gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm dark:border-rose-400/30 dark:bg-rose-500/15 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-200">{t('스트릭 경고', 'Streak alert')}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t(`${streak}일 스트릭, 오늘 지켜야 해요`, `${streak}-day streak needs you today`)}
            </h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {t(`짧게만 기록해도 ${streak + 1}일로 이어져요.`, `A quick save extends it to ${streak + 1} days.`)}
            </p>
          </div>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-rose-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-rose-700"
            onClick={() => completeRecommendation(todayRecommendation)}
            disabled={workoutLoading}
          >
            {t('스트릭 지키기', 'Save streak')}
          </button>
        </section>
      ) : null}

      <DailyQuestCard
        quests={dailyQuests}
        isEnglish={isEnglish}
        loading={workoutLoading}
        onPrimaryAction={() => completeRecommendation(todayRecommendation)}
      />

      <LeagueWidget
        league={weeklyLeague}
        isEnglish={isEnglish}
        language={language}
        onSeeCommunity={onSeeCommunity}
      />

      <PartyWidget
        partySnapshot={partySnapshot}
        inviteCandidates={partyInviteCandidates}
        isEnglish={isEnglish}
        language={language}
        onCreateParty={onCreateParty}
        onInvitePartyMember={onInvitePartyMember}
        onSharePartyInvite={onSharePartyInvite}
      />

      <ProGrowthWidget
        nudge={proHomeNudge}
        missions={proMissionPreview}
        isPro={isPro}
        isEnglish={isEnglish}
        onOpenPaywall={onOpenPaywall}
      />

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('빠른 기록', 'Quick log')}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {todayDone ? t('하나 더 해도 좋아요', 'One more if you want') : t('바로 시작해요', 'Start now')}
            </h2>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onOpenWorkoutComposer}
            data-testid="home-log-workout"
          >
            {t('직접 기록', 'Custom')}
          </button>
        </div>

        {homeInsight ? (
          <div className="grid gap-1 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{homeInsight.label}</span>
            <strong className="text-base font-black text-gray-950 dark:text-white">{homeInsight.title}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{homeInsight.body}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickWorkouts.map((item) => (
            <QuickWorkoutCard
              key={item.key}
              item={item}
              language={language}
              isEnglish={isEnglish}
              onStart={onStartRoutine}
            />
          ))}
        </div>

        <div className="grid gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-5 dark:border-white/10 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{t('레벨 진행', 'Level progress')}</span>
              <strong className="text-xl font-black text-gray-950 dark:text-white">{currentLevelLabel}</strong>
            </div>
            <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
              {`${activityLevelProgress}%`}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${activityLevelProgress}%` }} />
          </div>
        </div>

        {topRoutine ? (
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-700/20 dark:text-emerald-200"
            onClick={() => onStartRoutine?.({ ...topRoutine, name: topRoutineName })}
          >
            {t(`자주 하는 ${topRoutineName} 시작`, `Start ${topRoutineName}`)}
          </button>
        ) : !currentLevel ? (
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-700/20 dark:text-emerald-200"
            onClick={onOpenTest}
          >
            {t('3분 레벨 체크하기', 'Take 3-min level test')}
          </button>
        ) : null}

        {reminderDue ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/15">
            <div className="grid gap-1">
              <strong className="text-sm font-black text-gray-950 dark:text-white">
                {reminder?.due ? t('지금 한 번만 남겨요', 'Time to log today') : t(`알림 ${reminder?.reminderTimeLabel}`, `Reminder ${reminder?.reminderTimeLabel}`)}
              </strong>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {reminder?.due ? t('짧게만 해도 스트릭은 이어져요.', 'A quick save keeps the streak alive.') : t('정한 시간에 알려드릴게요.', 'Your reminder is set.')}
              </span>
            </div>
            {reminderPermission !== 'granted' && reminderPermission !== 'unsupported' ? (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-white px-3 text-sm font-black text-gray-800 shadow-sm transition hover:text-gray-950 dark:bg-neutral-900 dark:text-gray-100 dark:hover:text-white"
                onClick={onRequestReminderPermission}
              >
                {t('알림 켜기', 'Enable')}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{t('커뮤니티', 'Community')}</span>
            <h3 className="m-0 mt-1 text-2xl font-black leading-tight text-gray-950 dark:text-white">{t('오늘의 자극', 'A story worth opening')}</h3>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onSeeCommunity}
          >
            {t('피드 보기', 'Open feed')}
          </button>
        </div>

        {featuredPost ? (
          <HomeFeedPreviewCard
            post={featuredPost}
            sourceLabel={featuredFeedSection.label}
            onSelectUser={onSelectFeedPreviewUser}
            onSeeCommunity={onSeeCommunity}
          />
        ) : (
          <div className="grid gap-3 rounded-3xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
            <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{t('피드', 'Feed')}</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white">{t('아직 조용해요', 'Feed is quiet for now')}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {t('운동 하나면 공유할 기록이 생겨요.', 'One workout gives you something to share.')}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
                onClick={() => completeRecommendation(todayRecommendation)}
                disabled={workoutLoading}
              >
                {t('오늘 운동 완료', 'Complete today workout')}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
                onClick={emptyFeedAction.onClick}
              >
                {emptyFeedAction.label}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}
