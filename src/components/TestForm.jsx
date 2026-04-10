import { useMemo, useState } from 'react'
import { getTestQuestions } from '../constants/questions'
import { useI18n } from '../i18n.js'

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[3]">
      <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowIcon({ direction = 'right' }) {
  const isLeft = direction === 'left'

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
      {isLeft ? (
        <>
          <path d="M19 12H5" strokeLinecap="round" />
          <path d="m12 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M5 12h14" strokeLinecap="round" />
          <path d="m12 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white"
    />
  )
}

function OptionButton({ isSelected, testId, text, onClick, optionIndex }) {
  const optionLetter = String.fromCharCode(65 + optionIndex)

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={isSelected}
      className={[
        'group flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left',
        'min-h-[72px] touch-manipulation transition-all duration-200',
        'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-emerald-300',
        isSelected
          ? 'scale-[1.01] border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/15 motion-safe:animate-[option-pop_180ms_ease-out]'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition-all duration-200',
          isSelected
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
            : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-700',
        ].join(' ')}
      >
        {isSelected ? <CheckIcon /> : optionLetter}
      </span>
      <span
        className={[
          'text-base font-extrabold leading-snug tracking-[-0.02em] transition-colors sm:text-lg',
          isSelected ? 'text-slate-950' : 'text-slate-700',
        ].join(' ')}
      >
        {text}
      </span>
    </button>
  )
}

export default function TestForm({ onSubmit, loading }) {
  const { language, isEnglish } = useI18n()
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const questions = useMemo(() => getTestQuestions(language), [language])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const totalQuestions = questions.length || 1
  const canSubmit = answeredCount === questions.length
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion?.id] ?? null
  const isLastQuestion = currentIndex === questions.length - 1
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }))
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    if (currentAnswer == null || isLastQuestion) return
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    const total = questions.reduce((sum, question) => sum + Number(answers[question.id] ?? 0), 0)
    onSubmit(total)
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-2xl text-slate-950">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-6">
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                {isEnglish ? 'Level Check' : '레벨 체크'}
              </span>
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-slate-950/15">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>

            <div
              className="h-3 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={isEnglish ? 'Test progress' : '테스트 진행률'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPercent)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_22px_rgba(0,212,170,0.35)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>{isEnglish ? `${Math.round(progressPercent)}% through` : `${Math.round(progressPercent)}% 진행`}</span>
              <span className="text-emerald-700">
                {isEnglish ? `${answeredCount} answered` : `${answeredCount}개 답변 완료`}
              </span>
            </div>
          </div>

          <article
            key={currentQuestion.id}
            data-testid={`test-question-${currentQuestion.id}`}
            aria-labelledby={`test-question-title-${currentQuestion.id}`}
            className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-5 shadow-inner shadow-white motion-safe:animate-[test-card-in_260ms_ease-out] sm:p-7"
          >
            <div className="mb-7 grid gap-3">
              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-500">
                {isEnglish ? `Question ${currentIndex + 1}` : `질문 ${currentIndex + 1}`}
              </span>
              <h2
                id={`test-question-title-${currentQuestion.id}`}
                className="m-0 text-2xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl"
              >
                {currentQuestion.question}
              </h2>
              <p className="m-0 text-sm font-semibold leading-6 text-slate-500">
                {currentAnswer == null
                  ? (isEnglish ? 'Choose the answer that fits you best.' : '지금 상태에 가장 가까운 답변을 골라주세요.')
                  : isLastQuestion
                    ? (isEnglish ? 'Great. You are ready to see your level.' : '좋아요. 이제 레벨을 확인할 준비가 됐어요.')
                    : (isEnglish ? 'Nice pick. Move to the next question.' : '선택 완료. 다음 질문으로 넘어갈 수 있어요.')}
              </p>
            </div>

            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => (
                <OptionButton
                  key={option.label}
                  testId={`test-option-${currentQuestion.id}-${index}`}
                  text={option.label}
                  optionIndex={index}
                  isSelected={currentAnswer === option.score}
                  onClick={() => handleAnswer(currentQuestion.id, option.score)}
                />
              ))}
            </div>
          </article>
        </div>

        <div className={`grid gap-3 ${currentIndex === 0 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[0.9fr_1.1fr]'}`}>
          {currentIndex > 0 && (
            <button
              type="button"
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-5 text-base font-black text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handlePrevious}
              disabled={loading}
              data-testid="test-prev-question"
            >
              <ArrowIcon direction="left" />
              {isEnglish ? 'Previous' : '이전'}
            </button>
          )}

          {isLastQuestion ? (
            <button
              type="submit"
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-base font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              disabled={loading || !canSubmit}
              data-testid="test-submit"
            >
              {loading ? (
                <>
                  <LoadingSpinner />
                  {isEnglish ? 'Calculating...' : '계산 중...'}
                </>
              ) : (
                <>
                  {isEnglish ? 'See My Level' : '내 레벨 확인하기'}
                  <ArrowIcon />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-base font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              onClick={handleNext}
              disabled={loading || currentAnswer == null}
              data-testid="test-next-question"
            >
              {isEnglish ? 'Next' : '다음'}
              <ArrowIcon />
            </button>
          )}
        </div>

        <div className="sr-only" aria-live="polite">
          {isEnglish
            ? `${answeredCount} of ${questions.length} questions answered.`
            : `${questions.length}개 질문 중 ${answeredCount}개 답변 완료.`}
        </div>
      </form>
    </section>
  )
}
