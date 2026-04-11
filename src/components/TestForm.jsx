import { useMemo, useState } from 'react';
import { getTestQuestions } from '../constants/questions';
import { useI18n } from '../i18n.js';

function OptionButton({ isSelected, testId, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={isSelected}
      className={`
        test-option-btn w-full p-5 text-left rounded-3xl border-2 transition-all duration-200
        flex items-center gap-3 hover:shadow-md active:scale-95
        focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-emerald-300
        ${isSelected 
          ? 'border-emerald-500 bg-emerald-50 shadow-emerald-200 scale-[1.02] animate-pop'
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
    >
      <div className={`
        w-9 h-9 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all
        ${isSelected 
          ? 'bg-emerald-500 text-white scale-110' 
          : 'bg-gray-100 text-gray-400'
        }
      `}>
        {isSelected ? '✓' : ''}
      </div>
      <span className="text-lg font-medium leading-tight flex-1">{text}</span>
    </button>
  );
}

export default function TestForm({ onSubmit, loading }) {
  const { isEnglish } = useI18n();
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = useMemo(() => getTestQuestions(isEnglish ? 'en' : 'ko'), [isEnglish]);
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === questions.length;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id] ?? null;
  const progressPercent = ((currentIndex + 1) / (questions.length || 1)) * 100;

  const handleAnswer = (questionId, score) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const handlePrevious = () => setCurrentIndex(prev => Math.max(prev - 1, 0));
  const handleNext = () => {
    if (!currentAnswer) return;
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    const total = questions.reduce((sum, q) => sum + Number(answers[q.id] ?? 0), 0);
    onSubmit(total);
  };

  return (
    <div className="screen-flow screen-flow-test app-screen-flow app-screen-flow-test">
      <div className="test-progress-card mb-8">
        <div
          className="h-2 bg-gray-100 rounded-3xl overflow-hidden"
          role="progressbar"
          aria-label={isEnglish ? 'Fitness test progress' : '체력 테스트 진행률'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPercent)}
        >
          <div className="h-full bg-emerald-500 transition-all duration-500 rounded-3xl" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span className="font-medium text-emerald-600">
            {isEnglish ? `${answeredCount} answered` : `${answeredCount}개 답변`}
          </span>
        </div>
      </div>

      <div
        className="product-glass-card app-clean-card test-question-card bg-white rounded-3xl shadow-xl p-8 mb-8 animate-pop"
        data-testid={`test-question-${currentQuestion.id}`}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEnglish ? `Question ${currentIndex + 1}` : `체크 ${currentIndex + 1}`}
        </h2>
        <p className="text-xl text-gray-700 leading-relaxed mb-10">
          {currentQuestion.question}
        </p>

        <div className="space-y-4">
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
      </div>

      <div className="test-action-row flex gap-4">
        {currentIndex > 0 && (
          <button type="button" onClick={handlePrevious} data-testid="test-prev-question" className="secondary-btn test-nav-btn flex-1 py-5 text-lg font-semibold border-2 border-gray-300 rounded-3xl hover:bg-gray-50 transition-colors">
            {isEnglish ? '← Previous' : '← 이전'}
          </button>
        )}
        {currentIndex === questions.length - 1 ? (
          <button type="button" onClick={handleSubmit} disabled={loading || !canSubmit} data-testid="test-submit" className="primary-btn test-nav-btn flex-1 py-5 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all disabled:opacity-50 animate-pop">
            {loading ? (isEnglish ? 'Calculating...' : '계산 중') : (isEnglish ? 'See My Level →' : '결과 보기 →')}
          </button>
        ) : (
          <button type="button" onClick={handleNext} disabled={!currentAnswer} data-testid="test-next-question" className="primary-btn test-nav-btn flex-1 py-5 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all disabled:opacity-50">
            {isEnglish ? 'Next →' : '다음 →'}
          </button>
        )}
      </div>
    </div>
  );
}
