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
    <div className="product-onboarding-backdrop" role="dialog" aria-modal="true" aria-label={isEnglish ? 'Getting started guide' : '시작 가이드'}>
      <section className="product-onboarding-card compact">
        <div className="product-onboarding-head">
          <span className="product-pill">{isEnglish ? 'Start Here' : '시작 가이드'}</span>
          <button type="button" className="product-onboarding-close" onClick={onClose}>
            {isEnglish ? 'Later' : '나중에'}
          </button>
        </div>

        <h2>{isEnglish ? 'One small action starts the loop.' : '오늘은 하나만 해도 충분해요.'}</h2>
        <p>
          {isEnglish
            ? 'Test, log, earn XP, then meet people at your pace.'
            : '기록하면 XP가 쌓이고, 피드에서 함께 움직일 사람이 보여요.'}
        </p>

        <div className="product-onboarding-mini-steps">
          {steps.map(([number, title]) => (
            <article key={number} className="product-onboarding-step">
              <span className="product-onboarding-step-mark">{number}</span>
              <strong>{title}</strong>
            </article>
          ))}
        </div>

        <div className="product-onboarding-actions">
          <button type="button" className="product-onboarding-primary" onClick={onStartWorkout}>
            {isEnglish ? 'Log workout' : '바로 기록'}
          </button>
          <button type="button" className="product-onboarding-secondary" onClick={onStartTest}>
            {isEnglish ? 'Level test' : '레벨 확인'}
          </button>
        </div>
      </section>
    </div>
  )
}
