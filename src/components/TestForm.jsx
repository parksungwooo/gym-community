import { useMemo, useState } from 'react'
import { getTestQuestions } from '../constants/questions'
import { useI18n } from '../i18n.js'

function OptionButton({ isSelected, testId, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={isSelected}
      className={`flex min-h-16 w-full items-center gap-3 rounded-lg border p-4 text-left transition active:scale-[0.99] ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-50'
          : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-200 dark:hover:border-emerald-400'
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-black ${
          isSelected
            ? 'bg-emerald-700 text-white'
            : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'
        }`}
      >
        {isSelected ? 'OK' : ''}
      </span>
      <span className="flex-1 text-base font-bold leading-6">{text}</span>
    </button>
  )
}

export default function TestForm({ onSubmit, loading }) {
  const { isEnglish } = useI18n()
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)

  const questions = useMemo(() => getTestQuestions(isEnglish ? 'en' : 'ko'), [isEnglish])
  const answeredCount = Object.keys(answers).length
  const canSubmit = answeredCount === questions.length
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion?.id] ?? null
  const progressPercent = ((currentIndex + 1) / (questions.length || 1)) * 100

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }))
  }

  const handlePrevious = () => setCurrentIndex((prev) => Math.max(prev - 1, 0))
  const handleNext = () => {
    if (currentAnswer == null) return
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit || loading) return
    const total = questions.reduce((sum, question) => sum + Number(answers[question.id] ?? 0), 0)
    onSubmit(total)
  }

  if (!currentQuestion) return null

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div
          className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
          role="progressbar"
          aria-label={isEnglish ? 'Fitness test progress' : '체력 테스트 진행률'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div className="h-full rounded-full bg-emerald-700 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-black text-gray-700 dark:text-gray-100">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span className="text-emerald-800 dark:text-emerald-200">
            {isEnglish ? `${answeredCount} answered` : `${answeredCount}개 응답`}
          </span>
        </div>
      </section>

      <section
        className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6"
        data-testid={`test-question-${currentQuestion.id}`}
      >
        <div className="mb-6 grid gap-2">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
            {isEnglish ? `Question ${currentIndex + 1}` : `체크 ${currentIndex + 1}`}
          </span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">
            {currentQuestion.question}
          </h2>
        </div>

        <div className="grid gap-3">
          {currentQuestion.options.map((option, index) => (
            <OptionButton
              key={`${currentQuestion.id}-${index}`}
              testId={`test-option-${currentQuestion.id}-${index}`}
              isSelected={currentAnswer === option.score}
              text={option.text ?? option.label}
              onClick={() => handleAnswer(currentQuestion.id, option.score)}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {currentIndex > 0 ? (
          <button
            type="button"
            onClick={handlePrevious}
            data-testid="test-prev-question"
            className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10"
          >
            {isEnglish ? 'Previous' : '이전'}
          </button>
        ) : (
          <span aria-hidden="true" />
        )}

        {currentIndex === questions.length - 1 ? (
          <button
            type="submit"
            disabled={loading || !canSubmit}
            data-testid="test-submit"
            className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (isEnglish ? 'Calculating...' : '계산 중') : (isEnglish ? 'See my level' : '결과 보기')}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={currentAnswer == null}
            data-testid="test-next-question"
            className="min-h-12 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEnglish ? 'Next' : '다음'}
          </button>
        )}
      </div>
    </form>
  )
}
