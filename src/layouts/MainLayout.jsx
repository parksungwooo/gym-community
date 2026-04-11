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
      {topNav ? <header className="app-header main-layout-header">{topNav}</header> : null}

      <main
        className="app-main main-layout-main"
        id={contentId}
        aria-busy={busy || undefined}
      >
        <div className="app-container main-layout-container">
          {pageHeader ? (
            <section className="app-page-heading main-layout-page-heading" aria-label={pageHeader.title}>
              <span>{pageHeader.eyebrow}</span>
              <h1>{pageHeader.title}</h1>
              <p>{pageHeader.body}</p>
            </section>
          ) : null}

          <div className="main-layout-content">{children}</div>
        </div>
      </main>

      {bottomNav ? (
        <footer className="app-bottom-nav-slot main-layout-bottom-nav" aria-label={navigationLabel}>
          {bottomNav}
        </footer>
      ) : null}
    </>
  )
}
