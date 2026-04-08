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
  if (status === 'reviewed') return isEnglish ? 'Reviewed' : '검토 완료'
  if (status === 'dismissed') return isEnglish ? 'Dismissed' : '기각됨'
  return isEnglish ? 'Open' : '접수됨'
}

function getPostVisibilityCopy(status, isEnglish) {
  if (status === 'hidden_by_author') {
    return {
      label: isEnglish ? 'Hidden by author' : '작성자가 숨김',
      actionLabel: isEnglish ? 'Restore post' : '게시글 복구',
      actionTone: 'restore',
    }
  }

  if (status === 'hidden_by_admin') {
    return {
      label: isEnglish ? 'Post hidden' : '게시글 숨김됨',
      actionLabel: isEnglish ? 'Restore post' : '게시글 복구',
      actionTone: 'restore',
    }
  }

  return {
    label: isEnglish ? 'Post visible' : '게시글 노출 중',
    actionLabel: isEnglish ? 'Hide post' : '게시글 숨기기',
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
          <h2>{isEnglish ? 'Report Queue' : '신고 관리'}</h2>
        </div>
        <span className="community-mini-pill">
          {isEnglish ? `${reports.length} reports` : `${reports.length}건`}
        </span>
      </div>
      <p className="subtext compact">
        {isEnglish
          ? 'Review reports, hide problematic posts, and leave a clear moderation note.'
          : '신고를 검토하고, 문제가 있는 글을 바로 숨기고, 처리 메모까지 남겨보세요.'}
      </p>

      <div className="moderation-toolbar">
        <select
          className="workout-select compact"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          disabled={loading || actionLoading}
        >
          <option value="open">{isEnglish ? 'Open' : '접수됨'}</option>
          <option value="reviewed">{isEnglish ? 'Reviewed' : '검토 완료'}</option>
          <option value="dismissed">{isEnglish ? 'Dismissed' : '기각됨'}</option>
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
          <strong>{isEnglish ? 'No reports in this queue.' : '이 상태의 신고가 없어요.'}</strong>
          <p>
            {isEnglish
              ? 'Once users report posts or accounts, they will appear here.'
              : '사용자 신고가 들어오면 여기에서 바로 확인할 수 있어요.'}
          </p>
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
                    ? `Reporter: ${report.reporter_name || 'Unknown'} / Target: ${report.target_name || report.post_author_name || 'Unknown'}`
                    : `신고자: ${report.reporter_name || '알 수 없음'} / 대상: ${report.target_name || report.post_author_name || '알 수 없음'}`}
                </p>

                {report.post_id && (
                  <div className="moderation-post-state-row">
                    <span className={`moderation-post-pill ${report.post_visibility_status || 'visible'}`}>
                      {visibility.label}
                    </span>
                    {report.post_hidden_reason && (
                      <span className="moderation-post-note">
                        {isEnglish
                          ? `Latest note: ${report.post_hidden_reason}`
                          : `최근 메모: ${report.post_hidden_reason}`}
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
                  placeholder={isEnglish ? 'Leave a moderation note' : '처리 메모를 남겨주세요'}
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
                    {isEnglish ? 'Mark Reviewed' : '검토 완료'}
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
