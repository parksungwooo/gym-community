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
      <main className="app-shell" style={{ padding: '24px' }}>
        <section className="mx-auto grid max-w-3xl gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <div>
            <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-300">Crash Report</span>
            <h2 style={{ marginTop: '8px' }}>앱이 렌더링 중에 멈췄어요.</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              아래 오류를 보면 어디서 죽는지 바로 확인할 수 있어요. 이 화면이 보이면 흰 화면보다는 훨씬 빠르게 원인을 잡을 수 있습니다.
            </p>
          </div>

          <section className="error-box" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            <strong>{error.name || 'Error'}</strong>
            <div>{error.message || 'Unknown render error'}</div>
          </section>

          {error.stack ? (
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-white/10 dark:bg-neutral-950">
              {error.stack}
            </pre>
          ) : null}

          {info?.componentStack ? (
            <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-white/10 dark:bg-neutral-950">
              {info.componentStack}
            </pre>
          ) : null}
        </section>
      </main>
    )
  }
}
