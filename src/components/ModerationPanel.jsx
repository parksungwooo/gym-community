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
    <section className="card moderation-panel-card">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Admin' : '운영'}</span>
          <h2>{isEnglish ? 'Reports' : '신고'}</h2>
        </div>
        <span className="community-mini-pill">
          {isEnglish ? `${reports.length} reports` : `${reports.length}건`}
        </span>
      </div>

      <p className="subtext compact">
        {isEnglish ? 'Review and hide.' : '검토하고 숨기기'}
      </p>

      <div className="moderation-toolbar">
        <select
          className="workout-select compact"
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
          className="ghost-btn"
          onClick={onRefresh}
          disabled={loading || actionLoading}
        >
          {isEnglish ? 'Refresh' : '새로고침'}
        </button>
      </div>

      {loading ? (
        <div className="skeleton-stack">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="skeleton-card feed">
              <span className="skeleton-line medium" />
              <span className="skeleton-line long" />
              <span className="skeleton-line long" />
            </div>
          ))}
        </div>
      ) : !reports.length ? (
        <div className="empty-state-card cool">
          <span className="empty-state-badge">{isEnglish ? 'Clear' : '조용함'}</span>
          <strong>{isEnglish ? 'No reports.' : '신고 없음'}</strong>
          <p>{isEnglish ? 'New ones show here.' : '새 신고가 보여요.'}</p>
        </div>
      ) : (
        <div className="moderation-report-list">
          {reports.map((report) => {
            const resolutionNote = getResolutionNote(report)
            const visibility = getPostVisibilityCopy(report.post_visibility_status, isEnglish)
            const nextVisibility = report.post_visibility_status === 'visible' ? 'hidden_by_admin' : 'visible'

            return (
              <article key={report.id} className="moderation-report-card">
                <div className="moderation-report-head">
                  <div>
                    <strong>{report.reason_label}</strong>
                    <span>{formatTimestamp(report.created_at, language === 'en' ? 'en-US' : 'ko-KR')}</span>
                  </div>
                  <span className={`community-mini-pill moderation-status-pill ${report.status}`}>
                    {getReportStatusLabel(report.status, isEnglish)}
                  </span>
                </div>

                <p className="moderation-report-meta">
                  {isEnglish
                    ? `From ${report.reporter_name || 'Unknown'} / To ${report.target_name || report.post_author_name || 'Unknown'}`
                    : `${report.reporter_name || '이름없음'} / ${report.target_name || report.post_author_name || '이름없음'}`}
                </p>

                {report.post_id && (
                  <div className="moderation-post-state-row">
                    <span className={`moderation-post-pill ${report.post_visibility_status || 'visible'}`}>
                      {visibility.label}
                    </span>
                    {report.post_hidden_reason && (
                      <span className="moderation-post-note">
                        {isEnglish ? `Note ${report.post_hidden_reason}` : `메모 ${report.post_hidden_reason}`}
                      </span>
                    )}
                  </div>
                )}

                {report.post_preview && <p className="moderation-report-preview">{report.post_preview}</p>}
                {report.details && <p className="moderation-report-details">{report.details}</p>}

                <textarea
                  className="workout-textarea settings-textarea compact"
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

                <div className="moderation-report-actions">
                  {report.post_id && (
                    <button
                      type="button"
                      className={`ghost-chip ${visibility.actionTone === 'hide' ? 'danger-chip' : ''}`}
                      onClick={() => onTogglePostVisibility(report, nextVisibility, resolutionNote)}
                      disabled={actionLoading}
                    >
                      {visibility.actionLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => onResolve(report.id, 'reviewed', resolutionNote)}
                    disabled={actionLoading}
                  >
                    {isEnglish ? 'Done' : '완료'}
                  </button>
                  <button
                    type="button"
                    className="ghost-chip danger-chip"
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
