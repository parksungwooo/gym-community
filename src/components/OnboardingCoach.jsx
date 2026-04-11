const STEPS = {
  ko: [
    ['1', '레벨 테스트', '3분만 답하면 오늘 추천 운동과 레벨 카드가 더 정확해져요.'],
    ['2', '운동 기록', '종류와 시간만 저장해도 XP, 스트릭, 피드가 자동으로 채워져요.'],
    ['3', '커뮤니티', '랭킹과 피드에서 비슷한 페이스의 사람을 팔로우해보세요.'],
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
    <div className="product-onboarding-backdrop" role="dialog" aria-modal="true" aria-label={isEnglish ? 'Getting started guide' : '시작 가이드'}>
      <section className="product-onboarding-card">
        <span className="product-pill">{isEnglish ? 'Welcome' : '첫 방문 가이드'}</span>
        <h2 className="mt-4 mb-2 text-3xl font-black tracking-[-0.06em] text-white">
          {isEnglish ? 'Turn one small log into momentum.' : '작은 기록 하나가 운동 루틴이 돼요.'}
        </h2>
        <p className="m-0 text-sm font-semibold leading-6 text-slate-300">
          {isEnglish
            ? 'Gym Community is built around test, log, XP, and people. Start with one action.'
            : 'Gym Community는 테스트, 기록, XP, 사람을 중심으로 돌아가요. 첫 행동 하나만 고르면 됩니다.'}
        </p>

        <div className="mt-5 grid gap-3">
          {steps.map(([number, title, body]) => (
            <article key={number} className="product-onboarding-step">
              <span className="product-onboarding-step-mark">{number}</span>
              <div>
                <strong className="block text-sm font-black text-white">{title}</strong>
                <p className="m-0 mt-1 text-sm font-semibold leading-5 text-slate-300">{body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            className="rounded-2xl bg-emerald-400 px-4 py-4 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-300"
            onClick={onStartWorkout}
          >
            {isEnglish ? 'Log workout' : '운동 기록'}
          </button>
          <button
            type="button"
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/15"
            onClick={onStartTest}
          >
            {isEnglish ? 'Level test' : '레벨 테스트'}
          </button>
          <button
            type="button"
            className="rounded-2xl px-4 py-4 text-sm font-black text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            {isEnglish ? 'Maybe later' : '나중에'}
          </button>
        </div>
      </section>
    </div>
  )
}
