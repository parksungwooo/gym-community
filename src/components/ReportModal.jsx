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
    <div className="fixed inset-0 z-50 grid place-items-end bg-gray-950/70 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-sm sm:place-items-center sm:px-6" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="grid w-full max-w-md gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-xl font-black text-gray-800 transition hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClose} aria-label={isEnglish ? 'Close' : '닫기'}>&times;</button>
        <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Safety' : '안전 센터'}</span>
        <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Report' : '신고'}</h2>
        <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{isEnglish
            ? `Why report this ${subject?.kind === 'user' ? 'user' : 'post'}?`
            : `${subject?.kind === 'user' ? '이 사용자' : '이 게시글'}를 왜 신고하나요?`}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          {REPORT_REASONS[language].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${reason === item.value ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'}`}
              onClick={() => setReason(item.value)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          className="min-h-28 resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:placeholder:text-gray-300"
          rows="4"
          maxLength="240"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder={isEnglish ? 'Short note (optional)' : '짧은 메모 (선택)'}
          disabled={loading}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            onClick={() => onSubmit({ reason, details })}
            disabled={loading}
          >
            {loading ? (isEnglish ? 'Sending...' : '보내는 중...') : (isEnglish ? 'Send' : '보내기')}
          </button>
        </div>

        <button type="button" className="min-h-12 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={onClose} disabled={loading}>
          {isEnglish ? 'Cancel' : '취소'}
        </button>
      </section>
    </div>
  )
}
