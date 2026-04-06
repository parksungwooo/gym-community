import { useEffect, useMemo, useRef, useState } from 'react'
import { getWorkoutTypeLabel, useI18n } from '../i18n.js'

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
        <strong>{isEnglish ? 'No proof photo added yet' : '아직 인증 사진이 없어요'}</strong>
        <p>
          {isEnglish
            ? 'On mobile, camera access is requested only when you tap the camera button.'
            : '모바일에서는 카메라 버튼을 눌렀을 때만 브라우저가 권한을 요청해요.'}
        </p>
      </div>
    )
  }

  return (
    <div className="photo-proof-grid">
      {items.map((item, index) => (
        <article key={item.id} className="photo-proof-preview multi">
          <img src={item.previewUrl} alt={isEnglish ? 'Workout proof preview' : '운동 인증 사진 미리보기'} />
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

  useEffect(() => () => {
    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
  }, [photoItems])

  const noteHint = useMemo(() => {
    if (workoutType === '러닝') {
      return isEnglish ? 'ex: Park 3km, pace felt steady' : '예: 공원 3km, 페이스 안정적'
    }

    if (workoutType === '웨이트') {
      return isEnglish ? 'ex: Lower body 40 min, focused on squats' : '예: 하체 40분, 스쿼트 중심'
    }

    return isEnglish
      ? 'ex: Leave a short note about how your body felt today'
      : '예: 오늘 몸 상태나 운동 느낌을 짧게 남겨보세요'
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
    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    await onComplete({
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      note: note.trim(),
      photoItems,
      shareToFeed,
    })

    resetForm()
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
          <span className="app-section-kicker">{isEnglish ? 'Workout Sheet' : '운동 입력 시트'}</span>
          <h2>{isEnglish ? "Log Today's Workout" : '오늘 운동 기록하기'}</h2>
          <p className="subtext compact">
            {isEnglish
              ? 'Type, time, photos, and a sharing choice are enough to save today.'
              : '운동 종류, 시간, 사진, 공개 여부만 정하면 오늘 기록이 완성돼요.'}
          </p>
        </div>

        <div className="capture-header-actions">
          <span className={`capture-status ${todayDone ? 'done' : ''}`}>
            {todayDone ? (isEnglish ? 'More logs available today' : '오늘은 추가 기록 가능') : (isEnglish ? 'Ready to log' : '지금 기록 가능')}
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
          <strong className="capture-helper-value">{todayCount}</strong>
        </div>

        {recentWorkout?.workoutType && (
          <button type="button" className="reuse-workout-btn compact" onClick={handleReuseRecent} disabled={loading}>
            {isEnglish ? 'Reuse Latest Workout' : '최근 운동 다시 쓰기'}
            <span>
              <span className="reuse-inline-mark">{getWorkoutMark(recentWorkout.workoutType)}</span>
              {getWorkoutTypeLabel(recentWorkout.workoutType, language)}
              {recentWorkout.durationMinutes ? (isEnglish ? ` · ${recentWorkout.durationMinutes} min` : ` · ${recentWorkout.durationMinutes}분`) : ''}
            </span>
          </button>
        )}
      </div>

      <section className="sheet-section routine-section compact">
        <div className="routine-header-row">
          <span className="field-label-text">{isEnglish ? 'Saved Routines' : '저장된 루틴'}</span>
          <span className="routine-count-pill">{isEnglish ? `${routineTemplates.length} saved` : `${routineTemplates.length}개 저장됨`}</span>
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

          <button type="button" className="secondary-btn routine-save-btn compact" onClick={handleSaveRoutine} disabled={loading || !routineName.trim()}>
            {isEnglish ? 'Save Current Routine' : '현재 조합 저장'}
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
            <strong>{isEnglish ? 'Save the combinations you repeat often' : '자주 하는 조합을 저장해보세요'}</strong>
            <p>{isEnglish ? 'Once saved, the next workout can start in one tap.' : '한 번 저장해두면 다음 운동은 한 번에 시작할 수 있어요.'}</p>
          </div>
        )}
      </section>

      <form className="workout-form" onSubmit={handleSubmit}>
        <section className="sheet-section quick-choice-section compact">
          <span className="field-label-text">{isEnglish ? 'Common Workouts' : '자주 하는 운동'}</span>
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
              <span className="field-label-text">{isEnglish ? 'Workout Type' : '운동 종류 직접 선택'}</span>
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

        <label className="field-label sheet-section compact">
          <span className="field-label-text">{isEnglish ? 'Quick Note' : '짧은 메모'}</span>
          <textarea className="workout-textarea compact" rows="3" maxLength="120" placeholder={noteHint} value={note} onChange={(event) => setNote(event.target.value)} disabled={loading} />
        </label>

        <section className="sheet-section compact">
          <div className="photo-proof-header">
            <span className="field-label-text">{isEnglish ? 'Photo Proof' : '사진 인증'}</span>
            <span className="photo-proof-helper">
              {isEnglish ? `Optional. Up to ${MAX_PHOTOS} photos. Drag-style order with up/down controls.` : `선택 사항. 최대 ${MAX_PHOTOS}장까지 가능하고 위/아래 버튼으로 순서를 바꿀 수 있어요.`}
            </span>
          </div>

          <div className="photo-proof-actions">
            <button type="button" className="secondary-btn photo-proof-btn" onClick={() => galleryInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>
              {isEnglish ? 'Choose Photos' : '사진 선택'}
            </button>
            <button type="button" className="ghost-btn photo-proof-btn" onClick={() => cameraInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>
              {isEnglish ? 'Open Camera' : '카메라 열기'}
            </button>
            <span className="photo-proof-count">{isEnglish ? `${photoItems.length}/${MAX_PHOTOS} selected` : `${photoItems.length}/${MAX_PHOTOS}장 선택됨`}</span>
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
                {isEnglish ? 'Turn this off to save privately in your records only.' : '끄면 기록에는 저장되지만 커뮤니티 피드에는 올리지 않아요.'}
              </p>
            </div>
            <button type="button" className={`toggle-chip ${shareToFeed ? 'active' : ''}`} onClick={() => setShareToFeed((prev) => !prev)} disabled={loading}>
              {shareToFeed ? (isEnglish ? 'Public' : '공개') : (isEnglish ? 'Private' : '비공개')}
            </button>
          </div>
        </section>

        <div className="sheet-submit-bar compact">
          <div className="sheet-submit-copy">
            <strong>{getWorkoutTypeLabel(workoutType, language)}</strong>
            <span>{Number(durationMinutes) ? (isEnglish ? `${durationMinutes} min planned` : `${durationMinutes}분 기록 예정`) : (isEnglish ? 'Duration not set' : '시간 미설정')}</span>
          </div>
          <button type="submit" className="primary-btn capture-submit-btn compact" disabled={loading}>
            {loading ? (isEnglish ? 'Saving workout...' : '운동 저장 중...') : todayDone ? (isEnglish ? 'Save Another Workout Today' : '오늘 운동 추가 저장') : (isEnglish ? "Save Today's Workout" : '오늘 운동 기록 저장')}
          </button>
        </div>
      </form>
    </section>
  )
}
