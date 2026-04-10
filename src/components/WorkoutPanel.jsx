import { useEffect, useMemo, useRef, useState } from 'react'
import { getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'

const WORKOUT_OPTIONS = ['러닝', '웨이트', '스트레칭', '요가', '필라테스', '사이클', '기타']
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60]
const MAX_PHOTOS = 4

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

function buildNewPhotoItems(files) {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'new',
    file,
    previewUrl: URL.createObjectURL(file),
    label: file.name,
  }))
}

function moveItem(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length) return items
  const next = [...items]
  const [picked] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, picked)
  return next
}

function PhotoProofList({ items, isEnglish, onRemove, onMove }) {
  if (!items.length) {
    return (
      <div className="photo-proof-empty">
        <strong>{isEnglish ? 'No photos' : '사진 없음'}</strong>
        <p>
          {isEnglish
            ? 'Camera asks on tap.'
            : '카메라는 눌릴 때만 물어요.'}
        </p>
      </div>
    )
  }

  return (
    <div className="photo-proof-grid">
      {items.map((item, index) => (
        <article key={item.id} className="photo-proof-preview multi">
          <OptimizedImage
            imageUrl={item.previewUrl}
            preset="panelThumbnail"
            alt={isEnglish ? 'Workout proof preview' : '운동 인증 사진 미리보기'}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 640px) 40vw, 160px"
          />
          <div className="photo-proof-meta">
            <span>{item.label}</span>
            <div className="photo-proof-meta-actions">
              <button type="button" className="mini-btn" onClick={() => onMove(index, index - 1)} disabled={index === 0}>
                {isEnglish ? 'Up' : '앞'}
              </button>
              <button type="button" className="mini-btn" onClick={() => onMove(index, index + 1)} disabled={index === items.length - 1}>
                {isEnglish ? 'Down' : '뒤'}
              </button>
              <button type="button" className="mini-btn danger" onClick={() => onRemove(index)}>
                {isEnglish ? 'Remove' : '제거'}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
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
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [workoutType, setWorkoutType] = useState(() => initialSelection?.workoutType || '러닝')
  const [durationMinutes, setDurationMinutes] = useState(() => String(initialSelection?.durationMinutes || 30))
  const [note, setNote] = useState(() => initialSelection?.note || '')
  const [routineName, setRoutineName] = useState(() => initialSelection?.name || '')
  const [photoItems, setPhotoItems] = useState([])
  const [shareToFeed, setShareToFeed] = useState(() => initialSelection?.defaultShareToFeed !== false)
  const [showRoutineTools, setShowRoutineTools] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(initialSelection?.note || initialSelection?.defaultShareToFeed === false),
  )

  useEffect(() => () => {
    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
  }, [photoItems])

  const noteHint = useMemo(() => {
    if (workoutType === '러닝') {
      return isEnglish ? 'ex: Park 3km, steady' : '예: 공원 3km, 안정적'
    }

    if (workoutType === '웨이트') {
      return isEnglish ? 'ex: Lower body 40 min, squats' : '예: 하체 40분, 스쿼트'
    }

    return isEnglish
      ? 'ex: Felt light today'
      : '예: 오늘 몸이 가벼웠어요'
  }, [isEnglish, workoutType])

  const resetForm = () => {
    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setWorkoutType(recentWorkout?.workoutType || initialSelection?.workoutType || '러닝')
    setDurationMinutes(String(recentWorkout?.durationMinutes || initialSelection?.durationMinutes || 30))
    setNote('')
    setPhotoItems([])
    setShareToFeed(initialSelection?.defaultShareToFeed !== false)
    setShowRoutineTools(false)
    setShowOptionalFields(false)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const result = await onComplete({
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      note: note.trim(),
      photoItems,
      shareToFeed,
    })

    if (result !== false) {
      resetForm()
    }
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
    setShowRoutineTools(false)
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

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (!nextFiles.length) return

    setPhotoItems((prev) => [...prev, ...buildNewPhotoItems(nextFiles)].slice(0, MAX_PHOTOS))
    event.target.value = ''
  }

  const handleRemovePhoto = (targetIndex) => {
    setPhotoItems((prev) => {
      const target = prev[targetIndex]
      if (target?.kind === 'new' && target.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, index) => index !== targetIndex)
    })
  }

  const handleMovePhoto = (fromIndex, toIndex) => {
    setPhotoItems((prev) => moveItem(prev, fromIndex, toIndex))
  }

  return (
    <section className="card workout-capture-card compact">
      <div className="sheet-handle" />

      <div className="workout-capture-header compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Workout Sheet' : '운동 기록'}</span>
          <h2>{isEnglish ? 'Workout Log' : '운동 기록'}</h2>
          <p className="subtext compact">
            {isEnglish
              ? 'Type and time are enough.'
              : '종류와 시간만 적으면 돼요.'}
          </p>
        </div>

        <div className="capture-header-actions">
          <span className={`capture-status subtle ${todayDone ? 'done' : ''}`}>
            {todayDone ? (isEnglish ? 'More available' : '추가 가능') : (isEnglish ? 'Ready' : '준비됨')}
          </span>
          {onClose ? (
            <button type="button" className="sheet-close-btn" onClick={onClose} disabled={loading}>
              {isEnglish ? 'Close' : '닫기'}
            </button>
          ) : null}
        </div>
      </div>

      <form className="workout-form" onSubmit={handleSubmit}>
        <section className="sheet-tool-row compact">
          <button
            type="button"
            className={`sheet-tool-toggle ${showRoutineTools ? 'active' : ''}`}
            onClick={() => setShowRoutineTools((prev) => !prev)}
            disabled={loading}
          >
            {isEnglish ? 'Routines' : '루틴'}
          </button>
          <button
            type="button"
            className={`sheet-tool-toggle ${showOptionalFields ? 'active' : ''}`}
            onClick={() => setShowOptionalFields((prev) => !prev)}
            disabled={loading}
          >
            {isEnglish ? 'Extras' : '옵션'}
          </button>
        </section>

        <section className="sheet-section quick-choice-section compact">
          <span className="field-label-text">{isEnglish ? 'Quick Picks' : '빠른 선택'}</span>
          <div className="quick-chip-row compact">
            {WORKOUT_OPTIONS.map((option) => (
              <button key={option} type="button" className={`quick-choice-chip compact ${workoutType === option ? 'active' : ''}`} onClick={() => setWorkoutType(option)} disabled={loading}>
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
              <button key={value} type="button" className={`quick-choice-chip compact ${Number(durationMinutes) === value ? 'active' : ''}`} onClick={() => setDurationMinutes(String(value))} disabled={loading}>
                {isEnglish ? `${value} min` : `${value}분`}
              </button>
            ))}
          </div>
        </section>

        <div className="sheet-section capture-field-grid-sheet compact">
          <div className="capture-field-grid">
            <label className="field-label">
              <span className="field-label-text">{isEnglish ? 'Workout Type' : '직접 선택'}</span>
              <select className="workout-select compact" value={workoutType} onChange={(event) => setWorkoutType(event.target.value)} disabled={loading}>
                {WORKOUT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{getWorkoutTypeLabel(option, language)}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              <span className="field-label-text">{isEnglish ? 'Duration (min)' : '운동 시간(분)'}</span>
              <input className="workout-input compact" type="number" min="0" max="300" step="5" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} disabled={loading} />
            </label>
          </div>
        </div>

        <div className="sheet-summary-bar compact">
          <div className="capture-helper-card compact">
            <span className="capture-helper-label">{isEnglish ? "Today's Logs" : '오늘 기록'}</span>
            <strong className="capture-helper-value">{todayCount}</strong>
          </div>

          {recentWorkout?.workoutType && (
            <button type="button" className="reuse-workout-btn compact" onClick={handleReuseRecent} disabled={loading}>
              {isEnglish ? 'Recent Log' : '최근 기록'}
              <span>
                <span className="reuse-inline-mark">{getWorkoutMark(recentWorkout.workoutType)}</span>
                {getWorkoutTypeLabel(recentWorkout.workoutType, language)}
                {recentWorkout.durationMinutes ? (isEnglish ? ` · ${recentWorkout.durationMinutes} min` : ` · ${recentWorkout.durationMinutes}분`) : ''}
              </span>
            </button>
          )}
        </div>

        {showRoutineTools && (
          <section className="sheet-section routine-section compact">
            <div className="routine-header-row">
              <span className="field-label-text">{isEnglish ? 'Routines' : '루틴'}</span>
              <span className="routine-count-pill">{isEnglish ? `${routineTemplates.length}` : `${routineTemplates.length}개`}</span>
            </div>

            <div className="routine-save-row compact">
              <label className="field-label routine-name-field">
                <span className="field-label-text">{isEnglish ? 'Name' : '이름'}</span>
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

              <button type="button" className="secondary-btn routine-save-btn compact" onClick={handleSaveRoutine} disabled={loading || !routineName.trim()}>
                {isEnglish ? 'Save' : '저장'}
              </button>
            </div>

            {routineTemplates.length > 0 ? (
              <div className="routine-template-list compact">
                {routineTemplates.map((routine) => (
                  <div key={routine.id} className="routine-template-shell">
                    <button type="button" className="routine-template-card compact" onClick={() => handleApplyRoutine(routine)} disabled={loading}>
                      <div className="routine-template-top">
                        <span className="workout-mark quick">{getWorkoutMark(routine.workout_type || '기타')}</span>
                        <div className="routine-template-copy">
                          <strong>{routine.name}</strong>
                          <span>
                            {getWorkoutTypeLabel(routine.workout_type, language)}
                            {routine.duration_minutes ? (isEnglish ? ` · ${routine.duration_minutes} min` : ` · ${routine.duration_minutes}분`) : ''}
                          </span>
                        </div>
                      </div>
                      {routine.note && <p className="routine-template-note">{routine.note}</p>}
                    </button>

                    <button type="button" className="mini-btn danger routine-delete-btn" onClick={() => onDeleteRoutine(routine.id)} disabled={loading}>
                      {isEnglish ? 'Delete' : '삭제'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="routine-empty-card compact">
                <strong>{isEnglish ? 'Save a combo' : '조합 저장'}</strong>
                <p>{isEnglish ? 'Start faster next time.' : '다음엔 더 빨라요.'}</p>
              </div>
            )}
          </section>
        )}

        {showOptionalFields && (
          <>
            <label className="field-label sheet-section compact">
              <span className="field-label-text">{isEnglish ? 'Note' : '메모'}</span>
              <textarea className="workout-textarea compact" rows="3" maxLength="120" placeholder={noteHint} value={note} onChange={(event) => setNote(event.target.value)} disabled={loading} />
            </label>

            <section className="sheet-section compact">
              <div className="photo-proof-header">
                <span className="field-label-text">{isEnglish ? 'Photos' : '사진'}</span>
                <span className="photo-proof-helper">
                  {isEnglish ? `Up to ${MAX_PHOTOS}.` : `최대 ${MAX_PHOTOS}장`}
                </span>
              </div>

              <div className="photo-proof-actions">
                <button type="button" className="secondary-btn photo-proof-btn" onClick={() => galleryInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>
                  {isEnglish ? 'Photos' : '사진'}
                </button>
                <button type="button" className="ghost-btn photo-proof-btn" onClick={() => cameraInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>
                  {isEnglish ? 'Camera' : '카메라'}
                </button>
                <span className="photo-proof-count">{isEnglish ? `${photoItems.length}/${MAX_PHOTOS}` : `${photoItems.length}/${MAX_PHOTOS}장`}</span>
              </div>

              <input ref={galleryInputRef} className="hidden-file-input" type="file" accept="image/*" multiple onChange={handleFileChange} />
              <input ref={cameraInputRef} className="hidden-file-input" type="file" accept="image/*" capture="environment" multiple onChange={handleFileChange} />

              <PhotoProofList items={photoItems} isEnglish={isEnglish} onRemove={handleRemovePhoto} onMove={handleMovePhoto} />
            </section>

            <section className="sheet-section compact">
              <div className="feed-share-row">
                <div>
                  <span className="field-label-text">{isEnglish ? 'Share to Feed' : '피드 공개'}</span>
                  <p className="photo-proof-helper">
                    {isEnglish ? 'Off for private.' : '끄면 비공개'}
                  </p>
                </div>
                <button type="button" className={`toggle-chip ${shareToFeed ? 'active' : ''}`} onClick={() => setShareToFeed((prev) => !prev)} disabled={loading}>
                  {shareToFeed ? (isEnglish ? 'Public' : '공개') : (isEnglish ? 'Private' : '비공개')}
                </button>
              </div>
            </section>
          </>
        )}

        <div className="sheet-submit-bar compact">
          <div className="sheet-submit-copy">
            <strong>{getWorkoutTypeLabel(workoutType, language)}</strong>
            <span>{Number(durationMinutes) ? (isEnglish ? `${durationMinutes} min` : `${durationMinutes}분`) : (isEnglish ? 'No time' : '시간 없음')}</span>
          </div>
          <button type="submit" className="primary-btn capture-submit-btn compact" disabled={loading}>
            {loading ? (isEnglish ? 'Saving...' : '저장 중...') : todayDone ? (isEnglish ? 'Save more' : '추가 저장') : (isEnglish ? 'Save' : '저장')}
          </button>
        </div>
      </form>
    </section>
  )
}
