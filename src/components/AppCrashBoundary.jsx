import { Component } from 'react'

export default class AppCrashBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      error: null,
      info: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crash boundary caught an error:', error, info)
    this.setState({ info })
  }

  render() {
    const { error, info } = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <main className="min-h-dvh bg-gray-50 px-4 py-[calc(env(safe-area-inset-top)+1.5rem)] text-gray-950 dark:bg-neutral-950 dark:text-white sm:px-6">
        <section className="mx-auto grid max-w-3xl gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
          <div className="grid gap-2">
            <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-300">
              Crash Report
            </span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
              앱이 렌더링 중 멈췄어요.
            </h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              아래 오류를 보면 어디서 죽는지 바로 확인할 수 있어요.
            </p>
          </div>

          <section className="whitespace-pre-wrap break-words rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-950 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-100">
            <strong>{error.name || 'Error'}</strong>
            <div>{error.message || 'Unknown render error'}</div>
          </section>

          {error.stack ? (
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-3xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold leading-6 text-gray-800 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100">
              {error.stack}
            </pre>
          ) : null}

          {info?.componentStack ? (
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-3xl border border-gray-100 bg-gray-50 p-4 text-sm font-semibold leading-6 text-gray-800 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100">
              {info.componentStack}
            </pre>
          ) : null}
        </section>
      </main>
    )
  }
}
