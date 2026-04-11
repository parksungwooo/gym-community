const STEPS = {
  ko: [
    ['1', '레벨 체크', '내 운동 기준을 잡아요.'],
    ['2', '기록하기', '종류와 시간만 남기면 돼요.'],
    ['3', '함께하기', '비슷한 페이스의 사람을 만나요.'],
  ],
  en: [
    ['1', 'Take the level test', 'Three minutes makes recommendations and level cards sharper.'],
    ['2', 'Log one workout', 'Type and time are enough to earn XP, streaks, and feed stories.'],
    ['3', 'Join the crew', 'Use rankings and feed posts to follow people at your pace.'],
  ],
}

export const ONBOARDING_STORAGE_KEY = 'gym-community-onboarding-seen'

export default function OnboardingCoach({
  open,
  isEnglish,
  onClose,
  onStartTest,
  onStartWorkout,
}) {
  if (!open) return null

  const steps = STEPS[isEnglish ? 'en' : 'ko']

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={isEnglish ? 'Getting started guide' : '시작 가이드'}
    >
      <section className="grid w-full max-w-3xl gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-900 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{isEnglish ? 'Start Here' : '시작 가이드'}</span>
          <button
            type="button"
            className="min-h-10 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onClose}
          >
            {isEnglish ? 'Later' : '나중에'}
          </button>
        </div>

        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {isEnglish ? 'One small action starts the loop.' : '오늘은 하나만 해도 충분해요.'}
          </h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {isEnglish
              ? 'Test, log, earn XP, then meet people at your pace.'
              : '기록하면 XP가 쌓이고, 피드에서 함께 움직일 사람이 보여요.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map(([number, title, body]) => (
            <article key={number} className="grid min-h-28 gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-sm font-black text-white">{number}</span>
              <strong className="text-base font-black leading-6 text-gray-950 dark:text-white">{title}</strong>
              <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{body}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
            onClick={onStartWorkout}
          >
            {isEnglish ? 'Log workout' : '바로 기록'}
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-gray-100 px-5 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onStartTest}
          >
            {isEnglish ? 'Level test' : '레벨 확인'}
          </button>
        </div>
      </section>
    </div>
  )
}
