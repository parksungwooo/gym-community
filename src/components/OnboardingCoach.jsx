const STEPS = {
  ko: [
    ['1', '레벨 체크', '3분이면 기준 끝.'],
    ['2', '오늘 운동', '뭘 할지 바로 보여줘요.'],
    ['3', 'XP 쌓기', '종류와 시간만 남겨요.'],
    ['4', '같이 가기', '피드에서 힘을 받아요.'],
  ],
  en: [
    ['1', 'Take the level test', 'Set your training baseline in three minutes.'],
    ['2', 'Get today’s workout', 'Recommendations adapt to your level and recent logs.'],
    ['3', 'Log and grow', 'Type and time are enough to earn XP and protect streaks.'],
    ['4', 'Keep going together', 'Find people at your pace through feed and rankings.'],
  ],
}

const LOOP_PROMISE = {
  ko: ['테스트', '오늘 운동', 'XP/스트릭', '피드 공유'],
  en: ['Test', 'Today workout', 'XP/Streak', 'Feed story'],
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
  const loopPromise = LOOP_PROMISE[isEnglish ? 'en' : 'ko']

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-label={isEnglish ? 'Getting started guide' : '시작 가이드'}
    >
      <section className="grid w-full max-w-3xl gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-900 sm:gap-6 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200">{isEnglish ? 'Start Here' : '시작 가이드'}</span>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onClose}
          >
            {isEnglish ? 'Later' : '나중에'}
          </button>
        </div>

        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white sm:text-3xl">
            {isEnglish
              ? 'Know today’s workout fast.'
              : '오늘 뭐 할지 바로 보여드릴게요.'}
          </h2>
          <p className="m-0 text-base font-semibold leading-7 text-gray-800 dark:text-gray-100">
            {isEnglish
              ? 'Test, train, earn XP, share progress.'
              : '체크하고, 운동하고, XP 쌓고, 자랑해요.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-3 dark:bg-white/10 sm:grid-cols-4">
          {loopPromise.map((item, index) => (
            <span key={item} className="flex min-h-11 items-center justify-center rounded-lg bg-white px-3 text-center text-xs font-black text-gray-800 shadow-sm dark:bg-neutral-950 dark:text-gray-100">
              {index + 1}. {item}
            </span>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
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
            onClick={onStartTest}
          >
            {isEnglish ? 'Start level test' : '레벨 체크 시작'}
          </button>
          <button
            type="button"
            className="min-h-12 rounded-lg bg-gray-100 px-5 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
            onClick={onStartWorkout}
          >
            {isEnglish ? 'Log today’s workout' : '오늘 운동 기록'}
          </button>
        </div>
      </section>
    </div>
  )
}
