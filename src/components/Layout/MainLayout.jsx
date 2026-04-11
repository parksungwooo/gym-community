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
          <div className="pointer-events-auto mx-auto flex w-full max-w-3xl justify-end px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
            {topNav}
          </div>
        </header>
      ) : null}

      <main
        className="mx-auto grid min-h-dvh w-full max-w-3xl content-start gap-5 px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-[calc(env(safe-area-inset-top)+5rem)] sm:gap-6 sm:px-6 sm:pt-[calc(env(safe-area-inset-top)+5.5rem)]"
        id={contentId}
        aria-busy={busy || undefined}
      >
        {pageHeader ? (
          <section className="grid gap-2 pr-20 sm:pr-24" aria-label={pageHeader.title}>
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

        <div className="grid gap-6">{children}</div>
      </main>

      {bottomNav ? (
        <footer className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6" aria-label={navigationLabel}>
          <div className="mx-auto w-full max-w-3xl">
            {bottomNav}
          </div>
        </footer>
      ) : null}
    </>
  )
}
