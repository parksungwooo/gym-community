import { useMemo, useState } from 'react'
import { getTestQuestions } from '../constants/questions'
import { useI18n } from '../i18n.js'

function OptionButton({ isSelected, testId, text, onClick }) {
  return (
    <button
      type="button"
      className={`option-btn ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      data-testid={testId}
    >
      {text}
    </button>
  )
}

export default function TestForm({ onSubmit, loading }) {
  const { language, isEnglish } = useI18n()
  const [answers, setAnswers] = useState({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const questions = useMemo(() => getTestQuestions(language), [language])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const canSubmit = answeredCount === questions.length
  const currentQuestion = questions[currentIndex]
  const currentAnswer = answers[currentQuestion?.id] ?? null
  const isLastQuestion = currentIndex === questions.length - 1
  const progressPercent = ((currentIndex + 1) / questions.length) * 100

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

  return (
    <section className="card record-test-card">
      <div className="record-test-head">
        <div className="record-test-copy">
          <span className="app-section-kicker">{isEnglish ? 'Quick check' : '빠른 체크'}</span>
          <h2>{isEnglish ? '3-Min Level Test' : '3분 레벨 테스트'}</h2>
          <p className="subtext">
            {isEnglish ? 'One question at a time.' : '한 문제씩 답해요.'}
          </p>
        </div>
        <span className="record-test-progress">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <div className="record-test-progressbar" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <form onSubmit={handleSubmit} className="question-form">
        <article key={currentQuestion.id} className="question-card" data-testid={`test-question-${currentQuestion.id}`}>
          <div className="question-head">
            <span className="question-label">Q{currentIndex + 1}</span>
            <p className="question-title">{currentQuestion.question}</p>
          </div>
          <div className="option-grid">
            {currentQuestion.options.map((option, index) => (
              <OptionButton
                key={option.label}
                testId={`test-option-${currentQuestion.id}-${index}`}
                text={option.label}
                isSelected={currentAnswer === option.score}
                onClick={() => handleAnswer(currentQuestion.id, option.score)}
              />
            ))}
          </div>
        </article>

        <div className="record-test-step-copy">
          <p className="subtext record-test-note">
            {currentAnswer == null
              ? (isEnglish ? 'Pick one.' : '하나 선택')
              : isLastQuestion
                ? (isEnglish ? 'Last one.' : '마지막 질문')
                : (isEnglish ? `${answeredCount} done.` : `${answeredCount}개 완료`)}
          </p>
        </div>

        <div className={`record-test-actions ${currentIndex === 0 ? 'single' : ''}`}>
          {currentIndex > 0 && (
            <button
              type="button"
              className="ghost-btn"
              onClick={handlePrevious}
              disabled={loading}
              data-testid="test-prev-question"
            >
              {isEnglish ? 'Previous' : '이전'}
            </button>
          )}

          {isLastQuestion ? (
            <button type="submit" className="primary-btn" disabled={loading || !canSubmit} data-testid="test-submit">
              {loading ? (isEnglish ? 'Calculating...' : '계산 중...') : (isEnglish ? 'See result' : '결과 보기')}
            </button>
          ) : (
            <button
              type="button"
              className="primary-btn"
              onClick={handleNext}
              disabled={loading || currentAnswer == null}
              data-testid="test-next-question"
            >
              {isEnglish ? 'Next' : '다음'}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
