import { useMemo, useState } from 'react';
import { getTestQuestions } from '../constants/questions';
import { useI18n } from '../i18n.js';

function OptionButton({ isSelected, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-5 text-left rounded-3xl border-2 transition-all duration-200
        flex items-center gap-3 hover:shadow-md active:scale-95
        ${isSelected 
          ? 'border-emerald-500 bg-emerald-50 shadow-emerald-200 scale-[1.02]' 
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
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-100 rounded-3xl overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 rounded-3xl"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{currentIndex + 1} / {questions.length}</span>
          <span className="font-medium text-emerald-600">{answeredCount} answered</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEnglish ? `Question ${currentIndex + 1}` : `질문 ${currentIndex + 1}`}
        </h2>
        <p className="text-xl text-gray-700 leading-relaxed mb-10">
          {currentQuestion.question}
        </p>

        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <OptionButton
              key={index}
              isSelected={currentAnswer === option.score}
              text={option.text}
              onClick={() => handleAnswer(currentQuestion.id, option.score)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="flex-1 py-5 text-lg font-semibold border-2 border-gray-300 rounded-3xl hover:bg-gray-50 transition-colors"
          >
            {isEnglish ? '← Previous' : '← 이전'}
          </button>
        )}

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="flex-1 py-5 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 animate-pop"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                {isEnglish ? 'Calculating...' : '계산 중...'}
              </>
            ) : (
              isEnglish ? 'See My Level →' : '내 레벨 확인하기 →'
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="flex-1 py-5 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnglish ? 'Next →' : '다음 →'}
          </button>
        )}
      </div>
    </div>
  );
}
