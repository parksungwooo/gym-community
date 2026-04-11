import { useState } from 'react'
import { useI18n } from '../i18n.js'
import {
  getCheckoutPreparation,
  getPaywallCopy,
  PREMIUM_BENEFITS,
  PREMIUM_FEATURE_TABLE,
  PREMIUM_PLANS,
} from '../utils/premium'

function BenefitCard({ title, body }) {
  return (
    <article className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
      <strong className="text-sm font-black text-gray-950 dark:text-white">{title}</strong>
      <p className="m-0 mt-1 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{body}</p>
    </article>
  )
}

function FeatureRow({ category, free, pro }) {
  return (
    <article className="grid gap-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10 sm:grid-cols-[1fr_0.7fr_0.7fr] sm:items-center">
      <strong className="text-sm font-black text-gray-950 dark:text-white">{category}</strong>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{free}</span>
      <span className="text-sm font-black text-emerald-700 dark:text-emerald-200">{pro}</span>
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

  if (!open) return null

  const copy = getPaywallCopy(context, language)

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="grid w-full max-w-2xl gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-xl font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClose} aria-label={isEnglish ? 'Close' : '닫기'}>&times;</button>
        <div className="grid gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-white/10 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{copy.kicker}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{copy.title}</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{copy.body}</p>
          </div>
          <div className={`rounded-full px-3 py-1.5 text-xs font-black ${isPro ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
            {isPro ? t('현재 Pro 사용 중', 'Currently on Pro') : t('현재 Free 플랜', 'Currently on Free')}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_BENEFITS.map((item) => (
            <BenefitCard
              key={item.title.en}
              title={item.title[language]}
              body={item.body[language]}
            />
          ))}
        </div>

        <section className="grid gap-3 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
          <div className="grid gap-1">
            <strong className="text-base font-black text-gray-950 dark:text-white">
              {t('결제 수단 준비', 'Checkout preparation')}
            </strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {t(
                '지금은 UI 준비 단계입니다. 다음 단계에서 Stripe Checkout 또는 Toss Payments 승인창으로 연결하면 바로 구독 결제가 가능합니다.',
                'This UI is ready for the next step: connect Stripe Checkout or Toss Payments to activate subscriptions.',
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1 dark:bg-white/10">
            {[
              ['stripe', 'Stripe'],
              ['toss', 'Toss Payments'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-black transition ${provider === key ? 'bg-white text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white' : 'text-gray-700 hover:text-gray-950 dark:text-gray-100 dark:hover:text-white'}`}
                onClick={() => setProvider(key)}
                aria-pressed={provider === key}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          {PREMIUM_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`grid gap-4 rounded-2xl border p-4 ${plan.highlighted ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-700/20' : 'border-gray-100 bg-gray-50 dark:border-white/10 dark:bg-neutral-950'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="text-base font-black text-gray-950 dark:text-white">{plan.title[language]}</strong>
                  <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{plan.detail[language]}</p>
                </div>
                {plan.badge ? <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">{plan.badge[language]}</span> : null}
              </div>

              <div className="grid gap-1">
                <span className="text-3xl font-black text-gray-950 dark:text-white">{plan.price[language]}</span>
                <small className="text-sm font-semibold text-gray-700 dark:text-gray-200">{plan.footnote[language]}</small>
              </div>

              <div className="rounded-2xl bg-white p-3 text-xs font-bold text-gray-700 shadow-sm dark:bg-neutral-950 dark:text-gray-200">
                {(() => {
                  const checkout = getCheckoutPreparation(plan.id, provider)
                  return t(
                    `${provider === 'stripe' ? 'Stripe' : 'Toss'} 구독 ID: ${checkout.priceId}`,
                    `${provider === 'stripe' ? 'Stripe' : 'Toss'} subscription id: ${checkout.priceId}`,
                  )
                })()}
              </div>

              <button
                type="button"
                className={plan.highlighted
                  ? 'min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50'
                  : 'min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10'}
                onClick={() => onUpgradePlan(plan.id, provider)}
                disabled={loading || isPro}
              >
                {isPro
                  ? t('이미 Pro 이용 중', 'Already on Pro')
                  : plan.id === 'annual'
                    ? t('7일 무료로 시작하기', 'Start free for 7 days')
                    : t('월간 Pro 시작하기', 'Start monthly Pro')}
              </button>
            </article>
          ))}
        </div>

        <section className="grid gap-3 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <strong>{t('기능 비교', 'Feature comparison')}</strong>
            <div className="grid grid-cols-2 gap-2 text-xs font-black text-gray-700 dark:text-gray-200">
              <span>{t('Free', 'Free')}</span>
              <span>{t('Pro', 'Pro')}</span>
            </div>
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

        <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
          <p>
            {t(
              '체험 종료 24시간 전까지 해지하지 않으면 자동 갱신됩니다. 구독은 설정에서 언제든 관리하거나 해지할 수 있어요.',
              'Unless canceled at least 24 hours before the trial ends, the subscription renews automatically. You can manage or cancel it anytime in settings.',
            )}
          </p>
        </div>

        <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClose} disabled={loading}>
          {t('무료로 계속 쓰기', 'Continue with Free')}
        </button>
      </section>
    </div>
  )
}
