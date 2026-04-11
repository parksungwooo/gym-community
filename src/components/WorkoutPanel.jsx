import { useEffect, useMemo, useRef, useState } from 'react'
import { getWorkoutTypeLabel, useI18n } from '../i18n.js'
import OptimizedImage from './OptimizedImage'

const WORKOUT_OPTIONS = ['러닝', '웨이트', '스트레칭', '요가', '필라테스', '사이클', '기타']
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60]
const MAX_PHOTOS = 4

function shouldOpenManualEditor(selection = {}) {
  const workoutType = selection?.workoutType
  const durationMinutes = Number(selection?.durationMinutes)

  return (
    (workoutType && !WORKOUT_OPTIONS.includes(workoutType))
    || (Number.isFinite(durationMinutes) && durationMinutes > 0 && !QUICK_DURATION_OPTIONS.includes(durationMinutes))
  )
}

function getSelectableWorkoutOptions(workoutType) {
  if (!workoutType || WORKOUT_OPTIONS.includes(workoutType)) return WORKOUT_OPTIONS
  return [...WORKOUT_OPTIONS, workoutType]
}

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

function getDisplayText(value, language = 'ko', fallback = '') {
  if (value && typeof value === 'object') {
    return value[language] ?? value.ko ?? value.en ?? fallback
  }

  return value ?? fallback
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
      <div className="grid gap-1 rounded-2xl border border-dashed border-gray-200 p-4 text-center dark:border-white/10">
        <strong className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'No photos' : '사진 선택 안 함'}</strong>
        <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {isEnglish
            ? 'Camera asks on tap.'
            : '인증 사진은 선택이에요.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950"
          data-testid="photo-proof-preview"
        >
          <OptimizedImage
            className="aspect-square w-full object-cover"
            imageUrl={item.previewUrl}
            preset="panelThumbnail"
            alt={isEnglish ? 'Workout proof preview' : '운동 인증 사진 미리보기'}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 640px) 40vw, 160px"
          />
          <div className="grid gap-2 p-3">
            <span className="truncate text-xs font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
            <div className="grid grid-cols-3 gap-1">
              <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-2 text-xs font-black text-gray-800 disabled:opacity-40 dark:bg-white/10 dark:text-gray-100" onClick={() => onMove(index, index - 1)} disabled={index === 0}>
                {isEnglish ? 'Up' : '앞'}
              </button>
              <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-2 text-xs font-black text-gray-800 disabled:opacity-40 dark:bg-white/10 dark:text-gray-100" onClick={() => onMove(index, index + 1)} disabled={index === items.length - 1}>
                {isEnglish ? 'Down' : '뒤'}
              </button>
              <button type="button" className="min-h-11 rounded-lg bg-rose-50 px-2 text-xs font-black text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" onClick={() => onRemove(index)}>
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
  const defaultOptionalFields = Boolean(initialSelection?.note || initialSelection?.defaultShareToFeed === false)
  const [workoutType, setWorkoutType] = useState(() => initialSelection?.workoutType || '러닝')
  const [durationMinutes, setDurationMinutes] = useState(() => String(initialSelection?.durationMinutes || 30))
  const [note, setNote] = useState(() => getDisplayText(initialSelection?.note, language, ''))
  const [routineName, setRoutineName] = useState(() => getDisplayText(initialSelection?.name, language, ''))
  const [photoItems, setPhotoItems] = useState([])
  const [shareToFeed, setShareToFeed] = useState(() => initialSelection?.defaultShareToFeed !== false)
  const [showRoutineTools, setShowRoutineTools] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(defaultOptionalFields)
  const [showManualEditor, setShowManualEditor] = useState(() => shouldOpenManualEditor(initialSelection))

  useEffect(() => () => {
    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
  }, [photoItems])

  const selectableWorkoutOptions = useMemo(
    () => getSelectableWorkoutOptions(workoutType),
    [workoutType],
  )
  const usesCustomSelection = useMemo(
    () => shouldOpenManualEditor({ workoutType, durationMinutes }),
    [durationMinutes, workoutType],
  )

  const noteHint = useMemo(() => {
    if (workoutType === '러닝') {
      return isEnglish ? 'ex: Park 3km, steady' : '예: 공원 3km, 가볍게'
    }

    if (workoutType === '웨이트') {
      return isEnglish ? 'ex: Lower body 40 min, squats' : '예: 하체 40분, 스쿼트'
    }

    return isEnglish
      ? 'ex: Felt light today'
      : '예: 오늘 몸이 가벼웠어요'
  }, [isEnglish, workoutType])

  const optionalSummary = useMemo(() => {
    const summaryParts = []

    if (note.trim()) summaryParts.push(isEnglish ? 'Note added' : '메모 추가')
    if (photoItems.length > 0) summaryParts.push(isEnglish ? `${photoItems.length} photo${photoItems.length > 1 ? 's' : ''}` : `사진 ${photoItems.length}장`)
    if (!shareToFeed) summaryParts.push(isEnglish ? 'Private' : '비공개')

    if (summaryParts.length > 0) {
      return summaryParts.join(' · ')
    }

    return isEnglish ? 'Note, photos, privacy' : '메모 · 사진 · 공개'
  }, [isEnglish, note, photoItems.length, shareToFeed])

  const manualSummary = useMemo(() => {
    const durationValue = Number(durationMinutes)
    const summaryParts = [getWorkoutTypeLabel(workoutType, language)]

    if (durationValue > 0) {
      summaryParts.push(isEnglish ? `${durationValue} min` : `${durationValue}분`)
    }

    return summaryParts.join(' · ')
  }, [durationMinutes, isEnglish, language, workoutType])
  const estimatedXp = useMemo(() => {
    const durationValue = Number(durationMinutes)
    if (!Number.isFinite(durationValue) || durationValue <= 0) return 10
    return Math.max(10, Math.min(60, Math.round(durationValue * 0.75)))
  }, [durationMinutes])

  const routineSummary = useMemo(() => {
    if (routineTemplates.length > 0) {
      return isEnglish
        ? `${routineTemplates.length} saved routine${routineTemplates.length > 1 ? 's' : ''}`
        : `${routineTemplates.length}개 저장`
    }

    return isEnglish ? 'Save for later' : '다음엔 더 빠르게'
  }, [isEnglish, routineTemplates.length])

  const hasOptionalContent = note.trim().length > 0 || photoItems.length > 0 || !shareToFeed
  const optionalActionLabel = showOptionalFields
    ? (isEnglish ? 'Editing' : '\uC791\uC131 \uC911')
    : hasOptionalContent
      ? (isEnglish ? 'Review' : '\uB2E4\uC2DC \uBCF4\uAE30')
      : (isEnglish ? 'Add details' : '\uC138\uBD80 \uCD94\uAC00')
  const routineActionLabel = showRoutineTools
    ? (isEnglish ? 'Choosing' : '\uC120\uD0DD \uC911')
    : routineTemplates.length > 0
      ? (isEnglish ? 'Load one' : '\uBD88\uB7EC\uC624\uAE30')
      : (isEnglish ? 'Save one' : '\uD558\uB098 \uC800\uC7A5')
  const manualActionLabel = showManualEditor
    ? (isEnglish ? 'Close details' : '\uC870\uC815 \uB2EB\uAE30')
    : usesCustomSelection
      ? (isEnglish ? 'Adjust custom' : '\uAC12 \uC870\uC815')
      : (isEnglish ? 'Use custom' : '\uC9C1\uC811 \uC870\uC815')

  const syncManualEditor = (nextWorkoutType, nextDurationMinutes) => {
    setShowManualEditor(
      shouldOpenManualEditor({
        workoutType: nextWorkoutType,
        durationMinutes: nextDurationMinutes,
      }),
    )
  }

  const resetForm = () => {
    const nextWorkoutType = recentWorkout?.workoutType || initialSelection?.workoutType || '러닝'
    const nextDurationMinutes = recentWorkout?.durationMinutes || initialSelection?.durationMinutes || 30

    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })

    setWorkoutType(nextWorkoutType)
    setDurationMinutes(String(nextDurationMinutes))
    setNote('')
    setRoutineName(initialSelection?.name || '')
    setPhotoItems([])
    setShareToFeed(initialSelection?.defaultShareToFeed !== false)
    setShowRoutineTools(false)
    setShowOptionalFields(defaultOptionalFields)
    syncManualEditor(nextWorkoutType, nextDurationMinutes)

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

  const handleQuickWorkoutTypePick = (option) => {
    setWorkoutType(option)
    syncManualEditor(option, durationMinutes)
  }

  const handleQuickDurationPick = (value) => {
    setDurationMinutes(String(value))
    syncManualEditor(workoutType, value)
  }

  const handleWorkoutTypeChange = (event) => {
    const nextWorkoutType = event.target.value
    setWorkoutType(nextWorkoutType)
    syncManualEditor(nextWorkoutType, durationMinutes)
  }

  const handleDurationChange = (event) => {
    const nextDurationMinutes = event.target.value
    setDurationMinutes(nextDurationMinutes)
    syncManualEditor(workoutType, nextDurationMinutes)
  }

  const handleReuseRecent = () => {
    if (!recentWorkout?.workoutType) return

    const nextWorkoutType = recentWorkout.workoutType
    const nextDurationMinutes = recentWorkout.durationMinutes || 30
    const nextNote = recentWorkout.note || ''

    setWorkoutType(nextWorkoutType)
    setDurationMinutes(String(nextDurationMinutes))
    setNote(nextNote)
    if (nextNote) setShowOptionalFields(true)
    syncManualEditor(nextWorkoutType, nextDurationMinutes)
  }

  const handleApplyRoutine = (routine) => {
    const nextWorkoutType = routine.workout_type || '러닝'
    const nextDurationMinutes = routine.duration_minutes || 30
    const nextNote = getDisplayText(routine.note, language, '')

    setWorkoutType(nextWorkoutType)
    setDurationMinutes(String(nextDurationMinutes))
    setNote(nextNote)
    setRoutineName(getDisplayText(routine.name, language, ''))
    setShowRoutineTools(false)
    if (nextNote) setShowOptionalFields(true)
    syncManualEditor(nextWorkoutType, nextDurationMinutes)
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
    <section
      className="min-h-0 w-full max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] overflow-y-auto overscroll-contain rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:max-h-[calc(100dvh-3rem)] sm:p-6"
      data-testid="workout-panel-surface"
    >
      <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/20" aria-hidden="true" />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Workout Sheet' : '오늘 운동'}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Workout Log' : '기록하기'}</h2>
          <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
            {isEnglish
              ? 'Type and time are enough.'
              : '종류와 시간만 남기면 끝.'}
          </p>
        </div>

        <div className="grid justify-items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${todayDone ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
            {todayDone ? (isEnglish ? 'More available' : '추가 가능') : (isEnglish ? 'Ready' : '준비 완료')}
          </span>
          {onClose ? (
            <button
              type="button"
              className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-white/10"
              onClick={onClose}
              disabled={loading}
              data-testid="workout-sheet-close"
            >
              {isEnglish ? 'Close' : '닫기'}
            </button>
          ) : null}
        </div>
      </div>

      <form className="grid gap-5 sm:gap-6" onSubmit={handleSubmit}>
        <section className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`grid min-h-20 gap-1 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-50 ${showOptionalFields ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-50' : 'border-gray-100 bg-white text-gray-950 shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:text-white'}`}
            onClick={() => setShowOptionalFields((prev) => !prev)}
            disabled={loading}
            data-testid="workout-toggle-extras"
            aria-label={isEnglish ? `Notes and photos, ${optionalActionLabel}` : `\uBA54\uBAA8\uC640 \uC0AC\uC9C4, ${optionalActionLabel}`}
          >
            <span className="grid gap-1">
              <strong className="text-sm font-black">{isEnglish ? 'Notes & Photos' : '메모/사진'}</strong>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{optionalSummary}</span>
            </span>
            <span className="mt-1 w-fit rounded-lg bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm dark:bg-neutral-900 dark:text-emerald-200" aria-hidden="true" data-label={optionalActionLabel}>
              {showOptionalFields ? (isEnglish ? 'Open' : '열림') : (isEnglish ? 'Add' : '추가')}
            </span>
          </button>

          <button
            type="button"
            className={`grid min-h-20 gap-1 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-50 ${showRoutineTools ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-50' : 'border-gray-100 bg-white text-gray-950 shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:text-white'}`}
            onClick={() => setShowRoutineTools((prev) => !prev)}
            disabled={loading}
            data-testid="workout-toggle-routines"
            aria-label={isEnglish ? `Saved routines, ${routineActionLabel}` : `\uC800\uC7A5 \uB8E8\uD2F4, ${routineActionLabel}`}
          >
            <span className="grid gap-1">
              <strong className="text-sm font-black">{isEnglish ? 'Saved Routines' : '내 루틴'}</strong>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{routineSummary}</span>
            </span>
            <span className="mt-1 w-fit rounded-lg bg-white px-2.5 py-1 text-xs font-black text-emerald-700 shadow-sm dark:bg-neutral-900 dark:text-emerald-200" aria-hidden="true" data-label={routineActionLabel}>
              {showRoutineTools ? (isEnglish ? 'Open' : '열림') : (isEnglish ? 'View' : '보기')}
            </span>
          </button>
        </section>

        <section className="grid gap-3">
          <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Quick Picks' : '빠른 선택'}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WORKOUT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`min-h-12 rounded-lg border px-3 text-sm font-black transition disabled:opacity-50 ${workoutType === option ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-200' : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:text-gray-950 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:text-white'}`}
                onClick={() => handleQuickWorkoutTypePick(option)}
                disabled={loading}
              >
                <span className="mr-1 text-xs text-gray-700 dark:text-gray-200">{getWorkoutMark(option)}</span>
                {getWorkoutTypeLabel(option, language)}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Duration' : '시간'}</span>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_DURATION_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`min-h-12 rounded-lg border px-3 text-sm font-black transition disabled:opacity-50 ${Number(durationMinutes) === value ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-200' : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:text-gray-950 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:text-white'}`}
                onClick={() => handleQuickDurationPick(value)}
                disabled={loading}
              >
                {isEnglish ? `${value} min` : `${value}분`}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
            aria-expanded={showManualEditor}
            onClick={() => setShowManualEditor((prev) => !prev)}
            disabled={loading}
            data-testid="manual-edit-toggle"
            aria-label={isEnglish ? `Fine tune, ${manualActionLabel}` : `\uC138\uBD80 \uC870\uC815, ${manualActionLabel}`}
          >
            <span className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Fine Tune' : '직접 입력'}</span>
              <strong className="text-base font-black text-gray-950 dark:text-white">{manualSummary}</strong>
              <span className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
                {usesCustomSelection
                  ? (isEnglish ? 'A custom time is active. Open this to adjust it.' : '직접 입력한 값이 적용됐어요.')
                  : (isEnglish ? 'Only open this when you need a custom time.' : '원하는 시간은 여기서 바꿔요.')}
              </span>
            </span>
            <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100" aria-hidden="true" data-label={manualActionLabel}>
              {showManualEditor ? (isEnglish ? 'Hide' : '접기') : (isEnglish ? 'Open' : '열기')}
            </span>
          </button>

          {showManualEditor && (
            <div className="grid gap-3 sm:grid-cols-2" data-testid="manual-edit-fields">
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Workout Type' : '직접 선택'}</span>
                <select className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" value={workoutType} onChange={handleWorkoutTypeChange} disabled={loading}>
                  {selectableWorkoutOptions.map((option) => (
                    <option key={option} value={option}>{getWorkoutTypeLabel(option, language)}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Duration (min)' : '시간(분)'}</span>
                <input className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" type="number" min="0" max="300" step="5" value={durationMinutes} onChange={handleDurationChange} disabled={loading} />
              </label>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.5fr]">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{isEnglish ? "Today's Logs" : '오늘 기록'}</span>
            <strong className="mt-1 block text-2xl font-black text-gray-950 dark:text-white">{todayCount}</strong>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-700/20">
            <span className="block text-xs font-black text-emerald-700 dark:text-emerald-200">{isEnglish ? 'XP preview' : '예상 XP'}</span>
            <strong className="mt-1 block text-2xl font-black text-emerald-700 dark:text-emerald-200">{`+${estimatedXp}`}</strong>
          </div>

          {recentWorkout?.workoutType && (
            <button type="button" className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:hover:bg-white/10 sm:col-span-1" onClick={handleReuseRecent} disabled={loading}>
              <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{isEnglish ? 'Recent Log' : '최근 기록'}</span>
              <strong className="mt-1 block text-sm font-black text-gray-950 dark:text-white">
                {getWorkoutMark(recentWorkout.workoutType)} · {' '}
                {getWorkoutTypeLabel(recentWorkout.workoutType, language)}
                {recentWorkout.durationMinutes ? (isEnglish ? ` · ${recentWorkout.durationMinutes} min` : ` · ${recentWorkout.durationMinutes}분`) : ''}
              </strong>
            </button>
          )}
        </div>

        {showRoutineTools && (
          <section className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Routines' : '루틴'}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{isEnglish ? `${routineTemplates.length}` : `${routineTemplates.length}개`}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Name' : '이름'}</span>
                <input
                  className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                  type="text"
                  maxLength="20"
                  placeholder={isEnglish ? 'ex: Morning Run' : '예: 아침 러닝'}
                  value={routineName}
                  onChange={(event) => setRoutineName(event.target.value)}
                  disabled={loading}
                />
              </label>

              <button type="button" className="min-h-12 self-end rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10" onClick={handleSaveRoutine} disabled={loading || !routineName.trim()}>
                {isEnglish ? 'Save' : '저장'}
              </button>
            </div>

            {routineTemplates.length > 0 ? (
              <div className="grid gap-2">
                {routineTemplates.map((routine, index) => {
                  const displayName = getDisplayText(routine.name, language, isEnglish ? 'Routine' : '루틴')
                  const displayNote = getDisplayText(routine.note, language, '')

                  return (
                    <div key={routine.id ?? `${displayName}-${index}`} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-gray-50 p-2 dark:bg-white/10">
                      <button type="button" className="grid min-h-11 gap-1 rounded-lg p-2 text-left hover:bg-white dark:hover:bg-neutral-950" onClick={() => handleApplyRoutine(routine)} disabled={loading}>
                        <strong className="text-sm font-black text-gray-950 dark:text-white">{displayName}</strong>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                              {getWorkoutTypeLabel(routine.workout_type, language)}
                              {routine.duration_minutes ? (isEnglish ? ` · ${routine.duration_minutes} min` : ` · ${routine.duration_minutes}분`) : ''}
                        </span>
                        {displayNote && <p className="m-0 text-xs font-semibold text-gray-700 dark:text-gray-200">{displayNote}</p>}
                      </button>

                      <button type="button" className="min-h-11 self-start rounded-lg bg-rose-50 px-3 text-xs font-black text-rose-600 disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-300" onClick={() => onDeleteRoutine(routine.id)} disabled={loading}>
                        {isEnglish ? 'Delete' : '삭제'}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid gap-1 rounded-2xl border border-dashed border-gray-200 p-4 text-center dark:border-white/10">
                <strong className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Save a combo' : '루틴 저장'}</strong>
                <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{isEnglish ? 'Start faster next time.' : '자주 하는 운동을 저장해요.'}</p>
              </div>
            )}
          </section>
        )}

        {showOptionalFields && (
          <>
            <label className="grid gap-2">
              <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Note' : '메모'}</span>
              <textarea
                className="min-h-24 resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-gray-950 outline-none transition placeholder:text-gray-600 dark:placeholder:text-gray-300 focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                rows="3"
                maxLength="120"
                placeholder={noteHint}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                disabled={loading}
                data-testid="workout-note"
              />
            </label>

            <section className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Photos' : '사진'}</span>
                <span className="text-xs font-black text-gray-700 dark:text-gray-200">
                  {isEnglish ? `Up to ${MAX_PHOTOS}.` : `최대 ${MAX_PHOTOS}장`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10" onClick={() => galleryInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>
                  {isEnglish ? 'Photos' : '사진'}
                </button>
                <button type="button" className="min-h-11 rounded-lg bg-gray-100 px-4 text-sm font-black text-gray-800 transition hover:text-gray-950 disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:text-white" onClick={() => cameraInputRef.current?.click()} disabled={loading || photoItems.length >= MAX_PHOTOS}>
                  {isEnglish ? 'Camera' : '카메라'}
                </button>
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-700 dark:bg-white/10 dark:text-gray-100">{isEnglish ? `${photoItems.length}/${MAX_PHOTOS}` : `${photoItems.length}/${MAX_PHOTOS}장`}</span>
              </div>

              <input ref={galleryInputRef} className="sr-only" type="file" accept="image/*" multiple onChange={handleFileChange} data-testid="workout-gallery-input" />
              <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={handleFileChange} data-testid="workout-camera-input" />

              <PhotoProofList items={photoItems} isEnglish={isEnglish} onRemove={handleRemovePhoto} onMove={handleMovePhoto} />
            </section>

            <section className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
              <div className="grid gap-1">
                <div>
                  <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Share to Feed' : '피드에 공유'}</span>
                  <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {isEnglish ? 'Off for private.' : '끄면 나만 볼 수 있어요'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${shareToFeed ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}
                onClick={() => setShareToFeed((prev) => !prev)}
                disabled={loading}
                data-testid="share-toggle"
              >
                {shareToFeed ? (isEnglish ? 'Public' : '공개') : (isEnglish ? 'Private' : '비공개')}
              </button>
            </section>
          </>
        )}

        <button
          type="submit"
          className="sticky bottom-0 z-10 min-h-14 rounded-lg bg-emerald-700 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
          data-testid="workout-submit"
        >
          {loading ? (isEnglish ? 'Saving...' : '저장 중') : todayDone ? (isEnglish ? 'Save more' : '하나 더 저장') : (isEnglish ? 'Save' : '기록 저장')}
        </button>
      </form>
    </section>
  )
}
