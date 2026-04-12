import AuthRequiredModal from './AuthRequiredModal'
import NotificationCenter from './NotificationCenter'
import OnboardingCoach from './OnboardingCoach'
import PaywallModal from './PaywallModal'
import ReportModal from './ReportModal'
import { PREMIUM_CONTEXT } from '../utils/premium'

export default function AppModals({
  auth,
  notifications,
  onboarding,
  paywall,
  report,
}) {
  return (
    <>
      <AuthRequiredModal
        open={Boolean(auth.prompt)}
        reason={auth.prompt?.reason}
        loading={auth.loading}
        onClose={auth.onClose}
        onGoogleSignIn={auth.onGoogleSignIn}
        onKakaoSignIn={auth.onKakaoSignIn}
        onNaverSignIn={auth.onNaverSignIn}
      />
      <PaywallModal
        open={Boolean(paywall.context)}
        context={paywall.context ?? PREMIUM_CONTEXT.GENERAL}
        isPro={paywall.isPro}
        loading={paywall.loading}
        onClose={paywall.onClose}
        onUpgradePlan={paywall.onUpgradePlan}
      />
      {report.target && (
        <ReportModal
          key={`${report.target.kind}-${report.target.targetUserId ?? 'none'}-${report.target.postId ?? 'none'}`}
          open
          loading={report.loading}
          subject={report.target}
          onClose={report.onClose}
          onSubmit={report.onSubmit}
        />
      )}
      <NotificationCenter
        open={notifications.open}
        loading={notifications.loading}
        notifications={notifications.items}
        unreadCount={notifications.unreadCount}
        onClose={notifications.onClose}
        onRefresh={notifications.onRefresh}
        onMarkAllRead={notifications.onMarkAllRead}
        onOpenNotification={notifications.onOpenNotification}
      />
      <OnboardingCoach
        open={onboarding.open}
        isEnglish={onboarding.isEnglish}
        onClose={onboarding.onClose}
        onStartTest={onboarding.onStartTest}
        onStartWorkout={onboarding.onStartWorkout}
      />
    </>
  )
}
