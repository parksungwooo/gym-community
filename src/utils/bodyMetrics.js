function roundTo(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return null
  return Number(Number(value).toFixed(digits))
}

export function getBmiCategory(bmi, isEnglish = false) {
  if (bmi == null) return isEnglish ? 'Add height and weight' : '키와 몸무게를 입력해보세요'
  if (bmi < 18.5) return isEnglish ? 'Underweight' : '저체중'
  if (bmi < 23) return isEnglish ? 'Healthy range' : '정상 범위'
  if (bmi < 25) return isEnglish ? 'Overweight' : '과체중'
  return isEnglish ? 'Obesity range' : '비만 범위'
}

export function buildBodyMetrics(profile, weightLogs = []) {
  const heightCm = Number(profile?.height_cm)
  const targetWeightKg = Number(profile?.target_weight_kg)
  const hasHeight = Number.isFinite(heightCm) && heightCm > 0
  const hasTarget = Number.isFinite(targetWeightKg) && targetWeightKg > 0
  const sortedLogs = [...weightLogs]
    .filter((item) => Number(item.weight_kg) > 0)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
  const latestLog = sortedLogs[sortedLogs.length - 1] ?? null
  const previousLog = sortedLogs[sortedLogs.length - 2] ?? null
  const firstLog = sortedLogs[0] ?? null
  const latestWeightKg = latestLog ? roundTo(latestLog.weight_kg, 1) : null
  const previousWeightKg = previousLog ? roundTo(previousLog.weight_kg, 1) : null
  const startWeightKg = firstLog ? roundTo(firstLog.weight_kg, 1) : null
  const bmi = hasHeight && latestWeightKg
    ? roundTo(latestWeightKg / ((heightCm / 100) ** 2), 1)
    : null

  const changeFromPreviousKg = latestWeightKg != null && previousWeightKg != null
    ? roundTo(latestWeightKg - previousWeightKg, 1)
    : null
  const changeFromStartKg = latestWeightKg != null && startWeightKg != null && sortedLogs.length > 1
    ? roundTo(latestWeightKg - startWeightKg, 1)
    : null
  const targetDeltaKg = hasTarget && latestWeightKg != null
    ? roundTo(latestWeightKg - targetWeightKg, 1)
    : null

  let goalProgressPercent = null
  if (hasTarget && latestWeightKg != null && startWeightKg != null) {
    const totalDistance = Math.abs(startWeightKg - targetWeightKg)
    const currentDistance = Math.abs(latestWeightKg - targetWeightKg)

    if (totalDistance === 0) {
      goalProgressPercent = 100
    } else {
      goalProgressPercent = Math.max(0, Math.min(100, roundTo(((totalDistance - currentDistance) / totalDistance) * 100, 0)))
    }
  }

  return {
    heightCm: hasHeight ? roundTo(heightCm, 1) : null,
    targetWeightKg: hasTarget ? roundTo(targetWeightKg, 1) : null,
    latestWeightKg,
    previousWeightKg,
    startWeightKg,
    latestRecordedAt: latestLog?.recorded_at ?? null,
    bmi,
    changeFromPreviousKg,
    changeFromStartKg,
    targetDeltaKg,
    goalProgressPercent,
    history: sortedLogs.map((item) => ({
      id: item.id,
      weightKg: roundTo(item.weight_kg, 1),
      recordedAt: item.recorded_at,
    })),
  }
}
