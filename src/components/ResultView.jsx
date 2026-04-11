import { useI18n } from '../i18n.js'
import { getResultMessage, localizeLevelText } from '../utils/level'
import { shareOrDownloadCard } from '../utils/shareCard'

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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-12 w-12 fill-none stroke-current stroke-2">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6H5a3 3 0 0 0 3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 6h3a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v5" strokeLinecap="round" />
      <path d="M9 20h6" strokeLinecap="round" />
      <path d="M10 17h4" strokeLinecap="round" />
    </svg>
  )
}

export default function ResultView({ score, level, onStartWorkout }) {
  const { language, isEnglish } = useI18n()
  const levelValue = Number(String(level).match(/Lv(\d)/)?.[1] ?? 1)
  const message = getResultMessage(levelValue, language)
  const displayLevel = localizeLevelText(level, language)

  const handleShare = async () => {
    const shareText = isEnglish
      ? `My result: ${score} points, ${displayLevel}.`
      : `\uB0B4 \uACB0\uACFC: ${score}\uC810, ${displayLevel}.`

    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
      await shareOrDownloadCard({
        eyebrow: isEnglish ? 'Fitness Result' : '내 레벨',
        title: displayLevel,
        metric: isEnglish ? `${score} pts` : `${score}점`,
        detail: message,
        footer: isEnglish ? 'Level test complete' : '레벨 체크 완료',
      }, 'fitness-result-card.svg')
    } catch {
      alert(isEnglish ? 'Copy failed.' : '\uBCF5\uC0AC \uC2E4\uD328.')
    }
  }

  return (
    <section className="product-glass-card result-screen mx-auto grid w-full max-w-xl gap-5 rounded-[2rem] border border-white/70 bg-white/95 p-5 text-center text-slate-950 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-7">
      <div className="mx-auto grid justify-items-center gap-4">
        <div className="relative grid h-32 w-32 place-items-center">
          <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-burst" aria-hidden="true" />
          <span className="absolute inset-3 rounded-full bg-cyan-400/20 animate-burst [animation-delay:90ms]" aria-hidden="true" />
          <span className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-white shadow-2xl shadow-emerald-500/25 motion-safe:animate-levelUp">
            <TrophyIcon />
          </span>
          <span className="absolute -right-2 top-1 rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950 shadow-lg shadow-yellow-400/25 rotate-12 motion-safe:animate-float">
            LV.{levelValue}
          </span>
        </div>

        <div className="grid gap-2">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            {isEnglish ? 'Fitness Result' : '내 레벨'}
          </span>
          <h2 className="m-0 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {displayLevel}
          </h2>
          <p className="m-0 text-5xl font-black tracking-[-0.06em] text-emerald-600 sm:text-6xl">
            {isEnglish ? `${score} pts` : `${score}\uC810`}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-5">
        <p className="m-0 text-base font-extrabold leading-7 text-slate-700">
          {message}
        </p>
        <p className="mt-3 mb-0 text-sm font-semibold leading-6 text-slate-500">
          {isEnglish
            ? "Now turn this level into today's workout log."
            : '이제 오늘 운동 하나만 남겨볼까요?'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <button
          type="button"
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 text-base font-black text-slate-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleShare}
        >
          <ShareIcon />
          {isEnglish ? 'Share' : '결과 공유'}
        </button>
        <button
          type="button"
          className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-base font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-600"
          onClick={onStartWorkout}
        >
          <DumbbellIcon />
          {isEnglish ? 'Log workout' : '운동 기록'}
        </button>
      </div>
    </section>
  )
}
