import AppModals from './components/AppModals'
import AppNotices from './components/AppNotices'
import AppShell from './components/AppShell'
import { useGymCommunityApp } from './hooks/useGymCommunityApp'

export default function App() {
  const app = useGymCommunityApp()

  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-50 via-white to-emerald-50/40 text-gray-950 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 dark:text-white">
      <AppNotices {...app.notices} />
      <AppModals {...app.modals} />
      <AppShell shell={app.shell} routes={app.routes} />
    </div>
  )
}
