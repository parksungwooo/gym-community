export default function RouteSuspenseFallback({ label = 'Loading...' }) {
  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      <div className="grid gap-3">
        <span className="h-3 w-24 animate-pulse rounded-full bg-gray-100 dark:bg-white/10" />
        <span className="h-5 w-2/3 animate-pulse rounded-full bg-gray-100 dark:bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <span className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
        <span className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
      </div>
      <p className="m-0 text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
    </section>
  )
}
