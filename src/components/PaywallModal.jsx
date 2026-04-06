import { useI18n } from '../i18n.js'
import {
  getPaywallCopy,
  PREMIUM_BENEFITS,
  PREMIUM_FEATURE_TABLE,
  PREMIUM_PLANS,
} from '../utils/premium'

function BenefitCard({ title, body }) {
  return (
    <article className="paywall-benefit-card">
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  )
}

function FeatureRow({ category, free, pro }) {
  return (
    <article className="paywall-feature-row">
      <strong>{category}</strong>
      <span>{free}</span>
      <span>{pro}</span>
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

  if (!open) return null

  const copy = getPaywallCopy(context, language)

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="auth-modal-card paywall-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="paywall-hero">
          <div className="paywall-hero-copy">
            <span className="auth-modal-kicker">{copy.kicker}</span>
            <h2>{copy.title}</h2>
            <p>{copy.body}</p>
          </div>
          <div className={`paywall-status-badge ${isPro ? 'active' : ''}`}>
            {isPro ? t('현재 Pro 사용 중', 'Currently on Pro') : t('현재 Free 플랜', 'Currently on Free')}
          </div>
        </div>

        <div className="paywall-benefit-grid">
          {PREMIUM_BENEFITS.map((item) => (
            <BenefitCard
              key={item.title.en}
              title={item.title[language]}
              body={item.body[language]}
            />
          ))}
        </div>

        <div className="paywall-plan-grid">
          {PREMIUM_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`paywall-plan-card ${plan.highlighted ? 'highlighted' : ''}`}
            >
              <div className="paywall-plan-head">
                <div>
                  <strong>{plan.title[language]}</strong>
                  <p>{plan.detail[language]}</p>
                </div>
                {plan.badge ? <span className="paywall-plan-badge">{plan.badge[language]}</span> : null}
              </div>

              <div className="paywall-plan-price">
                <span>{plan.price[language]}</span>
                <small>{plan.footnote[language]}</small>
              </div>

              <button
                type="button"
                className={plan.highlighted ? 'primary-btn' : 'secondary-btn'}
                onClick={() => onUpgradePlan(plan.id)}
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

        <section className="paywall-feature-table">
          <div className="paywall-feature-header">
            <strong>{t('기능 비교', 'Feature comparison')}</strong>
            <div className="paywall-feature-columns">
              <span>{t('Free', 'Free')}</span>
              <span>{t('Pro', 'Pro')}</span>
            </div>
          </div>

          <div className="paywall-feature-list">
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

        <div className="paywall-footer">
          <p>
            {t(
              '체험 종료 24시간 전까지 해지하지 않으면 자동 갱신됩니다. 구독은 설정에서 언제든 관리하거나 해지할 수 있어요.',
              'Unless canceled at least 24 hours before the trial ends, the subscription renews automatically. You can manage or cancel it anytime in settings.',
            )}
          </p>
        </div>

        <button type="button" className="ghost-btn auth-modal-close" onClick={onClose} disabled={loading}>
          {t('무료로 계속 쓰기', 'Continue with Free')}
        </button>
      </section>
    </div>
  )
}
