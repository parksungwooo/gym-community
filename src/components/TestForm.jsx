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
      className={`
        w-full p-5 text-left rounded-2xl border-2 transition-all duration-200
        flex items-center gap-3 hover:shadow-md touch-manipulation
        focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-emerald-300
        ${isSelected
          ? 'border-emerald-500 bg-emerald-50 shadow-sm scale-[1.02] animate-pop'
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
    >
      <div className={`
        w-8 h-8 rounded-2xl flex shrink-0 items-center justify-center text-xl font-bold
        ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}
      `}
      >
        {isSelected ? '✓' : ''}
      </div>
      <span className="text-lg font-medium leading-tight">{text}</span>
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div
          className="h-2 bg-gray-100 rounded-3xl overflow-hidden"
          role="progressbar"
          aria-label={isEnglish ? 'Fitness test progress' : '체력 테스트 진행률'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div
            className="h-full bg-emerald-500 transition-all duration-500 rounded-3xl"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span className="font-medium text-emerald-600">
            {isEnglish ? `${answeredCount} answered` : `${answeredCount}개 답변 완료`}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="bg-white rounded-3xl shadow-xl p-8 mb-8 animate-pop"
          data-testid={`test-question-${currentQuestion.id}`}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isEnglish ? `Question ${currentIndex + 1}` : `질문 ${currentIndex + 1}`}
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed mb-10">
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
              className="flex-1 py-5 text-lg font-semibold border-2 border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnglish ? '← Previous' : '← 이전'}
            </button>
          )}

          {isLastQuestion ? (
            <button
              type="submit"
              disabled={loading || !canSubmit}
              data-testid="test-submit"
              className="flex-1 py-5 text-lg font-semibold bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin" aria-hidden="true">⟳</span>
                  {isEnglish ? 'Calculating...' : '계산 중...'}
                </>
              ) : (
                isEnglish ? 'See My Level →' : '내 레벨 확인하기 →'
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading || currentAnswer == null}
              data-testid="test-next-question"
              className="flex-1 py-5 text-lg font-semibold bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnglish ? 'Next →' : '다음 →'}
            </button>
          )}
        </div>
      </form>

      <div className="sr-only" aria-live="polite">
        {isEnglish
          ? `${answeredCount} of ${questions.length} questions answered.`
          : `${questions.length}개 질문 중 ${answeredCount}개 답변 완료.`}
      </div>
    </div>
  )
}
