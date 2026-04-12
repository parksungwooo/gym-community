import AppLoadingSkeleton from './AppLoadingSkeleton'
import AppRouteContent from './AppRouteContent'
import AppTopActions from './AppTopActions'
import BottomTabNav from './BottomTabNav'
import MainLayout from './Layout/MainLayout'

export default function AppShell({ shell, routes }) {
  const isBusy = shell.loadingInit

  return (
    <MainLayout
      busy={isBusy}
      contentId={isBusy ? undefined : 'app-content'}
      pageHeader={isBusy ? null : shell.viewHeader}
      topNav={isBusy ? null : <AppTopActions {...shell.topActions} />}
      bottomNav={isBusy ? null : <BottomTabNav tabs={shell.tabs} {...shell.bottomNav} />}
      navigationLabel={shell.navigationLabel}
    >
      {isBusy ? (
        <AppLoadingSkeleton status={shell.initStatus} />
      ) : (
        <AppRouteContent {...routes} />
      )}
    </MainLayout>
  )
}
