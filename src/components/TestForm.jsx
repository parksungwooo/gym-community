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

function SpinnerIcon() {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white"
    />
  )
}

function OptionButton({ isSelected, testId, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={isSelected}
      className={`
        flex w-full touch-manipulation items-center gap-3 rounded-2xl border-2 p-5 text-left
        transition-all duration-200 hover:shadow-md
        focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-emerald-300
        ${isSelected
          ? 'scale-[1.02] border-emerald-500 bg-emerald-50 shadow-sm animate-pop'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      <span
        className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xl font-bold
          ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}
        `}
      >
        {isSelected ? <CheckIcon /> : null}
      </span>
      <span className="text-lg font-medium leading-tight text-gray-900">{text}</span>
    </button>
  )
}

export default function TestForm({ onSubmit, loading }) {
  const { language, isEnglish } = useI18n()
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)

  const questions = useMemo(() => getTestQuestions(language), [language])
  const answeredCount = Object.keys(answers).length
  const canSubmit = answeredCount === questions.length
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion?.id] ?? null
  const isLastQuestion = currentIndex === questions.length - 1
  const progressPercent = ((currentIndex + 1) / (questions.length || 1)) * 100

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }))
  }

  const handlePrevious = () => setCurrentIndex((prev) => Math.max(prev - 1, 0))

  const handleNext = () => {
    if (currentAnswer == null || isLastQuestion) return
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return

    const total = questions.reduce((sum, question) => sum + Number(answers[question.id] ?? 0), 0)
    onSubmit(total)
  }

  if (!currentQuestion) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <div
          className="h-2 overflow-hidden rounded-3xl bg-gray-100"
          role="progressbar"
          aria-label={isEnglish ? 'Fitness test progress' : '\uCCB4\uB825 \uD14C\uC2A4\uD2B8 \uC9C4\uD589\uB960'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div
            className="h-full rounded-3xl bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span className="font-medium text-emerald-600">
            {isEnglish ? `${answeredCount} answered` : `${answeredCount}\uAC1C \uB2F5\uBCC0 \uC644\uB8CC`}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="mb-8 rounded-3xl bg-white p-8 shadow-xl animate-pop"
          data-testid={`test-question-${currentQuestion.id}`}
        >
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {isEnglish ? `Question ${currentIndex + 1}` : `\uC9C8\uBB38 ${currentIndex + 1}`}
          </h2>
          <p className="mb-10 text-xl leading-relaxed text-gray-700">
            {currentQuestion.question}
          </p>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => (
              <OptionButton
                key={option.label}
                testId={`test-option-${currentQuestion.id}-${index}`}
                isSelected={currentAnswer === option.score}
                text={option.label}
                onClick={() => handleAnswer(currentQuestion.id, option.score)}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={loading}
              data-testid="test-prev-question"
              className="flex-1 rounded-2xl border-2 border-gray-300 py-5 text-lg font-semibold transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEnglish ? '<- Previous' : '<- \uC774\uC804'}
            </button>
          )}

          {isLastQuestion ? (
            <button
              type="submit"
              disabled={loading || !canSubmit}
              data-testid="test-submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-5 text-lg font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  {isEnglish ? 'Calculating...' : '\uACC4\uC0B0 \uC911...'}
                </>
              ) : (
                isEnglish ? 'See My Level ->' : '\uB0B4 \uB808\uBCA8 \uD655\uC778\uD558\uAE30 ->'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || currentAnswer == null}
              data-testid="test-next-question"
              className="flex-1 rounded-2xl bg-emerald-500 py-5 text-lg font-semibold text-white transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEnglish ? 'Next ->' : '\uB2E4\uC74C ->'}
            </button>
          )}
        </div>
      </form>

      <div className="sr-only" aria-live="polite">
        {isEnglish
          ? `${answeredCount} of ${questions.length} questions answered.`
          : `${questions.length}\uAC1C \uC9C8\uBB38 \uC911 ${answeredCount}\uAC1C \uB2F5\uBCC0 \uC644\uB8CC.`}
      </div>
    </div>
  )
}
