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
          <div className="pointer-events-auto mx-auto flex w-full max-w-3xl justify-end px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            {topNav}
          </div>
        </header>
      ) : null}

      <main
        className="mx-auto grid min-h-dvh w-full max-w-3xl content-start gap-6 px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+5.25rem)]"
        id={contentId}
        aria-busy={busy || undefined}
      >
        {pageHeader ? (
          <section className="grid gap-2 pr-24" aria-label={pageHeader.title}>
            <span className="text-xs font-black uppercase text-emerald-600">
              {pageHeader.eyebrow}
            </span>
            <h1 className="m-0 text-3xl font-black leading-tight text-gray-950 dark:text-white">
              {pageHeader.title}
            </h1>
            {pageHeader.body ? (
              <p className="m-0 max-w-2xl text-sm font-semibold leading-6 text-gray-500 dark:text-gray-300">
                {pageHeader.body}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="grid gap-6">{children}</div>
      </main>

      {bottomNav ? (
        <footer className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]" aria-label={navigationLabel}>
          <div className="mx-auto w-full max-w-3xl">
            {bottomNav}
          </div>
        </footer>
      ) : null}
    </>
  )
}
