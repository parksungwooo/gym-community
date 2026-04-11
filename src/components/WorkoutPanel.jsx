import { useEffect, useMemo, useRef, useState } from 'react'
import { getWorkoutTypeLabel, useI18n } from '../i18n.js'
import { getProWorkoutNudge } from '../features/pro/proStrategy.js'
import { calculateXpAward, getXpRuleLabel } from '../features/xp/xpRules.js'
import OptimizedImage from './OptimizedImage'

const WORKOUT_OPTIONS = ['걷기', '러닝', '웨이트', '스트레칭', '요가', '사이클', '기타']
const QUICK_DURATION_OPTIONS = [20, 30, 45, 60]
const QUICK_SET_OPTIONS = [1, 3, 4, 5]
const QUICK_WEIGHT_OPTIONS = [0, 20, 40, 60]
const MAX_PHOTOS = 4
const ADVANCED_EXPOSURE_THRESHOLD = 3

function getDisplayText(value, language = 'ko', fallback = '') {
  if (value && typeof value === 'object') return value[language] ?? value.ko ?? value.en ?? fallback
  return value ?? fallback
}

function getWorkoutMark(type) {
  if (type === '걷기') return 'WK'
  if (type === '러닝') return 'RN'
  if (type === '웨이트') return 'WT'
  if (type === '스트레칭') return 'ST'
  if (type === '요가') return 'YG'
  if (type === '사이클') return 'CY'
  return 'ET'
}

function getWeightLabel(value, isEnglish) {
  return Number(value) === 0 ? (isEnglish ? 'Body' : '맨몸') : `${value}kg`
}

function shouldOpenManualEditor(selection = {}) {
  const workoutType = selection?.workoutType
  const durationMinutes = Number(selection?.durationMinutes)
  const sets = Number(selection?.sets)
  const loadKg = Number(selection?.loadKg)

  return (
    (workoutType && !WORKOUT_OPTIONS.includes(workoutType))
    || (Number.isFinite(durationMinutes) && durationMinutes > 0 && !QUICK_DURATION_OPTIONS.includes(durationMinutes))
    || (Number.isFinite(sets) && sets > 0 && !QUICK_SET_OPTIONS.includes(sets))
    || (Number.isFinite(loadKg) && loadKg > 0 && !QUICK_WEIGHT_OPTIONS.includes(loadKg))
  )
}

function getSelectableWorkoutOptions(workoutType) {
  if (!workoutType || WORKOUT_OPTIONS.includes(workoutType)) return WORKOUT_OPTIONS
  return [...WORKOUT_OPTIONS, workoutType]
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

function ChoiceButton({ active, children, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`min-h-12 rounded-lg border px-3 text-sm font-black transition disabled:opacity-50 ${
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-200'
          : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:text-gray-950 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:text-white'
      }`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function QuickChoiceGroup({ label, children }) {
  return (
    <section className="grid gap-2">
      <span className="text-sm font-black text-gray-950 dark:text-white">{label}</span>
      {children}
    </section>
  )
}

function ProWorkoutNudge({ nudge, isPro, onOpenPaywall }) {
  if (!nudge) return null

  return (
    <section className={`grid gap-3 rounded-3xl border p-4 shadow-sm ${
      isPro
        ? 'border-emerald-300/30 bg-neutral-950 text-white'
        : 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-700/20'
    }`}>
      <div className="grid gap-1">
        <span className={`text-xs font-black uppercase ${isPro ? 'text-emerald-100' : 'text-emerald-800 dark:text-emerald-200'}`}>
          {isPro ? 'Pro insight' : 'Pro unlock'}
        </span>
        <strong className={`text-base font-black leading-6 ${isPro ? 'text-white' : 'text-gray-950 dark:text-white'}`}>
          {nudge.title}
        </strong>
        <p className={`m-0 text-sm font-semibold leading-6 ${isPro ? 'text-gray-100' : 'text-gray-800 dark:text-gray-100'}`}>
          {nudge.body}
        </p>
      </div>
      {nudge.previewItems?.length ? (
        <div className="grid grid-cols-3 gap-2">
          {nudge.previewItems.map((item) => (
            <article
              key={item.label}
              className={`rounded-2xl p-3 text-center ${
                isPro
                  ? 'bg-white/10'
                  : 'bg-white shadow-sm dark:bg-neutral-950'
              }`}
            >
              <span className={`block text-[11px] font-black uppercase ${isPro ? 'text-emerald-100' : 'text-emerald-800 dark:text-emerald-200'}`}>
                {item.label}
              </span>
              <strong className={`mt-1 block text-sm font-black leading-5 ${isPro ? 'text-white' : 'text-gray-950 dark:text-white'}`}>
                {item.value}
              </strong>
            </article>
          ))}
        </div>
      ) : null}
      {isPro ? (
        <span className="grid min-h-11 place-items-center rounded-lg bg-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-sm">
          {nudge.ctaLabel}
        </span>
      ) : (
        <button
          type="button"
          className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
          onClick={() => onOpenPaywall?.(nudge.context)}
        >
          {nudge.ctaLabel}
        </button>
      )}
    </section>
  )
}

function PhotoProofList({ items, isEnglish, onRemove }) {
  if (!items.length) {
    return (
      <div className="grid gap-1 rounded-2xl border border-dashed border-gray-200 p-4 text-center dark:border-white/10">
        <strong className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'No photos yet' : '아직 사진이 없어요'}</strong>
        <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {isEnglish ? 'Add proof if you want to share.' : '공유하고 싶을 때만 추가해요.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, index) => (
        <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950" data-testid="photo-proof-preview">
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
            <button type="button" className="min-h-11 rounded-lg bg-rose-50 px-2 text-xs font-black text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" onClick={() => onRemove(index)}>
              {isEnglish ? 'Remove' : '삭제'}
            </button>
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
  streakCount = 0,
  weeklyCount = 0,
  weeklyGoal = 4,
  levelValue = 1,
  historyCount = 0,
  recentWorkout,
  routineTemplates = [],
  initialSelection = null,
  isPro = false,
  onOpenPaywall,
}) {
  const { language, isEnglish } = useI18n()
  const t = (ko, en) => (isEnglish ? en : ko)
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const hasPrefilledAdvanced = Boolean(initialSelection?.note || initialSelection?.defaultShareToFeed === false || shouldOpenManualEditor(initialSelection))
  const shouldExposeAdvanced = Number(historyCount) >= ADVANCED_EXPOSURE_THRESHOLD
  const [workoutType, setWorkoutType] = useState(() => initialSelection?.workoutType || '러닝')
  const [durationMinutes, setDurationMinutes] = useState(() => String(initialSelection?.durationMinutes || 30))
  const [sets, setSets] = useState(() => String(initialSelection?.sets || 3))
  const [loadKg, setLoadKg] = useState(() => String(initialSelection?.loadKg ?? 0))
  const [note, setNote] = useState(() => getDisplayText(initialSelection?.note, language, ''))
  const [routineName, setRoutineName] = useState(() => getDisplayText(initialSelection?.name, language, ''))
  const [photoItems, setPhotoItems] = useState([])
  const [shareToFeed, setShareToFeed] = useState(() => initialSelection?.defaultShareToFeed !== false)
  const [showAdvancedTools, setShowAdvancedTools] = useState(() => hasPrefilledAdvanced || shouldExposeAdvanced)
  const [showRoutineTools, setShowRoutineTools] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  const [showManualEditor, setShowManualEditor] = useState(() => shouldOpenManualEditor(initialSelection))

  useEffect(() => () => {
    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
  }, [photoItems])

  const selectableWorkoutOptions = useMemo(() => getSelectableWorkoutOptions(workoutType), [workoutType])
  const usesCustomSelection = useMemo(
    () => shouldOpenManualEditor({ workoutType, durationMinutes, sets, loadKg }),
    [durationMinutes, loadKg, sets, workoutType],
  )
  const safeStreak = Math.max(0, Number(streakCount) || 0)
  const safeWeeklyGoal = Math.max(1, Number(weeklyGoal) || 4)
  const safeWeeklyCount = Math.max(0, Number(weeklyCount) || 0)
  const xpAward = useMemo(() => calculateXpAward({
    workoutType,
    durationMinutes: Number(durationMinutes) || 0,
    sets: Number(sets) || 0,
    loadKg: Number(loadKg) || 0,
    levelValue,
    todayDone,
    todayCount,
    historyCount,
    streakCount: safeStreak,
    weeklyCount: safeWeeklyCount,
    weeklyGoal: safeWeeklyGoal,
  }), [
    durationMinutes,
    historyCount,
    levelValue,
    loadKg,
    safeStreak,
    safeWeeklyCount,
    safeWeeklyGoal,
    sets,
    todayCount,
    todayDone,
    workoutType,
  ])
  const estimatedXp = xpAward.totalXP
  const proWorkoutNudge = useMemo(() => getProWorkoutNudge({
    isPro,
    estimatedXp,
    language,
  }), [estimatedXp, isPro, language])
  const nextWeeklyCount = Math.min(safeWeeklyCount + (todayDone ? 0 : 1), safeWeeklyGoal)
  const missionTitle = todayDone
    ? t('보너스 XP 챙기기', 'Grab bonus XP')
    : t('오늘 미션: 운동 1회 기록', 'Today quest: log one workout')
  const missionBody = todayDone
    ? t(`저장하면 +${estimatedXp} XP가 바로 더해져요.`, `Saving adds +${estimatedXp} XP instantly.`)
    : safeStreak > 0
      ? t(`저장하면 ${safeStreak + 1}일 스트릭으로 이어져요.`, `Saving extends your streak to ${safeStreak + 1} days.`)
      : t(`저장하면 첫 스트릭과 +${estimatedXp} XP를 받아요.`, `Saving starts your streak and adds +${estimatedXp} XP.`)
  const missionProgress = todayDone ? '1/1' : '0/1'
  const stickySubmitLabel = loading
    ? (isEnglish ? 'Saving...' : '저장 중')
    : todayDone
      ? (isEnglish ? `Save bonus · +${estimatedXp} XP` : `보너스 저장 · +${estimatedXp} XP`)
      : (isEnglish ? `Complete quest · +${estimatedXp} XP` : `미션 완료 · +${estimatedXp} XP`)
  const noteHint = useMemo(() => {
    if (workoutType === '러닝' || workoutType === '걷기') return isEnglish ? 'ex: Easy 3K' : '예: 3km 가볍게'
    if (workoutType === '웨이트') return isEnglish ? 'ex: Squat felt strong' : '예: 스쿼트 좋았음'
    return isEnglish ? 'ex: Felt lighter today' : '예: 몸이 가벼웠어요'
  }, [isEnglish, workoutType])
  const routineSummary = routineTemplates.length
    ? (isEnglish ? `${routineTemplates.length} saved` : `${routineTemplates.length}개 저장됨`)
    : (isEnglish ? 'Save for next time' : '다음엔 한 번에')
  const workoutSummary = [
    getWorkoutTypeLabel(workoutType, language),
    isEnglish ? `${durationMinutes} min` : `${durationMinutes}분`,
    isEnglish ? `${sets} sets` : `${sets}세트`,
    getWeightLabel(loadKg, isEnglish),
  ].join(' • ')
  const advancedCopy = shouldExposeAdvanced
    ? t('익숙해졌으니 세부 기록도 열어둘게요.', 'You are ready for details.')
    : t('처음엔 빠르게. 필요할 때만 열어요.', 'Start fast. Add details only when needed.')

  const syncManualEditor = (nextWorkoutType, nextDurationMinutes, nextSets = sets, nextLoadKg = loadKg) => {
    setShowManualEditor(shouldOpenManualEditor({
      workoutType: nextWorkoutType,
      durationMinutes: nextDurationMinutes,
      sets: nextSets,
      loadKg: nextLoadKg,
    }))
  }

  const resetForm = () => {
    const nextWorkoutType = recentWorkout?.workoutType || initialSelection?.workoutType || '러닝'
    const nextDurationMinutes = recentWorkout?.durationMinutes || initialSelection?.durationMinutes || 30
    const nextSets = initialSelection?.sets || 3
    const nextLoadKg = initialSelection?.loadKg ?? 0

    photoItems.forEach((item) => {
      if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl)
    })
    setWorkoutType(nextWorkoutType)
    setDurationMinutes(String(nextDurationMinutes))
    setSets(String(nextSets))
    setLoadKg(String(nextLoadKg))
    setNote('')
    setRoutineName(initialSelection?.name || '')
    setPhotoItems([])
    setShareToFeed(initialSelection?.defaultShareToFeed !== false)
    setShowAdvancedTools(hasPrefilledAdvanced || shouldExposeAdvanced)
    setShowRoutineTools(false)
    setShowOptionalFields(false)
    syncManualEditor(nextWorkoutType, nextDurationMinutes, nextSets, nextLoadKg)

    if (galleryInputRef.current) galleryInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const result = await onComplete({
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      sets: Number(sets) || 0,
      loadKg: Number(loadKg) || 0,
      note: note.trim(),
      photoItems,
      shareToFeed,
    })

    if (result !== false) resetForm()
  }

  const handleQuickWorkoutTypePick = (option) => {
    setWorkoutType(option)
    syncManualEditor(option, durationMinutes)
  }

  const handleQuickDurationPick = (value) => {
    setDurationMinutes(String(value))
    syncManualEditor(workoutType, value)
  }

  const handleQuickSetsPick = (value) => {
    setSets(String(value))
    syncManualEditor(workoutType, durationMinutes, value, loadKg)
  }

  const handleQuickWeightPick = (value) => {
    setLoadKg(String(value))
    syncManualEditor(workoutType, durationMinutes, sets, value)
  }

  const handleReuseRecent = () => {
    if (!recentWorkout?.workoutType) return
    const nextWorkoutType = recentWorkout.workoutType
    const nextDurationMinutes = recentWorkout.durationMinutes || 30
    const nextNote = recentWorkout.note || ''

    setWorkoutType(nextWorkoutType)
    setDurationMinutes(String(nextDurationMinutes))
    setNote(nextNote)
    if (nextNote) {
      setShowAdvancedTools(true)
      setShowOptionalFields(true)
    }
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
    await onSaveRoutine?.({
      name: routineName.trim(),
      workoutType,
      durationMinutes: Number(durationMinutes) || 0,
      sets: Number(sets) || 0,
      loadKg: Number(loadKg) || 0,
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

  const handleToggleAdvancedTools = () => {
    setShowAdvancedTools((prev) => {
      const next = !prev
      if (next && !prev) setShowOptionalFields(true)
      return next
    })
  }

  return (
    <section
      className="min-h-0 w-full max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] overflow-y-auto overscroll-contain rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:max-h-[calc(100dvh-3rem)]"
      data-testid="workout-panel-surface"
    >
      <div className="grid gap-5 p-5 pb-3 sm:p-6 sm:pb-4">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200 dark:bg-white/20" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? '10-sec log' : '10초 기록'}</span>
            <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Log today' : '오늘 운동 남기기'}</h2>
            <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
              {isEnglish ? 'Pick workout, time, save.' : '종목과 시간만 찍으면 끝.'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 dark:bg-emerald-700/20 dark:text-emerald-200">
                +{estimatedXp} XP
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">
                {todayDone
                  ? (isEnglish ? 'Streak safe' : '스트릭 안전')
                  : safeStreak > 0
                    ? (isEnglish ? `${safeStreak + 1}d streak` : `${safeStreak + 1}일 스트릭`)
                    : (isEnglish ? 'Start streak' : '스트릭 시작')}
              </span>
            </div>
          </div>
          <div className="grid justify-items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${todayDone ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`}>
              {todayDone ? (isEnglish ? 'Bonus OK' : '보너스 OK') : (isEnglish ? 'Ready' : '바로 시작')}
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
      </div>

      <form className="grid gap-5 px-5 pb-5 sm:px-6 sm:pb-6" onSubmit={handleSubmit}>
        <section className="grid gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-700/20">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">
                {isEnglish ? 'Quest reward' : '미션 보상'}
              </span>
              <strong className="text-lg font-black leading-tight text-gray-950 dark:text-white">{missionTitle}</strong>
              <p className="m-0 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">{missionBody}</p>
            </div>
            <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-black text-white">
              {missionProgress}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <span className="rounded-2xl bg-white p-3 text-center text-sm font-black text-emerald-800 shadow-sm dark:bg-neutral-950 dark:text-emerald-200">
              +{estimatedXp} XP
            </span>
            <span className="rounded-2xl bg-white p-3 text-center text-sm font-black text-gray-800 shadow-sm dark:bg-neutral-950 dark:text-gray-100">
              {isEnglish ? `${nextWeeklyCount}/${safeWeeklyGoal} week` : `이번 주 ${nextWeeklyCount}/${safeWeeklyGoal}`}
            </span>
            <span className="col-span-2 rounded-2xl bg-white p-3 text-center text-sm font-black text-gray-800 shadow-sm dark:bg-neutral-950 dark:text-gray-100 sm:col-span-1">
              {todayDone
                ? (isEnglish ? 'Bonus run' : '보너스 기록')
                : safeStreak > 0
                  ? (isEnglish ? 'Protect streak' : '스트릭 보호')
                  : (isEnglish ? 'First streak' : '첫 스트릭')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {xpAward.breakdown.map((item) => (
              <span
                key={item.type}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-800 shadow-sm dark:bg-neutral-950 dark:text-gray-100"
              >
                {getXpRuleLabel(item.type, language)} +{item.amount}
              </span>
            ))}
          </div>
        </section>

        <ProWorkoutNudge
          nudge={proWorkoutNudge}
          isPro={isPro}
          onOpenPaywall={onOpenPaywall}
        />

        <QuickChoiceGroup label={isEnglish ? 'Workout' : '운동 종목'}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {WORKOUT_OPTIONS.map((option) => (
              <ChoiceButton key={option} active={workoutType === option} onClick={() => handleQuickWorkoutTypePick(option)} disabled={loading}>
                <span className="mr-1 text-xs text-gray-700 dark:text-gray-200">{getWorkoutMark(option)}</span>
                {getWorkoutTypeLabel(option, language)}
              </ChoiceButton>
            ))}
          </div>
        </QuickChoiceGroup>

        <div className="grid gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-neutral-950">
          <QuickChoiceGroup label={isEnglish ? 'Time' : '시간'}>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_DURATION_OPTIONS.map((value) => (
                <ChoiceButton key={value} active={Number(durationMinutes) === value} onClick={() => handleQuickDurationPick(value)} disabled={loading}>
                  {isEnglish ? `${value}m` : `${value}분`}
                </ChoiceButton>
              ))}
            </div>
          </QuickChoiceGroup>
          <QuickChoiceGroup label={isEnglish ? 'Sets' : '세트'}>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_SET_OPTIONS.map((value) => (
                <ChoiceButton key={value} active={Number(sets) === value} onClick={() => handleQuickSetsPick(value)} disabled={loading}>
                  {isEnglish ? `${value}` : `${value}세트`}
                </ChoiceButton>
              ))}
            </div>
          </QuickChoiceGroup>
          <QuickChoiceGroup label={isEnglish ? 'Weight' : '무게'}>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_WEIGHT_OPTIONS.map((value) => (
                <ChoiceButton key={value} active={Number(loadKg) === value} onClick={() => handleQuickWeightPick(value)} disabled={loading}>
                  {getWeightLabel(value, isEnglish)}
                </ChoiceButton>
              ))}
            </div>
          </QuickChoiceGroup>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
          <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-700/20">
            <span className="block text-xs font-black text-emerald-700 dark:text-emerald-200">{isEnglish ? 'Expected XP' : '예상 XP'}</span>
            <strong className="mt-1 block text-2xl font-black text-emerald-800 dark:text-emerald-100">{`+${estimatedXp}`}</strong>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/10">
            <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{isEnglish ? 'Today' : '오늘'}</span>
            <strong className="mt-1 block text-2xl font-black text-gray-950 dark:text-white">{todayCount}</strong>
          </div>
          {recentWorkout?.workoutType ? (
            <button type="button" className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:hover:bg-white/10 sm:col-span-1" onClick={handleReuseRecent} disabled={loading}>
              <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{isEnglish ? 'Last' : '최근'}</span>
              <strong className="mt-1 block text-sm font-black text-gray-950 dark:text-white">
                {getWorkoutMark(recentWorkout.workoutType)} • {getWorkoutTypeLabel(recentWorkout.workoutType, language)}
                {recentWorkout.durationMinutes ? (isEnglish ? ` • ${recentWorkout.durationMinutes} min` : ` • ${recentWorkout.durationMinutes}분`) : ''}
              </strong>
            </button>
          ) : (
            <div className="col-span-2 rounded-2xl bg-gray-50 p-4 dark:bg-white/10 sm:col-span-1">
              <span className="block text-xs font-black text-gray-700 dark:text-gray-200">{isEnglish ? 'Summary' : '선택'}</span>
              <strong className="mt-1 block text-sm font-black leading-6 text-gray-950 dark:text-white">{workoutSummary}</strong>
            </div>
          )}
        </div>

        <button
          type="button"
          className="min-h-12 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100 dark:hover:bg-white/10"
          onClick={handleToggleAdvancedTools}
          aria-expanded={showAdvancedTools}
          data-testid="workout-toggle-extras"
        >
          {showAdvancedTools ? t('간단히 보기', 'Simple view') : t('더 자세히 기록하기', 'Add more details')}
          <span className="ml-2 text-xs font-bold text-gray-700 dark:text-gray-200">{advancedCopy}</span>
        </button>

        {showAdvancedTools && (
          <section className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-950">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
              aria-expanded={showManualEditor}
              onClick={() => setShowManualEditor((prev) => !prev)}
              disabled={loading}
              data-testid="manual-edit-toggle"
              aria-label={isEnglish ? 'Fine tune workout details' : '세부 값 직접 조정'}
            >
              <span className="grid gap-1">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Fine tune' : '직접 조정'}</span>
                <strong className="text-base font-black text-gray-950 dark:text-white">{workoutSummary}</strong>
                <span className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200">
                  {usesCustomSelection ? t('직접 값이 적용됐어요.', 'Custom value is on.') : t('세부 값은 여기서 바꿔요.', 'Change exact values here.')}
                </span>
              </span>
              <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">
                {showManualEditor ? t('닫기', 'Hide') : t('열기', 'Open')}
              </span>
            </button>

            {showManualEditor && (
              <div className="grid gap-3 sm:grid-cols-2" data-testid="manual-edit-fields">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Workout' : '운동'}</span>
                  <select className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" value={workoutType} onChange={(event) => {
                    setWorkoutType(event.target.value)
                    syncManualEditor(event.target.value, durationMinutes)
                  }} disabled={loading}>
                    {selectableWorkoutOptions.map((option) => (
                      <option key={option} value={option}>{getWorkoutTypeLabel(option, language)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Duration (min)' : '시간(분)'}</span>
                  <input className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" type="number" min="0" max="300" step="5" value={durationMinutes} onChange={(event) => {
                    setDurationMinutes(event.target.value)
                    syncManualEditor(workoutType, event.target.value)
                  }} disabled={loading} />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Sets' : '세트'}</span>
                  <input className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" type="number" min="0" max="30" step="1" value={sets} onChange={(event) => {
                    setSets(event.target.value)
                    syncManualEditor(workoutType, durationMinutes, event.target.value, loadKg)
                  }} disabled={loading} />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Weight (kg)' : '무게(kg)'}</span>
                  <input className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" type="number" min="0" max="500" step="2.5" value={loadKg} onChange={(event) => {
                    setLoadKg(event.target.value)
                    syncManualEditor(workoutType, durationMinutes, sets, event.target.value)
                  }} disabled={loading} />
                </label>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className={`grid min-h-20 gap-1 rounded-2xl border p-4 text-left transition disabled:opacity-50 ${showOptionalFields ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-50' : 'border-gray-100 bg-white text-gray-950 shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:text-white'}`} onClick={() => setShowOptionalFields((prev) => !prev)} disabled={loading} data-testid="workout-toggle-proof">
                <strong className="text-sm font-black">{isEnglish ? 'Memo & photos' : '메모/사진'}</strong>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{note.trim() || photoItems.length ? t('인증을 추가했어요.', 'Proof added.') : t('공유할 때만 추가해요.', 'Add only when useful.')}</span>
              </button>
              <button type="button" className={`grid min-h-20 gap-1 rounded-2xl border p-4 text-left transition disabled:opacity-50 ${showRoutineTools ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm dark:bg-emerald-700/20 dark:text-emerald-50' : 'border-gray-100 bg-white text-gray-950 shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:text-white'}`} onClick={() => setShowRoutineTools((prev) => !prev)} disabled={loading} data-testid="workout-toggle-routines">
                <strong className="text-sm font-black">{isEnglish ? 'Routine' : '루틴'}</strong>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{routineSummary}</span>
              </button>
            </div>

            {showOptionalFields && (
              <section className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
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

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Photos' : '사진'}</span>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200">{isEnglish ? `Up to ${MAX_PHOTOS}.` : `최대 ${MAX_PHOTOS}장`}</span>
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
                  <PhotoProofList items={photoItems} isEnglish={isEnglish} onRemove={handleRemovePhoto} />
                </div>

                <section className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
                  <div className="grid gap-1">
                    <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Feed share' : '피드 공유'}</span>
                    <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{isEnglish ? 'Turn off to keep private.' : '끄면 나만 봐요.'}</p>
                  </div>
                  <button type="button" className={`min-h-11 rounded-lg px-4 text-sm font-black transition disabled:opacity-50 ${shareToFeed ? 'bg-emerald-700 text-white shadow-sm' : 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-100'}`} onClick={() => setShareToFeed((prev) => !prev)} disabled={loading} data-testid="share-toggle">
                    {shareToFeed ? (isEnglish ? 'Public' : '공개') : (
                      <>
                        <span className="sr-only">Private </span>
                        {isEnglish ? 'Private' : '비공개'}
                      </>
                    )}
                  </button>
                </section>
              </section>
            )}

            {showRoutineTools && (
              <section className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Routines' : '루틴'}</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">{isEnglish ? `${routineTemplates.length}` : `${routineTemplates.length}개`}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label className="grid gap-2">
                    <span className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Routine name' : '루틴 이름'}</span>
                    <input className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-950 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-neutral-950 dark:text-white" type="text" maxLength="20" placeholder={isEnglish ? 'ex: Morning Run' : '예: 아침 러닝'} value={routineName} onChange={(event) => setRoutineName(event.target.value)} disabled={loading} />
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
                              {routine.duration_minutes ? (isEnglish ? ` • ${routine.duration_minutes} min` : ` • ${routine.duration_minutes}분`) : ''}
                            </span>
                            {displayNote && <p className="m-0 text-xs font-semibold text-gray-700 dark:text-gray-200">{displayNote}</p>}
                          </button>
                          <button type="button" className="min-h-11 self-start rounded-lg bg-rose-50 px-3 text-xs font-black text-rose-600 disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-300" onClick={() => onDeleteRoutine?.(routine.id)} disabled={loading}>
                            {isEnglish ? 'Delete' : '삭제'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid gap-1 rounded-2xl border border-dashed border-gray-200 p-4 text-center dark:border-white/10">
                    <strong className="text-sm font-black text-gray-950 dark:text-white">{isEnglish ? 'Save your go-to' : '자주 하는 운동 저장'}</strong>
                    <p className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">{isEnglish ? 'Next time is one tap.' : '다음엔 한 번에 시작해요.'}</p>
                  </div>
                )}
              </section>
            )}
          </section>
        )}

        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 border-t border-gray-100 bg-white/95 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95 sm:-mx-6 sm:-mb-6 sm:p-6">
          <button type="submit" className="min-h-14 w-full rounded-lg bg-emerald-700 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading} data-testid="workout-submit">
            {stickySubmitLabel}
          </button>
        </div>
      </form>
    </section>
  )
}
