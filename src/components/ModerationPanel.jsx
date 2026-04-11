import { useState } from 'react'
import { useI18n } from '../i18n.js'

function formatTimestamp(value, locale) {
  if (!value) return ''
  return new Date(value).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getReportStatusLabel(status, isEnglish) {
  if (status === 'reviewed') return isEnglish ? 'Done' : '완료'
  if (status === 'dismissed') return isEnglish ? 'Dismissed' : '기각'
  return isEnglish ? 'Open' : '접수'
}

function getPostVisibilityCopy(status, isEnglish) {
  if (status === 'hidden_by_author') {
    return {
      label: isEnglish ? 'Author hidden' : '작성자 숨김',
      actionLabel: isEnglish ? 'Restore' : '복구',
      actionTone: 'restore',
    }
  }

  if (status === 'hidden_by_admin') {
    return {
      label: isEnglish ? 'Hidden' : '숨김',
      actionLabel: isEnglish ? 'Restore' : '복구',
      actionTone: 'restore',
    }
  }

  return {
    label: isEnglish ? 'Visible' : '노출 중',
    actionLabel: isEnglish ? 'Hide' : '숨기기',
    actionTone: 'hide',
  }
}

export default function ModerationPanel({
  reports,
  loading,
  actionLoading,
  status,
  onStatusChange,
  onRefresh,
  onResolve,
  onTogglePostVisibility,
}) {
  const { language, isEnglish } = useI18n()
  const [resolutionNotes, setResolutionNotes] = useState({})

  const getResolutionNote = (report) => resolutionNotes[report.id] ?? report.resolution_note ?? ''

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Admin' : '운영'}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Reports' : '신고'}</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">
          {isEnglish ? `${reports.length} reports` : `${reports.length}건`}
        </span>
      </div>

      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {isEnglish ? 'Review and hide.' : '검토하고 숨기기'}
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          disabled={loading || actionLoading}
        >
          <option value="open">{isEnglish ? 'Open' : '접수'}</option>
          <option value="reviewed">{isEnglish ? 'Done' : '완료'}</option>
          <option value="dismissed">{isEnglish ? 'Dismissed' : '기각'}</option>
        </select>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-gray-100 px-3 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white"
          onClick={onRefresh}
          disabled={loading || actionLoading}
        >
          {isEnglish ? 'Refresh' : '새로고침'}
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
              <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
              <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
              <span className="h-3 w-full animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : !reports.length ? (
        <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
          <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{isEnglish ? 'Clear' : '조용함'}</span>
          <strong className="text-lg font-black text-gray-950 dark:text-white">{isEnglish ? 'No reports.' : '신고 없음'}</strong>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{isEnglish ? 'New ones show here.' : '새 신고가 보여요.'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => {
            const resolutionNote = getResolutionNote(report)
            const visibility = getPostVisibilityCopy(report.post_visibility_status, isEnglish)
            const nextVisibility = report.post_visibility_status === 'visible' ? 'hidden_by_admin' : 'visible'

            return (
              <article key={report.id} className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block text-base font-black text-gray-950 dark:text-white">{report.reason_label}</strong>
                    <span className="mt-1 block text-xs font-bold text-gray-700 dark:text-gray-200">{formatTimestamp(report.created_at, language === 'en' ? 'en-US' : 'ko-KR')}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-black ${report.status === 'open' ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
                    {getReportStatusLabel(report.status, isEnglish)}
                  </span>
                </div>

                <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
                  {isEnglish
                    ? `From ${report.reporter_name || 'Unknown'} / To ${report.target_name || report.post_author_name || 'Unknown'}`
                    : `${report.reporter_name || '이름없음'} / ${report.target_name || report.post_author_name || '이름없음'}`}
                </p>

                {report.post_id && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg px-3 py-2 text-xs font-black ${report.post_visibility_status === 'visible' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>
                      {visibility.label}
                    </span>
                    {report.post_hidden_reason && (
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        {isEnglish ? `Note ${report.post_hidden_reason}` : `메모 ${report.post_hidden_reason}`}
                      </span>
                    )}
                  </div>
                )}

                {report.post_preview && <p className="m-0 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-gray-800 dark:bg-white/10 dark:text-gray-100">{report.post_preview}</p>}
                {report.details && <p className="m-0 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-gray-800 dark:bg-white/10 dark:text-gray-100">{report.details}</p>}

                <textarea
                  className="min-h-24 resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
                  rows="3"
                  maxLength="240"
                  placeholder={isEnglish ? 'Note' : '메모'}
                  value={resolutionNote}
                  onChange={(event) => setResolutionNotes((prev) => ({
                    ...prev,
                    [report.id]: event.target.value,
                  }))}
                  disabled={actionLoading}
                />

                <div className="flex flex-wrap justify-end gap-2">
                  {report.post_id && (
                    <button
                      type="button"
                      className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${visibility.actionTone === 'hide' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100'}`}
                      onClick={() => onTogglePostVisibility(report, nextVisibility, resolutionNote)}
                      disabled={actionLoading}
                    >
                      {visibility.actionLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
                    onClick={() => onResolve(report.id, 'reviewed', resolutionNote)}
                    disabled={actionLoading}
                  >
                    {isEnglish ? 'Done' : '완료'}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-lg bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-300"
                    onClick={() => onResolve(report.id, 'dismissed', resolutionNote)}
                    disabled={actionLoading}
                  >
                    {isEnglish ? 'Dismiss' : '기각'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
