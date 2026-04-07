import { useI18n } from '../i18n.js'
import { getResultMessage, localizeLevelText } from '../utils/level'

export default function ResultView({ score, level, onStartWorkout }) {
  const { language, isEnglish } = useI18n()
  const levelValue = Number(String(level).match(/Lv(\d)/)?.[1] ?? 1)
  const message = getResultMessage(levelValue, language)
  const displayLevel = localizeLevelText(level, language)

  const handleShare = async () => {
    const shareText = isEnglish
      ? `My fitness level result: ${score} points, ${displayLevel}. Try yours too!`
      : `내 체력 테스트 결과: ${score}점, ${displayLevel}. 너도 테스트해봐!`

    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
      alert(isEnglish ? 'Result link copied!' : '결과 링크가 복사됐어요!')
    } catch {
      alert(isEnglish ? 'Copy failed. Please check browser permissions.' : '복사에 실패했어요. 브라우저 권한을 확인해주세요.')
    }
  }

  return (
    <section className="card result-card">
      <h2>{isEnglish ? 'Test Result' : '테스트 결과'}</h2>
      <p className="score">{isEnglish ? `${score} pts` : `${score}점`}</p>
      <p className="level-pill">{displayLevel}</p>
      <p className="result-message">{message}</p>
      <p className="subtext">
        {isEnglish ? 'From here, one workout today matters more than the number.' : '지금부터는 점수보다 오늘 한 번의 기록이 더 중요해요.'}
      </p>

      <div className="result-actions">
        <button type="button" className="secondary-btn" onClick={handleShare}>
          {isEnglish ? 'Share Result' : '결과 공유하기'}
        </button>
        <button type="button" className="primary-btn" onClick={onStartWorkout}>
          {isEnglish ? 'Log Today\'s Workout' : '오늘 운동 기록하기'}
        </button>
      </div>
    </section>
  )
}

