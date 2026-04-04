import { useMemo, useState } from 'react'
import { getWorkoutTypeLabel, useI18n } from '../i18n.js'

const WORKOUT_OPTIONS = ['러닝', '웨이트', '스트레칭', '요가', '필라테스', '사이클', '기타']
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60]

function getWorkoutMark(type) {
  switch (type) {
    case '러닝': return 'RN'
    case '웨이트': return 'WT'
    case '스트레칭': return 'ST'
    case '요가': return 'YG'
    case '필라테스': return 'PL'
    case '사이클': return 'CY'
    default: return 'ET'
  }
}

export default function WorkoutPanel({
  onComplete,
  onSaveRoutine,
  onDeleteRoutine,
  onClose,
  loading,
  todayDone,
  todayCount = 0,
  recentWorkout,
  routineTemplates = [],
  initialSelection = null,
}) {
  const { language, isEnglish } = useI18n()
  const [workoutType, setWorkoutType] = useState(() => initialSelection?.workoutType || '러닝')
  const [durationMinutes, setDurationMinutes] = useState(() => String(initialSelection?.durationMinutes || 30))
  const [note, setNote] = useState(() => initialSelection?.note || '')
  const [routineName, setRoutineName] = useState(() => initialSelection?.name || '')

  const noteHint = useMemo(() => {
    if (workoutType === '러닝') {
      return isEnglish ? 'ex: Park 3km, pace felt steady' : '예: 공원 3km, 페이스 괜찮았음'
    }

    if (workoutType === '웨이트') {
      return isEnglish ? 'ex: Lower body 40 min, focused on squats' : '예: 하체 40분, 스쿼트 집중'
    }

    return isEnglish
      ? 'ex: Leave a short note about how your body felt today'
      : '예: 오늘 몸 상태나 운동 느낌을 짧게 남겨보세요'
  }, [isEnglish, workoutType])

  const handleSubmit = async (event) => {
    event.preventDefault()

    await onComplete({
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      note: note.trim(),
    })

    setWorkoutType(recentWorkout?.workoutType || initialSelection?.workoutType || '러닝')
    setDurationMinutes(String(recentWorkout?.durationMinutes || initialSelection?.durationMinutes || 30))
    setNote('')
  }

  const handleReuseRecent = () => {
    if (!recentWorkout?.workoutType) return

    setWorkoutType(recentWorkout.workoutType)
    setDurationMinutes(String(recentWorkout.durationMinutes || 30))
    setNote(recentWorkout.note || '')
  }

  const handleApplyRoutine = (routine) => {
    setWorkoutType(routine.workout_type || '러닝')
    setDurationMinutes(String(routine.duration_minutes || 30))
    setNote(routine.note || '')
    setRoutineName(routine.name || '')
  }

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) return

    await onSaveRoutine({
      name: routineName.trim(),
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      note: note.trim(),
    })
  }

  return (
    <section className="card workout-capture-card compact">
      <div className="sheet-handle" />

      <div className="workout-capture-header compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Workout Sheet' : '운동 입력 시트'}</span>
          <h2>{isEnglish ? "Log Today's Workout" : '오늘 운동 기록하기'}</h2>
          <p className="subtext compact">
            {isEnglish
              ? 'Keep it short. Type and time are enough to save today.'
              : '짧게 적어도 충분해요. 운동 종류와 시간만 있어도 오늘 기록은 완성됩니다.'}
          </p>
        </div>

        <div className="capture-header-actions">
          <span className={`capture-status ${todayDone ? 'done' : ''}`}>
            {todayDone
              ? (isEnglish ? 'More logs available today' : '오늘은 추가 기록 가능')
              : (isEnglish ? 'Ready to log' : '지금 기록 가능')}
          </span>
          {onClose ? (
            <button type="button" className="sheet-close-btn" onClick={onClose} disabled={loading}>
              {isEnglish ? 'Close' : '닫기'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="sheet-summary-bar compact">
        <div className="capture-helper-card compact">
          <span className="capture-helper-label">{isEnglish ? "Today's Logs" : '오늘 기록 수'}</span>
          <strong className="capture-helper-value">
            {isEnglish ? `${todayCount}` : `${todayCount}개`}
          </strong>
        </div>

        {recentWorkout?.workoutType && (
          <button type="button" className="reuse-workout-btn compact" onClick={handleReuseRecent} disabled={loading}>
            {isEnglish ? 'Reuse Latest Workout' : '최근 운동 다시 쓰기'}
            <span>
              <span className="reuse-inline-mark">{getWorkoutMark(recentWorkout.workoutType)}</span>
              {getWorkoutTypeLabel(recentWorkout.workoutType, language)}
              {recentWorkout.durationMinutes
                ? isEnglish
                  ? ` · ${recentWorkout.durationMinutes} min`
                  : ` · ${recentWorkout.durationMinutes}분`
                : ''}
            </span>
          </button>
        )}
      </div>

      <section className="sheet-section routine-section compact">
        <div className="routine-header-row">
          <span className="field-label-text">{isEnglish ? 'Saved Routines' : '저장된 루틴'}</span>
          <span className="routine-count-pill">
            {isEnglish ? `${routineTemplates.length} saved` : `${routineTemplates.length}개 저장됨`}
          </span>
        </div>

        <div className="routine-save-row compact">
          <label className="field-label routine-name-field">
            <span className="field-label-text">{isEnglish ? 'Routine Name' : '루틴 이름'}</span>
            <input
              className="workout-input compact"
              type="text"
              maxLength="20"
              placeholder={isEnglish ? 'ex: Morning Run' : '예: 아침 러닝'}
              value={routineName}
              onChange={(event) => setRoutineName(event.target.value)}
              disabled={loading}
            />
          </label>

          <button
            type="button"
            className="secondary-btn routine-save-btn compact"
            onClick={handleSaveRoutine}
            disabled={loading || !routineName.trim()}
          >
            {isEnglish ? 'Save Current Routine' : '현재 조합 저장'}
          </button>
        </div>

        {routineTemplates.length > 0 ? (
          <div className="routine-template-list compact">
            {routineTemplates.map((routine) => (
              <div key={routine.id} className="routine-template-shell">
                <button
                  type="button"
                  className="routine-template-card compact"
                  onClick={() => handleApplyRoutine(routine)}
                  disabled={loading}
                >
                  <div className="routine-template-top">
                    <span className="workout-mark quick">{getWorkoutMark(routine.workout_type || '기타')}</span>
                    <div className="routine-template-copy">
                      <strong>{routine.name}</strong>
                      <span>
                        {getWorkoutTypeLabel(routine.workout_type, language)}
                        {routine.duration_minutes
                          ? isEnglish
                            ? ` · ${routine.duration_minutes} min`
                            : ` · ${routine.duration_minutes}분`
                          : ''}
                      </span>
                    </div>
                  </div>
                  {routine.note && <p className="routine-template-note">{routine.note}</p>}
                </button>

                <button
                  type="button"
                  className="mini-btn danger routine-delete-btn"
                  onClick={() => onDeleteRoutine(routine.id)}
                  disabled={loading}
                >
                  {isEnglish ? 'Delete' : '삭제'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="routine-empty-card compact">
            <strong>{isEnglish ? 'Save the combinations you repeat often' : '자주 쓰는 조합을 저장해보세요'}</strong>
            <p>
              {isEnglish
                ? 'Once saved, the next workout can start in one tap.'
                : '한 번 저장해두면 다음 운동은 한 번에 바로 시작할 수 있어요.'}
            </p>
          </div>
        )}
      </section>

      <form className="workout-form" onSubmit={handleSubmit}>
        <section className="sheet-section quick-choice-section compact">
          <span className="field-label-text">{isEnglish ? 'Common Workouts' : '자주 하는 운동'}</span>
          <div className="quick-chip-row compact">
            {WORKOUT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`quick-choice-chip compact ${workoutType === option ? 'active' : ''}`}
                onClick={() => setWorkoutType(option)}
                disabled={loading}
              >
                <span className="quick-chip-mark">{getWorkoutMark(option)}</span>
                {getWorkoutTypeLabel(option, language)}
              </button>
            ))}
          </div>
        </section>

        <section className="sheet-section quick-choice-section compact">
          <span className="field-label-text">{isEnglish ? 'Duration' : '운동 시간'}</span>
          <div className="quick-chip-row compact">
            {QUICK_DURATION_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`quick-choice-chip compact ${Number(durationMinutes) === value ? 'active' : ''}`}
                onClick={() => setDurationMinutes(String(value))}
                disabled={loading}
              >
                {isEnglish ? `${value} min` : `${value}분`}
              </button>
            ))}
          </div>
        </section>

        <div className="sheet-section capture-field-grid-sheet compact">
          <div className="capture-field-grid">
            <label className="field-label">
              <span className="field-label-text">{isEnglish ? 'Workout Type' : '운동 종류 직접 선택'}</span>
              <select
                className="workout-select compact"
                value={workoutType}
                onChange={(event) => setWorkoutType(event.target.value)}
                disabled={loading}
              >
                {WORKOUT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{getWorkoutTypeLabel(option, language)}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              <span className="field-label-text">{isEnglish ? 'Duration (min)' : '운동 시간(분)'}</span>
              <input
                className="workout-input compact"
                type="number"
                min="0"
                max="300"
                step="5"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <label className="field-label sheet-section compact">
          <span className="field-label-text">{isEnglish ? 'Quick Note' : '한 줄 메모'}</span>
          <textarea
            className="workout-textarea compact"
            rows="3"
            maxLength="120"
            placeholder={noteHint}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={loading}
          />
        </label>

        <div className="sheet-submit-bar compact">
          <div className="sheet-submit-copy">
            <strong>{getWorkoutTypeLabel(workoutType, language)}</strong>
            <span>
              {Number(durationMinutes)
                ? (isEnglish ? `${durationMinutes} min planned` : `${durationMinutes}분 기록 예정`)
                : (isEnglish ? 'Duration not set' : '시간 미설정')}
            </span>
          </div>
          <button type="submit" className="primary-btn capture-submit-btn compact" disabled={loading}>
            {loading
              ? (isEnglish ? 'Saving workout...' : '기록 저장 중...')
              : todayDone
                ? (isEnglish ? 'Save Another Workout Today' : '오늘 운동 추가 저장')
                : (isEnglish ? "Save Today's Workout" : '오늘 운동 기록 저장')}
          </button>
        </div>
      </form>
    </section>
  )
}
