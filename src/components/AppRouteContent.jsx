import { Suspense, lazy } from 'react'
import RouteSuspenseFallback from '../routes/RouteSuspenseFallback'
import { VIEW } from '../hooks/useAppNavigation'

const HomeRoute = lazy(() => import('../routes/HomeRoute'))
const ProgressRoute = lazy(() => import('../routes/ProgressRoute'))
const CommunityRoute = lazy(() => import('../routes/CommunityRoute'))
const ProfileRoute = lazy(() => import('../routes/ProfileRoute'))

export default function AppRouteContent({
  view,
  isEnglish,
  home,
  progress,
  community,
  profile,
}) {
  return (
    <Suspense fallback={<RouteSuspenseFallback label={isEnglish ? 'Loading route...' : '?붾㈃??遺덈윭?ㅻ뒗 以묒엯?덈떎...'} />}>
      {view === VIEW.HOME && (
        <HomeRoute {...home} />
      )}

      {view === VIEW.PROGRESS && (
        <ProgressRoute {...progress} />
      )}

      {view === VIEW.COMMUNITY && (
        <CommunityRoute {...community} />
      )}

      {view === VIEW.PROFILE && (
        <ProfileRoute {...profile} />
      )}
    </Suspense>
  )
}
