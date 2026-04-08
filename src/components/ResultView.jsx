import { useI18n } from '../i18n.js'
import { getResultMessage, localizeLevelText } from '../utils/level'

export default function ResultView({ score, level, onStartWorkout }) {
  const { language, isEnglish } = useI18n()
  const levelValue = Number(String(level).match(/Lv(\d)/)?.[1] ?? 1)
  const message = getResultMessage(levelValue, language)
  const displayLevel = localizeLevelText(level, language)

  const handleShare = async () => {
    const shareText = isEnglish
      ? `My result: ${score} points, ${displayLevel}.`
      : `내 결과: ${score}점, ${displayLevel}.`

    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
      alert(isEnglish ? 'Link copied.' : '링크 복사됨.')
    } catch {
      alert(isEnglish ? 'Copy failed.' : '복사 실패.')
    }
  }

  return (
    <section className="card result-card">
      <span className="app-section-kicker">{isEnglish ? 'Level test' : '레벨 테스트'}</span>
      <h2>{isEnglish ? 'Result' : '결과'}</h2>
      <p className="score">{isEnglish ? `${score} pts` : `${score}점`}</p>
      <p className="level-pill">{displayLevel}</p>
      <p className="result-message">{message}</p>
      <p className="subtext">
        {isEnglish ? 'Now log today.' : '이제 오늘 기록만 남았어요.'}
      </p>

      <div className="result-actions">
        <button type="button" className="secondary-btn" onClick={handleShare}>
          {isEnglish ? 'Share' : '공유'}
        </button>
        <button type="button" className="primary-btn" onClick={onStartWorkout}>
          {isEnglish ? 'Log workout' : '운동 기록'}
        </button>
      </div>
    </section>
  )
}
