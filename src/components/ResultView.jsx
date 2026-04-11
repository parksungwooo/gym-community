import { useI18n } from '../i18n.js'
import { getResultMessage, localizeLevelText } from '../utils/level'
import { PREMIUM_CONTEXT } from '../utils/premium'
import { shareToKakao } from '../utils/kakaoShare'

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M18 8a3 3 0 1 0-2.83-4" strokeLinecap="round" />
      <path d="M6 15a3 3 0 1 0 2.83 4" strokeLinecap="round" />
      <path d="M8.7 14.2 15.3 9.8" strokeLinecap="round" />
      <path d="M15.3 14.2 8.7 9.8" strokeLinecap="round" />
    </svg>
  )
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M4 10v4" strokeLinecap="round" />
      <path d="M8 8v8" strokeLinecap="round" />
      <path d="M16 8v8" strokeLinecap="round" />
      <path d="M20 10v4" strokeLinecap="round" />
      <path d="M8 12h8" strokeLinecap="round" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-11 w-11 fill-none stroke-current stroke-2">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H5a3 3 0 0 0 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6h3a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v5" strokeLinecap="round" />
      <path d="M9 20h6" strokeLinecap="round" />
      <path d="M10 17h4" strokeLinecap="round" />
    </svg>
  )
}

export default function ResultView({ score, level, isPro = false, onOpenPaywall, onStartWorkout }) {
  const { language, isEnglish } = useI18n()
  const levelValue = Number(String(level).match(/Lv(\d)/)?.[1] ?? 1)
  const message = getResultMessage(levelValue, language)
  const displayLevel = localizeLevelText(level, language)

  const handleShare = async () => {
    const shareText = isEnglish
      ? `My result: ${score} points, ${displayLevel}.`
      : `내 결과: ${score}점, ${displayLevel}.`

    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
      await shareToKakao({
        isPremium: isPro,
        isEnglish,
        contentType: 'level_result',
        filename: 'fitness-result-kakao-card.png',
        payload: {
          eyebrow: isEnglish ? 'Fitness Result' : '내 레벨',
          title: displayLevel,
          metric: isEnglish ? `${score} pts` : `${score}점`,
          detail: message,
          footer: isPro
            ? (isEnglish ? 'Premium level card' : '프리미엄 레벨 카드')
            : (isEnglish ? 'Level test complete' : '레벨 체크 완료'),
        },
      })
    } catch {
      alert(isEnglish ? 'Copy failed.' : '복사 실패.')
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-xl gap-6 rounded-3xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="mx-auto grid justify-items-center gap-4">
        <div className="relative grid h-28 w-28 place-items-center rounded-3xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-700/20 dark:text-emerald-200 dark:ring-emerald-400/20">
          <TrophyIcon />
          <span className="absolute -right-2 -top-2 rounded-lg bg-yellow-300 px-3 py-1 text-xs font-black text-gray-950 shadow-sm">
            LV.{levelValue}
          </span>
        </div>

        <div className="grid gap-2">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">
            {isEnglish ? 'Fitness Result' : '내 레벨'}
          </span>
          <h2 className="m-0 text-3xl font-black leading-tight text-gray-950 dark:text-white sm:text-4xl">
            {displayLevel}
          </h2>
          <p className="m-0 text-5xl font-black leading-none text-emerald-800 dark:text-emerald-200 sm:text-6xl">
            {isEnglish ? `${score} pts` : `${score}점`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 border-y border-gray-100 py-5 dark:border-white/10">
        <p className="m-0 text-base font-extrabold leading-7 text-gray-700 dark:text-gray-200">
          {message}
        </p>
        <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
          {isEnglish
            ? "Now turn this level into today's workout log."
            : '이제 오늘 운동 하나만 남겨볼까요?'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10"
          onClick={handleShare}
        >
          <ShareIcon />
          {isEnglish ? 'Share' : '결과 공유'}
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
          onClick={onStartWorkout}
        >
          <DumbbellIcon />
          {isEnglish ? 'Log workout' : '운동 기록'}
        </button>
      </div>
      {!isPro && (
        <button
          type="button"
          className="min-h-11 rounded-lg bg-emerald-50 px-4 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 dark:bg-emerald-700/20 dark:text-emerald-200"
          onClick={() => onOpenPaywall?.(PREMIUM_CONTEXT.SHARE_CARDS)}
        >
          {isEnglish ? 'Make this a Pro image card' : '이 결과를 Pro 이미지 카드로 만들기'}
        </button>
      )}
    </section>
  )
}
