export default function MainLayout({
  topNav,
  pageHeader,
  bottomNav,
  navigationLabel,
  children,
  busy = false,
  contentId = 'app-content',
}) {
  return (
    <>
      {topNav ? (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
          <div className="pointer-events-auto mx-auto flex w-full max-w-3xl justify-end px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-5">
            {topNav}
          </div>
        </header>
      ) : null}

      <main
        className="mx-auto grid min-h-dvh w-full max-w-3xl content-start gap-4 px-3 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+4.5rem)] sm:px-5 sm:pb-[calc(env(safe-area-inset-bottom)+7.5rem)] sm:pt-[calc(env(safe-area-inset-top)+5rem)]"
        id={contentId}
        aria-busy={busy || undefined}
      >
        {pageHeader ? (
          <section className="grid gap-1.5 pr-20 sm:pr-24" aria-label={pageHeader.title}>
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
              {pageHeader.eyebrow}
            </span>
            <h1 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white sm:text-3xl">
              {pageHeader.title}
            </h1>
            {pageHeader.body ? (
              <p className="m-0 max-w-2xl text-sm font-semibold leading-6 text-gray-700 dark:text-gray-100">
                {pageHeader.body}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-4 sm:gap-5">{children}</div>
      </main>

      {bottomNav ? (
        <footer className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5" aria-label={navigationLabel || 'Primary navigation'}>
          <div className="mx-auto w-full max-w-3xl">
            {bottomNav}
          </div>
        </footer>
      ) : null}
    </>
  )
}
