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
  if (!minutes) return isEnglish ? 'No time' : '시간 없음'
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
  if (value == null || value === 0) return isEnglish ? 'Calories TBD' : '칼로리 계산 중'
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

function WorkoutMark({ type }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-700 text-xs font-black text-white shadow-sm">
      {getWorkoutMark(type)}
    </span>
  )
}

function SmallButton({ children, tone = 'default', ...props }) {
  const toneClass = tone === 'danger'
    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25'
    : tone === 'primary'
      ? 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800'
      : 'bg-gray-100 text-gray-800 hover:text-gray-950 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white'

  return (
    <button
      type="button"
      className={`min-h-11 rounded-lg px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
      {...props}
    >
      {children}
    </button>
  )
}

function PhotoGrid({ items, isEnglish, onOpen, onRemove, onMove, editable = false }) {
  if (!items.length) return null

  return (
    <div className={`grid gap-3 ${items.length > 1 ? 'grid-cols-2' : ''}`}>
      {items.map((item, index) => (
        <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950">
          <button type="button" className="block w-full" onClick={() => onOpen?.(item.previewUrl)}>
            <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-white/10">
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

          {editable ? (
            <div className="grid gap-2 border-t border-gray-100 p-3 dark:border-white/10">
              <span className="truncate text-xs font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
              <div className="grid grid-cols-3 gap-1">
                <SmallButton onClick={() => onMove(index, index - 1)} disabled={index === 0}>{isEnglish ? 'Up' : '위로'}</SmallButton>
                <SmallButton onClick={() => onMove(index, index + 1)} disabled={index === items.length - 1}>{isEnglish ? 'Down' : '아래로'}</SmallButton>
                <SmallButton tone="danger" onClick={() => onRemove(index)}>{isEnglish ? 'Remove' : '제거'}</SmallButton>
              </div>
            </div>
          ) : null}
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
  const metaItems = [
    formatDuration(item.duration_minutes, isEnglish),
    formatCalories(item.estimated_calories, isEnglish),
    xpLabel,
  ].filter(Boolean)

  if (editing) {
    return (
      <form className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950" onSubmit={handleSave}>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Edit' : '수정'}</span>
            <strong className="text-lg font-black leading-6 text-gray-950 dark:text-white">{isEnglish ? 'Edit Workout' : '운동 기록 수정'}</strong>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{formatTime(item.created_at, language) || (isEnglish ? 'Saved' : '저장')}</span>
          </div>
          <WorkoutMark type={workoutType} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-black text-gray-950 dark:text-white">
            {isEnglish ? 'Workout Type' : '운동 종류'}
            <select
              className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-900 dark:text-white"
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

          <label className="grid gap-2 text-sm font-black text-gray-950 dark:text-white">
            {isEnglish ? 'Duration (min)' : '운동 시간 (분)'}
            <input
              className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-900 dark:text-white"
              type="number"
              min="0"
              max="300"
              step="5"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              disabled={loading}
            />
          </label>

          <label className="grid gap-2 text-sm font-black text-gray-950 dark:text-white sm:col-span-2">
            {isEnglish ? 'Note' : '메모'}
            <textarea
              className="min-h-24 resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-gray-950 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:placeholder:text-gray-300"
              rows="3"
              maxLength="120"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Photos' : '사진'}</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {isEnglish ? `Up to ${MAX_PHOTOS}.` : `최대 ${MAX_PHOTOS}장`}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <SmallButton onClick={() => fileInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>{isEnglish ? 'Photos' : '사진'}</SmallButton>
            <SmallButton onClick={() => cameraInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>{isEnglish ? 'Camera' : '카메라'}</SmallButton>
            <span className="grid min-h-11 place-items-center rounded-lg bg-gray-100 px-3 text-xs font-black text-gray-700 dark:bg-white/10 dark:text-gray-100">
              {isEnglish ? `${photoItems.length}/${MAX_PHOTOS}` : `${photoItems.length}/${MAX_PHOTOS}장`}
            </span>
          </div>

          <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" multiple onChange={handleAddPhotos} />
          <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={handleAddPhotos} />

          <PhotoGrid
            items={photoItems}
            isEnglish={isEnglish}
            onOpen={onOpenImage}
            onRemove={handleRemovePhoto}
            onMove={(from, to) => setPhotoItems((prev) => moveItem(prev, from, to))}
            editable
          />
        </section>

        <div className="grid gap-3 border-t border-gray-100 pt-4 dark:border-white/10 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-1">
            <strong className="text-sm font-black text-gray-950 dark:text-white">{getWorkoutTypeLabel(workoutType, language)}</strong>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {Number(durationMinutes)
                ? (isEnglish ? `${durationMinutes} min` : `${durationMinutes}분`)
                : (isEnglish ? 'No time' : '시간 없음')}
              {' · '}
              {formatCalories(item.estimated_calories, isEnglish)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SmallButton onClick={closeEditor} disabled={loading}>{isEnglish ? 'Cancel' : '취소'}</SmallButton>
            <button type="submit" className="min-h-11 rounded-lg bg-emerald-700 px-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>
              {isEnglish ? 'Save' : '저장'}
            </button>
          </div>
        </div>
      </form>
    )
  }

  return (
    <article className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
      <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <WorkoutMark type={item.workout_type} />
          <div className="min-w-0">
            <strong className="block truncate text-lg font-black leading-6 text-gray-950 dark:text-white">{getWorkoutTypeLabel(item.workout_type, language)}</strong>
            <span className="mt-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">{formatTime(item.created_at, language) || (isEnglish ? 'Log' : '기록')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {metaItems.map((meta) => (
            <span key={meta} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-800 shadow-sm dark:bg-white/10 dark:text-gray-100">{meta}</span>
          ))}
        </div>
      </header>

      <PhotoGrid items={displayPhotoItems} isEnglish={isEnglish} onOpen={onOpenImage} />

      {item.note ? <p className="m-0 rounded-2xl bg-white p-3 text-sm font-semibold leading-6 text-gray-800 dark:bg-white/10 dark:text-gray-100">{item.note}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <SmallButton onClick={openEditor} disabled={loading}>{isEnglish ? 'Edit' : '수정'}</SmallButton>
        <SmallButton tone="danger" onClick={() => onDelete(item.id)} disabled={loading}>{isEnglish ? 'Delete' : '삭제'}</SmallButton>
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
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Timeline' : '타임라인'}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'History' : '기록'}</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{isEnglish ? `${history.length} logs` : `${history.length}개`}</span>
      </div>

      <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
        {isEnglish ? 'Recent logs and the last 7 days.' : '최근 기록과 7일 흐름'}
      </p>

      {(loading || history.length > 0) && (
        <div className="grid grid-cols-7 gap-1">
          {recentWeek.map((day) => (
            <article key={day.key} className={`grid min-h-16 place-items-center rounded-lg border p-2 text-center ${day.done ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-800 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100'}`}>
              <span className="text-xs font-black">{day.label}</span>
              <strong className="text-xs font-black">{day.done ? (isEnglish ? 'Done' : '완료') : '-'}</strong>
            </article>
          ))}
        </div>
      )}

      <div className="grid gap-5">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-gray-100 p-4 dark:bg-white/10">
                <span className="h-3 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                <div className="grid gap-2">
                  <span className="h-10 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                  <span className="h-10 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && history.length === 0 ? (
          <div className="grid gap-2 rounded-2xl border border-dashed border-gray-200 p-5 text-center dark:border-white/10">
            <span className="mx-auto w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200">{isEnglish ? 'First log' : '첫 기록'}</span>
            <strong className="text-lg font-black text-gray-950 dark:text-white">{isEnglish ? 'No history yet.' : '아직 기록이 없어요.'}</strong>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {isEnglish ? 'Save one workout above to start this view.' : '위에서 운동 한 번 저장하면 여기부터 채워져요.'}
            </p>
          </div>
        ) : null}

        {groupedHistory.map((group) => (
          <section key={group.date} className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-gray-950 dark:text-white">{formatDate(group.date, language)}</strong>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{isEnglish ? `${group.items.length} logs` : `${group.items.length}개 기록`}</span>
            </div>

            <div className="grid gap-3">
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

      {openImageUrl ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setOpenImageUrl('')}>
          <div className="grid max-h-[86dvh] w-full max-w-2xl gap-3 overflow-hidden rounded-3xl bg-white p-3 shadow-2xl dark:bg-neutral-900" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="justify-self-end rounded-lg bg-gray-100 px-3 py-2 text-sm font-black text-gray-800 dark:bg-white/10 dark:text-gray-100" onClick={() => setOpenImageUrl('')}>
              {isEnglish ? 'Close' : '닫기'}
            </button>
            <img className="max-h-[72dvh] w-full rounded-2xl object-contain" src={openImageUrl} alt={isEnglish ? 'Expanded workout image' : '확대된 운동 이미지'} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
