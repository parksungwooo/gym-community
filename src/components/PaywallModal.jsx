import { useMemo, useState } from 'react'
import { useI18n } from '../i18n.js'
import {
  PREMIUM_ACTIVATION_STEPS,
  PREMIUM_BENEFITS,
  PREMIUM_FEATURE_TABLE,
  PREMIUM_FEATURE_SPOTLIGHTS,
  PREMIUM_LAUNCH_OFFER,
  PREMIUM_OUTCOMES,
  PREMIUM_PLANS,
  PREMIUM_PROOF_POINTS,
  PREMIUM_RISK_REVERSALS,
  PREMIUM_TRANSFORMATION_TIMELINE,
  getCheckoutPreparation,
  getPaywallCopy,
  getPaywallTriggerCopy,
} from '../utils/premium'

function OutcomeCard({ title, body }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <strong className="text-sm font-black leading-6 text-white">{title}</strong>
      <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-100">{body}</p>
    </article>
  )
}

function ProofMetric({ value, label }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <strong className="block text-2xl font-black leading-tight text-white">{value}</strong>
      <span className="mt-1 block text-xs font-bold leading-5 text-gray-100">{label}</span>
    </article>
  )
}

function TriggerMoment({ label, title, body, ctaHint }) {
  return (
    <article className="grid gap-3 rounded-3xl border border-emerald-300/20 bg-emerald-50 p-4 dark:border-emerald-300/20 dark:bg-emerald-500/10 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="grid gap-1">
        <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{label}</span>
        <strong className="text-lg font-black leading-6 text-emerald-950 dark:text-emerald-50">{title}</strong>
        <p className="m-0 text-sm font-semibold leading-6 text-emerald-900 dark:text-emerald-100">{body}</p>
      </div>
      <span className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-sm">
        {ctaHint}
      </span>
    </article>
  )
}

function BenefitCard({ title, body }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
      <strong className="text-sm font-black text-gray-950 dark:text-white">{title}</strong>
      <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{body}</p>
    </article>
  )
}

function RiskReversalCard({ title, body }) {
  return (
    <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <strong className="text-sm font-black text-gray-950 dark:text-white">{title}</strong>
      <p className="m-0 mt-1 text-xs font-bold leading-5 text-gray-800 dark:text-gray-100">{body}</p>
    </article>
  )
}

function TimelineCard({ point, title, body, index }) {
  return (
    <article className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950 text-sm font-black text-white dark:bg-white dark:text-neutral-950">
          {index + 1}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100">
          {point}
        </span>
      </div>
      <strong className="text-base font-black leading-6 text-gray-950 dark:text-white">{title}</strong>
      <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{body}</p>
    </article>
  )
}

function SpotlightCard({ item, language }) {
  return (
    <article className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/10">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black uppercase text-white">
          {item.label[language]}
        </span>
        <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.16)] motion-safe:animate-pulse" aria-hidden="true" />
      </div>
      <div className="grid gap-2">
        <strong className="text-lg font-black leading-6 text-gray-950 dark:text-white">{item.title[language]}</strong>
        <p className="m-0 text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{item.body[language]}</p>
      </div>
      <span className="rounded-2xl bg-gray-50 p-3 text-xs font-black leading-5 text-gray-800 dark:bg-neutral-950 dark:text-gray-100">
        {item.proof[language]}
      </span>
    </article>
  )
}

function PlanOption({ plan, selected, language, onSelect }) {
  return (
    <button
      type="button"
      className={`grid min-h-44 gap-4 rounded-3xl border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-900/10 dark:border-emerald-300 dark:bg-emerald-500/15'
          : 'border-gray-100 bg-white hover:border-emerald-200 dark:border-white/10 dark:bg-white/10 dark:hover:border-emerald-300/40'
      }`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="grid gap-1">
          <span className="text-sm font-black text-gray-950 dark:text-white">{plan.title[language]}</span>
          <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">{plan.originalPrice[language]}</span>
        </span>
        {plan.badge ? (
          <span className={`${selected ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'} rounded-full px-3 py-1.5 text-xs font-black`}>
            {plan.badge[language]}
          </span>
        ) : null}
      </span>

      <span className="grid gap-1">
        <span className="text-3xl font-black leading-none text-gray-950 dark:text-white">
          {plan.price[language]}
          <span className="ml-1 text-sm font-black text-gray-700 dark:text-gray-100">{plan.period[language]}</span>
        </span>
        <span className="text-sm font-black text-gray-800 dark:text-gray-100">{plan.monthlyValue[language]}</span>
        <span className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{plan.detail[language]}</span>
      </span>

      <span className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-emerald-800 shadow-sm dark:bg-neutral-950 dark:text-emerald-200">
        {plan.footnote[language]}
      </span>
    </button>
  )
}

function FeatureRow({ category, free, pro }) {
  return (
    <article className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/10 sm:grid-cols-[1fr_0.85fr_1fr] sm:items-start">
      <strong className="text-sm font-black text-gray-950 dark:text-white">{category}</strong>
      <div className="grid gap-1">
        <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">Free</span>
        <span className="text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{free}</span>
      </div>
      <div className="grid gap-1 rounded-2xl bg-emerald-700 p-3 text-white shadow-sm">
        <span className="text-xs font-black uppercase text-emerald-50">Pro</span>
        <span className="text-sm font-black leading-6">{pro}</span>
      </div>
    </article>
  )
}

function ActivationStep({ title, body, index }) {
  return (
    <article className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-700 text-sm font-black text-white">{index + 1}</span>
      <span className="grid gap-1">
        <strong className="text-sm font-black text-gray-950 dark:text-white">{title}</strong>
        <span className="text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">{body}</span>
      </span>
    </article>
  )
}

export default function PaywallModal({
  open,
  context,
  isPro,
  loading,
  onClose,
  onUpgradePlan,
}) {
  const { isEnglish, language } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const [provider, setProvider] = useState('stripe')
  const [selectedPlanId, setSelectedPlanId] = useState('annual')

  const selectedPlan = useMemo(
    () => PREMIUM_PLANS.find((plan) => plan.id === selectedPlanId) ?? PREMIUM_PLANS[0],
    [selectedPlanId],
  )
  const checkout = useMemo(
    () => getCheckoutPreparation(selectedPlan.id, provider),
    [provider, selectedPlan.id],
  )

  if (!open) return null

  const copy = getPaywallCopy(context, language)
  const triggerCopy = getPaywallTriggerCopy(context, language)

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-gray-950/75 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-md sm:place-items-center sm:px-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <section
        className="relative grid max-h-[92vh] w-full max-w-3xl gap-5 overflow-y-auto rounded-3xl border border-white/40 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-lg bg-white/90 text-xl font-black text-gray-900 shadow-sm transition hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          onClick={onClose}
          aria-label={isEnglish ? 'Close' : '닫기'}
        >
          &times;
        </button>

        <section className="grid gap-5 rounded-3xl border border-emerald-300/25 bg-neutral-950 p-5 text-white shadow-sm sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="grid gap-3 pr-10 sm:pr-0">
              <span className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-black uppercase text-emerald-100">
                {copy.kicker}
              </span>
              <h2 className="m-0 text-3xl font-black leading-tight text-white sm:text-4xl">{copy.title}</h2>
              <p className="m-0 text-base font-semibold leading-7 text-gray-100">{copy.body}</p>
              <p className="m-0 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-black leading-6 text-emerald-50">
                {copy.promise}
              </p>
            </div>

            <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur sm:w-52">
              <span className="text-xs font-black uppercase text-emerald-100">{PREMIUM_LAUNCH_OFFER.label[language]}</span>
              <strong className="text-lg font-black leading-6 text-white">{PREMIUM_LAUNCH_OFFER.title[language]}</strong>
              <span className="text-sm font-semibold leading-6 text-gray-100">{PREMIUM_LAUNCH_OFFER.expiresLabel[language]}</span>
              <span className="w-fit rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-emerald-950 shadow-sm motion-safe:animate-pulse">
                {t(`쿠폰 ${PREMIUM_LAUNCH_OFFER.code}`, `Coupon ${PREMIUM_LAUNCH_OFFER.code}`)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_PROOF_POINTS.map((item) => (
              <ProofMetric
                key={item.label.en}
                value={item.value[language]}
                label={item.label[language]}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_OUTCOMES.map((item) => (
              <OutcomeCard
                key={item.title.en}
                title={item.title[language]}
                body={item.body[language]}
              />
            ))}
          </div>
        </section>

        <TriggerMoment
          label={triggerCopy.label}
          title={triggerCopy.title}
          body={triggerCopy.body}
          ctaHint={triggerCopy.ctaHint}
        />

        <section className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
              {t('Pro가 만드는 변화', 'What Pro changes')}
            </span>
            <h3 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t('오늘의 기록이 4주 뒤 몸의 증거가 됩니다', 'Today’s log becomes proof in four weeks')}
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_TRANSFORMATION_TIMELINE.map((item, index) => (
              <TimelineCard
                key={item.point.en}
                index={index}
                point={item.point[language]}
                title={item.title[language]}
                body={item.body[language]}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
              {t('플랜 선택', 'Choose your plan')}
            </span>
            <h3 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t('연간 Pro가 가장 강한 선택입니다', 'Annual Pro is the strongest choice')}
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {PREMIUM_PLANS.map((plan) => (
              <PlanOption
                key={plan.id}
                plan={plan}
                selected={selectedPlan.id === plan.id}
                language={language}
                onSelect={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
              {t('Pro 기능 미리보기', 'Pro feature preview')}
            </span>
            <h3 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t('각 기능이 실제로 해결하는 문제', 'The real problem each Pro feature solves')}
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PREMIUM_FEATURE_SPOTLIGHTS.map((item) => (
              <SpotlightCard
                key={item.context}
                item={item}
                language={language}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-300/20 dark:bg-emerald-500/10">
          <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="grid gap-1">
              <strong className="text-base font-black text-emerald-950 dark:text-emerald-50">
                {t('결제 후 바로 열리는 Pro 경험', 'What unlocks right after checkout')}
              </strong>
              <span className="text-sm font-semibold leading-6 text-emerald-900 dark:text-emerald-100">
                {t('무료 기록 화면에서 멈추지 않고, 다음 행동까지 이어집니다.', 'It moves you from logging into the next action.')}
              </span>
            </div>
            <span className="w-fit rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
              {isPro ? t('이미 Pro', 'Already Pro') : t('즉시 적용', 'Instant unlock')}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_ACTIVATION_STEPS.map((item, index) => (
              <ActivationStep
                key={item.title.en}
                index={index}
                title={item.title[language]}
                body={item.body[language]}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
              {t('Pro가 달라지는 지점', 'Why Pro feels different')}
            </span>
            <h3 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t('기능이 아니라, 운동을 계속하게 만드는 장치입니다', 'Not just features, a system for consistency')}
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PREMIUM_BENEFITS.map((item) => (
              <BenefitCard
                key={item.title.en}
                title={item.title[language]}
                body={item.body[language]}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">
              {t('Free vs Pro', 'Free vs Pro')}
            </span>
            <h3 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              {t('무료와 Pro의 차이를 명확하게', 'A clear difference between Free and Pro')}
            </h3>
          </div>

          <div className="grid gap-2">
            {PREMIUM_FEATURE_TABLE.map((row) => (
              <FeatureRow
                key={row.category.en}
                category={row.category[language]}
                free={row.free[language]}
                pro={row.pro[language]}
              />
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/10">
          <div className="grid gap-1">
            <strong className="text-base font-black text-gray-950 dark:text-white">
              {t('결제 수단', 'Payment method')}
            </strong>
            <span className="text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">
              {t(
                'Stripe 또는 Toss Payments 승인창으로 연결할 수 있도록 준비되어 있습니다.',
                'Ready to connect to Stripe Checkout or Toss Payments.',
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-sm dark:bg-neutral-950">
            {[
              ['stripe', 'Stripe'],
              ['toss', 'Toss Payments'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${
                  provider === key
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-gray-800 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'
                }`}
                onClick={() => setProvider(key)}
                aria-pressed={provider === key}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold leading-5 text-gray-700 dark:text-gray-200">
            {t(
              `선택된 결제 준비: ${provider === 'stripe' ? 'Stripe' : 'Toss'} · ${checkout.mode} · ${checkout.couponCode}`,
              `Prepared checkout: ${provider === 'stripe' ? 'Stripe' : 'Toss'} · ${checkout.mode} · ${checkout.couponCode}`,
            )}
          </span>
        </section>

        <section className="grid gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">
              {t('부담 없이 확인', 'Try with confidence')}
            </span>
            <h3 className="m-0 text-xl font-black leading-tight text-gray-950 dark:text-white">
              {t('오늘 시작해도, 아니다 싶으면 멈출 수 있어요', 'Start today, stop if it is not right')}
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {PREMIUM_RISK_REVERSALS.map((item) => (
              <RiskReversalCard
                key={item.title.en}
                title={item.title[language]}
                body={item.body[language]}
              />
            ))}
          </div>
        </section>

        <div className="sticky bottom-0 -mx-4 -mb-4 grid gap-3 border-t border-gray-100 bg-white/95 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/95 sm:-mx-6 sm:-mb-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="grid gap-1">
            <strong className="text-base font-black text-gray-950 dark:text-white">
              {selectedPlan.title[language]} · {selectedPlan.monthlyValue[language]}
            </strong>
            <span className="text-sm font-semibold leading-6 text-gray-800 dark:text-gray-100">
              {PREMIUM_LAUNCH_OFFER.body[language]}
            </span>
          </div>
          <div className="grid gap-2 sm:min-w-64">
            <button
              type="button"
              className="min-h-12 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => onUpgradePlan(selectedPlan.id, provider)}
              disabled={loading || isPro}
            >
              {isPro ? t('이미 Pro 이용 중', 'Already on Pro') : selectedPlan.ctaLabel[language]}
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
              onClick={onClose}
              disabled={loading}
            >
              {t('지금은 무료로 계속 쓰기', 'Continue with Free for now')}
            </button>
          </div>
        </div>

        <p className="m-0 text-xs font-semibold leading-5 text-gray-700 dark:text-gray-200">
          {t(
            '체험 종료 24시간 전까지 해지하지 않으면 자동 갱신됩니다. 구독은 설정에서 언제든 관리하거나 해지할 수 있어요.',
            'Unless canceled at least 24 hours before the trial ends, the subscription renews automatically. You can manage or cancel it anytime in settings.',
          )}
        </p>
      </section>
    </div>
  )
}
