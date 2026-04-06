import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'fitloop-language'

const badgeLabels = {
  starter: { ko: '시작 배지', en: 'Starter Badge' },
  weekly3: { ko: '주 3회 달성', en: '3 Workouts This Week' },
  streak3: { ko: '3일 연속', en: '3-Day Streak' },
  streak7: { ko: '7일 연속', en: '7-Day Streak' },
  highFitness: { ko: '상위 체력', en: 'High Fitness' },
  first_workout: { ko: '첫 운동 기록', en: 'First Workout' },
  first_photo_proof: { ko: '첫 사진 인증', en: 'First Photo Proof' },
  streak_3: { ko: '3일 연속', en: '3-Day Streak' },
  streak_7: { ko: '7일 연속', en: '7-Day Streak' },
  streak_14: { ko: '14일 연속', en: '14-Day Streak' },
  goal_first_clear: { ko: '주간 목표 달성', en: 'Weekly Goal Clear' },
  first_test: { ko: '첫 체력 테스트', en: 'First Fitness Test' },
  weight_goal_25: { ko: '체중 목표 25%', en: '25% Weight Goal' },
  weight_goal_100: { ko: '체중 목표 달성', en: 'Weight Goal Complete' },
  workout_100: { ko: '운동 100회', en: '100 Workouts' },
}

const workoutTypeLabels = {
  러닝: { ko: '러닝', en: 'Run' },
  웨이트: { ko: '웨이트', en: 'Weights' },
  스트레칭: { ko: '스트레칭', en: 'Stretch' },
  요가: { ko: '요가', en: 'Yoga' },
  필라테스: { ko: '필라테스', en: 'Pilates' },
  사이클: { ko: '사이클', en: 'Cycle' },
  기타: { ko: '기타', en: 'Other' },
  '빠른 체크인': { ko: '빠른 체크인', en: 'Quick Check-in' },
  운동: { ko: '운동', en: 'Workout' },
}

const languageMeta = {
  ko: { locale: 'ko-KR', label: '한국어' },
  en: { locale: 'en-US', label: 'English' },
}

const I18nContext = createContext(null)

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'ko'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'en' ? 'en' : 'ko'
}

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      locale: languageMeta[language].locale,
      languageLabel: languageMeta[language].label,
      isEnglish: language === 'en',
    }),
    [language],
  )

  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used inside I18nProvider')
  return context
}

export function getBadgeLabel(key, language = 'ko') {
  return badgeLabels[key]?.[language] ?? key
}

export function getWorkoutTypeLabel(type, language = 'ko') {
  return workoutTypeLabels[type]?.[language] ?? type ?? (language === 'en' ? 'Workout' : '운동')
}

export function formatDateByLanguage(date, language, options) {
  return new Date(date).toLocaleDateString(languageMeta[language]?.locale ?? 'ko-KR', options)
}

export function formatDateTimeByLanguage(date, language, options) {
  return new Date(date).toLocaleString(languageMeta[language]?.locale ?? 'ko-KR', options)
}
