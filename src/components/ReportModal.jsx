import { useState } from 'react'
import { useI18n } from '../i18n.js'

const REPORT_REASONS = {
  ko: [
    { value: 'spam', label: '스팸/도배' },
    { value: 'abuse', label: '욕설/혐오 표현' },
    { value: 'adult', label: '부적절한 사진/콘텐츠' },
    { value: 'misleading', label: '허위 정보/사칭' },
    { value: 'other', label: '기타' },
  ],
  en: [
    { value: 'spam', label: 'Spam' },
    { value: 'abuse', label: 'Harassment' },
    { value: 'adult', label: 'Inappropriate content' },
    { value: 'misleading', label: 'Misleading / impersonation' },
    { value: 'other', label: 'Other' },
  ],
}

export default function ReportModal({
  open,
  loading,
  subject,
  onClose,
  onSubmit,
}) {
  const { language, isEnglish } = useI18n()
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')

  if (!open) return null

  return (
    <div className="auth-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="auth-modal-card report-modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose} aria-label={isEnglish ? 'Close' : '닫기'}>&times;</button>
        <span className="auth-modal-kicker">{isEnglish ? 'Safety' : '안전 센터'}</span>
        <h2>{isEnglish ? 'Report' : '신고'}</h2>
        <p>
          {isEnglish
            ? `Why report this ${subject?.kind === 'user' ? 'user' : 'post'}?`
            : `${subject?.kind === 'user' ? '이 사용자' : '이 게시글'}를 왜 신고하나요?`}
        </p>

        <div className="report-reason-grid">
          {REPORT_REASONS[language].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`report-reason-chip ${reason === item.value ? 'active' : ''}`}
              onClick={() => setReason(item.value)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          className="workout-textarea settings-textarea compact"
          rows="4"
          maxLength="240"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={isEnglish ? 'Short note (optional)' : '짧은 메모 (선택)'}
          disabled={loading}
        />

        <div className="auth-modal-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => onSubmit({ reason, details })}
            disabled={loading}
          >
            {loading ? (isEnglish ? 'Sending...' : '보내는 중...') : (isEnglish ? 'Send' : '보내기')}
          </button>
        </div>

        <button type="button" className="ghost-btn auth-modal-close" onClick={onClose} disabled={loading}>
          {isEnglish ? 'Cancel' : '취소'}
        </button>
      </section>
    </div>
  )
}
