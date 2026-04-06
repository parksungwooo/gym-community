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

export default function ModerationPanel({
  reports,
  loading,
  actionLoading,
  status,
  onStatusChange,
  onRefresh,
  onResolve,
}) {
  const { language, isEnglish } = useI18n()
  const [resolutionNotes, setResolutionNotes] = useState({})

  return (
    <section className="card moderation-panel-card">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Admin' : '운영'}</span>
          <h2>{isEnglish ? 'Report Queue' : '신고 관리'}</h2>
        </div>
        <span className="community-mini-pill">{isEnglish ? `${reports.length} reports` : `${reports.length}건`}</span>
      </div>
      <p className="subtext compact">
        {isEnglish ? 'Review community reports and mark a moderation outcome.' : '커뮤니티 신고를 확인하고 처리 상태를 남겨보세요.'}
      </p>

      <div className="moderation-toolbar">
        <select className="workout-select compact" value={status} onChange={(event) => onStatusChange(event.target.value)} disabled={loading || actionLoading}>
          <option value="open">{isEnglish ? 'Open' : '접수됨'}</option>
          <option value="reviewed">{isEnglish ? 'Reviewed' : '검토 완료'}</option>
          <option value="dismissed">{isEnglish ? 'Dismissed' : '기각됨'}</option>
        </select>
        <button type="button" className="ghost-btn" onClick={onRefresh} disabled={loading || actionLoading}>
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
          <strong>{isEnglish ? 'No reports in this queue.' : '이 상태의 신고가 없어요.'}</strong>
          <p>{isEnglish ? 'Once users report posts or accounts, they will appear here.' : '사용자 신고가 들어오면 여기에서 검토할 수 있어요.'}</p>
        </div>
      ) : (
        <div className="moderation-report-list">
          {reports.map((report) => (
            <article key={report.id} className="moderation-report-card">
              <div className="moderation-report-head">
                <div>
                  <strong>{report.reason_label}</strong>
                  <span>{formatTimestamp(report.created_at, language === 'en' ? 'en-US' : 'ko-KR')}</span>
                </div>
                <span className={`community-mini-pill moderation-status-pill ${report.status}`}>{report.status}</span>
              </div>
              <p className="moderation-report-meta">
                {isEnglish
                  ? `Reporter: ${report.reporter_name || 'Unknown'} / Target: ${report.target_name || report.post_author_name || 'Unknown'}`
                  : `신고자: ${report.reporter_name || '알 수 없음'} / 대상: ${report.target_name || report.post_author_name || '알 수 없음'}`}
              </p>
              {report.post_preview && <p className="moderation-report-preview">{report.post_preview}</p>}
              {report.details && <p className="moderation-report-details">{report.details}</p>}
              <textarea
                className="workout-textarea settings-textarea compact"
                rows="3"
                maxLength="240"
                placeholder={isEnglish ? 'Leave a moderation note' : '처리 메모를 남겨주세요'}
                value={resolutionNotes[report.id] ?? report.resolution_note ?? ''}
                onChange={(event) => setResolutionNotes((prev) => ({ ...prev, [report.id]: event.target.value }))}
                disabled={actionLoading}
              />
              <div className="moderation-report-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => onResolve(report.id, 'reviewed', resolutionNotes[report.id] ?? report.resolution_note ?? '')}
                  disabled={actionLoading}
                >
                  {isEnglish ? 'Mark Reviewed' : '검토 완료'}
                </button>
                <button
                  type="button"
                  className="ghost-chip danger-chip"
                  onClick={() => onResolve(report.id, 'dismissed', resolutionNotes[report.id] ?? report.resolution_note ?? '')}
                  disabled={actionLoading}
                >
                  {isEnglish ? 'Dismiss' : '기각'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
