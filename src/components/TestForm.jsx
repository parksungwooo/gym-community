import { useMemo, useState } from 'react'
import { getTestQuestions } from '../constants/questions'
import { useI18n } from '../i18n.js'

function OptionButton({ isSelected, text, onClick }) {
  return (
    <button
      type="button"
      className={`option-btn ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export default function TestForm({ onSubmit, loading }) {
  const { language, isEnglish } = useI18n()
  const [answers, setAnswers] = useState({})
  const questions = useMemo(() => getTestQuestions(language), [language])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const canSubmit = answeredCount === questions.length

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => ({ ...prev, [questionId]: score }))
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
    <section className="card">
      <h2>{isEnglish ? '3-Min Fitness Level Test' : '3분 체력 레벨 테스트'}</h2>
      <p className="subtext">
        {isEnglish
          ? 'Check where you are now and set a starting point for your record.'
          : '가볍게 지금 상태를 확인하고, 기록의 출발점을 만들어보세요.'}
      </p>

      <form onSubmit={handleSubmit} className="question-form">
        {questions.map((item, index) => (
          <article key={item.id} className="question-card">
            <p className="question-title">Q{index + 1}. {item.question}</p>
            <div className="option-grid">
              {item.options.map((option) => (
                <OptionButton
                  key={option.label}
                  text={option.label}
                  isSelected={answers[item.id] === option.score}
                  onClick={() => handleAnswer(item.id, option.score)}
                />
              ))}
            </div>
          </article>
        ))}

        {!canSubmit && (
          <p className="subtext">
            {isEnglish
              ? `${questions.length - answeredCount} more answers to unlock your result.`
              : `아직 ${questions.length - answeredCount}개만 더 답하면 결과를 볼 수 있어요.`}
          </p>
        )}

        <button type="submit" className="primary-btn" disabled={loading || !canSubmit}>
          {loading ? (isEnglish ? 'Calculating...' : '결과 계산 중...') : isEnglish ? `See Result (${answeredCount}/${questions.length})` : `결과 보기 (${answeredCount}/${questions.length})`}
        </button>
      </form>
    </section>
  )
}

