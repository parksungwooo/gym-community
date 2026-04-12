export default function AppNotices({
  guestSyncNotice,
  guestSyncState,
  loadingAuth,
  onOpenGuestSyncAuth,
  onRetryGuestSync,
  errorState,
  visibleErrorMessage,
  onClearError,
  isEnglish,
  successState,
  toastToneClass,
  toastDotClass,
}) {
  const handleGuestSyncAction = guestSyncNotice?.actionKind === 'auth'
    ? onOpenGuestSyncAuth
    : onRetryGuestSync

  return (
    <>
      {guestSyncNotice && (
        <section
          className={`fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 grid w-[min(92vw,42rem)] -translate-x-1/2 gap-2 rounded-3xl border bg-white p-4 text-gray-950 shadow-sm dark:bg-neutral-900 dark:text-white ${
            guestSyncNotice.tone === 'failed'
              ? 'border-rose-100 dark:border-rose-400/20'
              : 'border-emerald-100 dark:border-emerald-400/20'
          }`}
          role="status"
          aria-live="polite"
          data-testid={`guest-sync-${guestSyncNotice.tone}`}
        >
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{guestSyncNotice.kicker}</span>
          <strong className="text-base font-black leading-6">{guestSyncNotice.title}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-100">{guestSyncNotice.body}</p>
          <span className="text-xs font-black text-gray-700 dark:text-gray-200">{guestSyncNotice.meta}</span>
          {guestSyncNotice.actionKind !== 'none' && (
            <div className="mt-1">
              <button
                type="button"
                className={guestSyncNotice.actionKind === 'auth'
                  ? 'min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50'
                  : 'min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10'}
                data-testid="guest-sync-action"
                onClick={handleGuestSyncAction}
                disabled={guestSyncState.phase === 'syncing' || loadingAuth}
              >
                {guestSyncNotice.actionLabel}
              </button>
            </div>
          )}
        </section>
      )}

      {errorState && (
        <section className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 grid w-[min(92vw,42rem)] -translate-x-1/2 gap-3 rounded-3xl border border-rose-100 bg-white p-4 text-gray-950 shadow-sm dark:border-rose-400/20 dark:bg-neutral-900 dark:text-white" role="status" aria-live="polite">
          <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-300">{errorState.label}</span>
          <strong className="text-base font-black leading-6">{errorState.title}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-100">{visibleErrorMessage}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10" onClick={() => window.location.reload()}>
              {isEnglish ? 'Refresh app' : '???덈줈怨좎묠'}
            </button>
            <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClearError}>
              {isEnglish ? 'Hide' : '?リ린'}
            </button>
          </div>
        </section>
      )}

      {successState && (
        <div
          className={`fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] left-1/2 z-50 flex w-[min(92vw,32rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm sm:bottom-[calc(env(safe-area-inset-bottom)+6rem)] ${toastToneClass}`}
          role="status"
          aria-live="polite"
          data-testid="app-toast"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toastDotClass}`} />
          <span>{successState.message}</span>
        </div>
      )}
    </>
  )
}
