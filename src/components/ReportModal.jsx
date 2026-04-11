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
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" onClick={(event) => event.stopPropagation()}>
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
            className="min-h-12 rounded-lg bg-emerald-500 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
            onClick={() => onSubmit({ reason, details })}
            disabled={loading}
          >
            {loading ? (isEnglish ? 'Sending...' : '보내는 중...') : (isEnglish ? 'Send' : '보내기')}
          </button>
        </div>

        <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-600 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-300 dark:hover:text-white" onClick={onClose} disabled={loading}>
          {isEnglish ? 'Cancel' : '취소'}
        </button>
      </section>
    </div>
  )
}
