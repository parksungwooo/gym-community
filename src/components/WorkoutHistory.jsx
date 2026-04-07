import { useEffect, useMemo, useRef, useState } from 'react'
import { getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'

const WORKOUT_OPTIONS = ['러닝', '웨이트', '스트레칭', '요가', '필라테스', '사이클', '기타', '빠른 체크인']
const MAX_PHOTOS = 4

function getWorkoutMark(type) {
  switch (type) {
    case '러닝':
      return 'RN'
    case '웨이트':
      return 'WT'
    case '스트레칭':
      return 'ST'
    case '요가':
      return 'YG'
    case '필라테스':
      return 'PL'
    case '사이클':
      return 'CY'
    case '빠른 체크인':
      return 'QC'
    default:
      return 'ET'
  }
}

function formatDate(date, language) {
  return new Date(date).toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

function formatDuration(minutes, isEnglish) {
  if (!minutes) return isEnglish ? 'No duration' : '시간 미입력'
  return isEnglish ? `${minutes} min` : `${minutes}분`
}

function formatTime(dateTime, language) {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleTimeString(language === 'en' ? 'en-US' : 'ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCalories(value, isEnglish) {
  if (value == null || value === 0) return isEnglish ? 'Calories pending' : '칼로리 계산 대기'
  return isEnglish ? `~${value} kcal` : `약 ${value}kcal`
}

function getPhotoUrls(item) {
  if (Array.isArray(item.photo_urls) && item.photo_urls.length) return item.photo_urls
  return item.photo_url ? [item.photo_url] : []
}

function formatXp(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null
  return `+${numericValue} XP`
}

function moveItem(items, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= items.length) return items
  const next = [...items]
  const [picked] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, picked)
  return next
}

function buildExistingPhotoItems(item) {
  return getPhotoUrls(item).map((url, index) => ({
    id: `${item.id}-existing-${index}`,
    kind: 'existing',
    url,
    previewUrl: url,
    label: `photo-${index + 1}`,
  }))
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

function revokeNewPhotoItems(items) {
  items.forEach((photoItem) => {
    if (photoItem.kind === 'new' && photoItem.previewUrl) {
      URL.revokeObjectURL(photoItem.previewUrl)
    }
  })
}

function PhotoGrid({ items, isEnglish, onOpen, onRemove, onMove, editable = false }) {
  if (!items.length) return null

  return (
    <div className={`history-photo-grid ${items.length > 1 ? 'multi' : ''}`}>
      {items.map((item, index) => (
        <article key={item.id} className="history-photo-card">
          <button type="button" className="image-open-btn" onClick={() => onOpen?.(item.previewUrl)}>
            <div className="history-photo-preview">
              <OptimizedImage
                imageUrl={item.previewUrl}
                preset={editable ? 'panelThumbnail' : 'historyThumbnail'}
                alt={isEnglish ? 'Workout proof' : '운동 인증 사진'}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                sizes="(max-width: 640px) 46vw, 180px"
              />
            </div>
          </button>

          {editable && (
            <div className="photo-proof-meta edit">
              <span>{item.label}</span>
              <div className="photo-proof-meta-actions">
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => onMove(index, index - 1)}
                  disabled={index === 0}
                >
                  {isEnglish ? 'Up' : '위로'}
                </button>
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => onMove(index, index + 1)}
                  disabled={index === items.length - 1}
                >
                  {isEnglish ? 'Down' : '아래로'}
                </button>
                <button
                  type="button"
                  className="mini-btn danger"
                  onClick={() => onRemove(index)}
                >
                  {isEnglish ? 'Remove' : '제거'}
                </button>
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function HistoryItem({ item, onUpdate, onDelete, loading, onOpenImage }) {
  const { language, isEnglish } = useI18n()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const photoItemsRef = useRef([])
  const [editing, setEditing] = useState(false)
  const [workoutType, setWorkoutType] = useState(item.workout_type ?? '운동')
  const [durationMinutes, setDurationMinutes] = useState(String(item.duration_minutes ?? ''))
  const [note, setNote] = useState(item.note ?? '')
  const [photoItems, setPhotoItems] = useState(() => buildExistingPhotoItems(item))

  useEffect(() => {
    photoItemsRef.current = photoItems
  }, [photoItems])

  useEffect(() => () => {
    revokeNewPhotoItems(photoItemsRef.current)
  }, [])

  const resetEditor = () => {
    setWorkoutType(item.workout_type ?? '운동')
    setDurationMinutes(String(item.duration_minutes ?? ''))
    setNote(item.note ?? '')
    setPhotoItems((prev) => {
      revokeNewPhotoItems(prev)
      return buildExistingPhotoItems(item)
    })
  }

  const openEditor = () => {
    resetEditor()
    setEditing(true)
  }

  const closeEditor = () => {
    resetEditor()
    setEditing(false)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    await onUpdate(item.id, {
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      note: note.trim(),
      date: item.date,
      photoItems,
    })

    resetEditor()
    setEditing(false)
  }

  const handleAddPhotos = (event) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (!nextFiles.length) return

    setPhotoItems((prev) => [...prev, ...buildNewPhotoItems(nextFiles)].slice(0, MAX_PHOTOS))
    event.target.value = ''
  }

  const handleRemovePhoto = (targetIndex) => {
    setPhotoItems((prev) => {
      const target = prev[targetIndex]
      if (target?.kind === 'new' && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }

      return prev.filter((_, index) => index !== targetIndex)
    })
  }

  const displayPhotoItems = editing ? photoItems : buildExistingPhotoItems(item)
  const xpLabel = formatXp(item.xp_amount)

  return (
    <article className="history-timeline-item">
      <div className="history-timeline-rail">
        <span className="history-timeline-dot" />
        <span className="history-timeline-line" />
      </div>

      <div className="history-timeline-time">
        <span>{formatTime(item.created_at, language) || (isEnglish ? 'Log' : '기록')}</span>
      </div>

      <div className="history-card">
        {!editing ? (
          <>
            <div className="history-header">
              <div className="history-title-row">
                <span className={`workout-mark ${item.workout_type === '빠른 체크인' ? 'quick' : ''}`}>
                  {getWorkoutMark(item.workout_type)}
                </span>
                <div>
                  <strong>{getWorkoutTypeLabel(item.workout_type, language)}</strong>
                  <span className="history-duration-inline">
                    {formatDuration(item.duration_minutes, isEnglish)}
                  </span>
                </div>
              </div>

              <div className="history-header-meta">
                <span className="history-time-badge">{formatDuration(item.duration_minutes, isEnglish)}</span>
                <span className="history-time-badge subtle">
                  {formatCalories(item.estimated_calories, isEnglish)}
                </span>
                {xpLabel ? <span className="history-time-badge accent">{xpLabel}</span> : null}
              </div>
            </div>

            <PhotoGrid items={displayPhotoItems} isEnglish={isEnglish} onOpen={onOpenImage} />

            {item.note ? <p className="history-note">{item.note}</p> : null}

            <div className="history-actions">
              <button type="button" className="mini-btn" onClick={openEditor} disabled={loading}>
                {isEnglish ? 'Edit' : '수정'}
              </button>
              <button
                type="button"
                className="mini-btn danger"
                onClick={() => onDelete(item.id)}
                disabled={loading}
              >
                {isEnglish ? 'Delete' : '삭제'}
              </button>
            </div>
          </>
        ) : (
          <form className="history-edit-sheet" onSubmit={handleSave}>
            <div className="history-edit-sheet-header">
              <span className="history-edit-handle" />
              <div className="history-edit-title-row">
                <strong>{isEnglish ? 'Edit Workout' : '운동 기록 수정'}</strong>
                <span>{formatTime(item.created_at, language) || (isEnglish ? 'Saved log' : '저장된 기록')}</span>
              </div>
            </div>

            <div className="history-edit-fields">
              <label className="field-label history-edit-field">
                {isEnglish ? 'Workout Type' : '운동 종류'}
                <select
                  className="workout-select"
                  value={workoutType}
                  onChange={(event) => setWorkoutType(event.target.value)}
                  disabled={loading}
                >
                  {WORKOUT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {getWorkoutTypeLabel(option, language)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-label history-edit-field">
                {isEnglish ? 'Duration (min)' : '운동 시간 (분)'}
                <input
                  className="workout-input"
                  type="number"
                  min="0"
                  max="300"
                  step="5"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="field-label history-edit-field full">
                {isEnglish ? 'Note' : '메모'}
                <textarea
                  className="workout-textarea"
                  rows="3"
                  maxLength="120"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={loading}
                />
              </label>
            </div>

            <section className="history-edit-photos">
              <div className="photo-proof-header">
                <span className="field-label-text">{isEnglish ? 'Photos' : '사진'}</span>
                <span className="photo-proof-helper">
                  {isEnglish
                    ? `Add, remove, or reorder up to ${MAX_PHOTOS}.`
                    : `최대 ${MAX_PHOTOS}장까지 추가, 제거, 순서 변경이 가능해요.`}
                </span>
              </div>

              <div className="photo-proof-actions">
                <button
                  type="button"
                  className="secondary-btn photo-proof-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || photoItems.length >= MAX_PHOTOS}
                >
                  {isEnglish ? 'Add Photos' : '사진 추가'}
                </button>
                <button
                  type="button"
                  className="ghost-btn photo-proof-btn"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={loading || photoItems.length >= MAX_PHOTOS}
                >
                  {isEnglish ? 'Open Camera' : '카메라 열기'}
                </button>
                <span className="photo-proof-count">
                  {isEnglish ? `${photoItems.length}/${MAX_PHOTOS} selected` : `${photoItems.length}/${MAX_PHOTOS}장 선택`}
                </span>
              </div>

              <input
                ref={fileInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddPhotos}
              />
              <input
                ref={cameraInputRef}
                className="hidden-file-input"
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleAddPhotos}
              />

              <PhotoGrid
                items={photoItems}
                isEnglish={isEnglish}
                onOpen={onOpenImage}
                onRemove={handleRemovePhoto}
                onMove={(from, to) => setPhotoItems((prev) => moveItem(prev, from, to))}
                editable
              />
            </section>

            <div className="history-edit-sheet-actions">
              <div className="history-edit-sheet-copy">
                <strong>{getWorkoutTypeLabel(workoutType, language)}</strong>
                <span>
                  {Number(durationMinutes)
                    ? (isEnglish ? `${durationMinutes} min` : `${durationMinutes}분`)
                    : (isEnglish ? 'No duration yet' : '시간 미입력')}
                  {' · '}
                  {formatCalories(item.estimated_calories, isEnglish)}
                </span>
              </div>
              <div className="history-actions">
                <button type="button" className="mini-btn" onClick={closeEditor} disabled={loading}>
                  {isEnglish ? 'Cancel' : '취소'}
                </button>
                <button type="submit" className="mini-btn primary" disabled={loading}>
                  {isEnglish ? 'Save' : '저장'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </article>
  )
}

export default function WorkoutHistory({ history, onUpdate, onDelete, loading }) {
  const { language, isEnglish } = useI18n()
  const [openImageUrl, setOpenImageUrl] = useState('')

  const recentWeek = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toLocaleDateString('sv-SE')
    const matched = history.find((item) => item.date === key)

    return {
      key,
      label: date.toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', { weekday: 'short' }),
      done: Boolean(matched),
    }
  })

  const groupedHistory = useMemo(() => {
    const groups = []

    history.forEach((item) => {
      const lastGroup = groups[groups.length - 1]
      if (!lastGroup || lastGroup.date !== item.date) {
        groups.push({ date: item.date, items: [item] })
        return
      }
      lastGroup.items.push(item)
    })

    return groups
  }, [history])

  return (
    <section className="card record-module-card compact">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Timeline' : '타임라인'}</span>
          <h2>{isEnglish ? 'Workout History' : '운동 기록'}</h2>
        </div>
        <span className="community-mini-pill">{isEnglish ? `${history.length} logs` : `${history.length}개`}</span>
      </div>

      <p className="subtext compact">
        {isEnglish
          ? 'See your recent logs and the last 7 days in one place.'
          : '최근 기록과 지난 7일 기록을 한 번에 확인해보세요.'}
      </p>

      <div className="week-strip compact">
        {recentWeek.map((day) => (
          <article key={day.key} className={`day-pill ${day.done ? 'done' : ''}`}>
            <span>{day.label}</span>
            <strong>{day.done ? (isEnglish ? 'Done' : '완료') : '-'}</strong>
          </article>
        ))}
      </div>

      <div className="history-list grouped compact">
        {loading && (
          <div className="skeleton-stack">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="skeleton-card history">
                <span className="skeleton-line short" />
                <div className="skeleton-row">
                  <span className="skeleton-avatar small" />
                  <div className="skeleton-copy">
                    <span className="skeleton-line medium" />
                    <span className="skeleton-line long" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="empty-state-card">
            <span className="empty-state-badge">{isEnglish ? 'Timeline' : '타임라인 시작 전'}</span>
            <strong>{isEnglish ? 'Your workout history will start here.' : '운동 기록 타임라인이 여기서 시작돼요.'}</strong>
            <p>
              {isEnglish
                ? 'Save your first workout and the last 7 days plus timeline cards will fill in here.'
                : '첫 운동을 저장하면 지난 7일 스트립과 타임라인 카드가 여기서 채워지기 시작해요.'}
            </p>
          </div>
        )}

        {groupedHistory.map((group) => (
          <section key={group.date} className="history-group">
            <div className="history-group-header">
              <div className="history-group-title">
                <strong>{formatDate(group.date, language)}</strong>
                <span>{isEnglish ? `${group.items.length} logs` : `${group.items.length}개 기록`}</span>
              </div>
            </div>

            <div className="history-group-items">
              {group.items.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  loading={loading}
                  onOpenImage={setOpenImageUrl}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {openImageUrl && (
        <div className="lightbox-backdrop" role="dialog" aria-modal="true" onClick={() => setOpenImageUrl('')}>
          <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setOpenImageUrl('')}>
              {isEnglish ? 'Close' : '닫기'}
            </button>
            <img src={openImageUrl} alt={isEnglish ? 'Expanded workout image' : '확대된 운동 이미지'} />
          </div>
        </div>
      )}
    </section>
  )
}
