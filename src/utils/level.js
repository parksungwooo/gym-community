const LEVELS = [
  { min: 0, max: 20, value: 1, koLabel: 'Lv1: 위험', enLabel: 'Lv1: At Risk' },
  { min: 21, max: 40, value: 2, koLabel: 'Lv2: 낮음', enLabel: 'Lv2: Low' },
  { min: 41, max: 60, value: 3, koLabel: 'Lv3: 보통', enLabel: 'Lv3: Average' },
  { min: 61, max: 80, value: 4, koLabel: 'Lv4: 좋음', enLabel: 'Lv4: Good' },
  { min: 81, max: 100, value: 5, koLabel: 'Lv5: 매우 좋음', enLabel: 'Lv5: Excellent' },
]

const RESULT_MESSAGES = {
  ko: {
    1: '지금은 시작점이에요. 오늘 한 번이면 충분합니다.',
    2: '기초는 충분해요. 이제 리듬만 만들면 돼요.',
    3: '좋은 출발이에요. 꾸준히 쌓으면 바로 달라져요.',
    4: '페이스가 좋아요. 이번 주만 지키면 더 올라갑니다.',
    5: '이미 강합니다. 오늘 루틴을 피드에 남겨요.',
  },
  en: {
    1: 'This is your starting point. Today is enough to begin changing it.',
    2: 'You have solid potential. Now it is about actually moving.',
    3: 'Average is stable, but it will not stand out for long.',
    4: 'You are in a strong rhythm. A little more consistency puts you ahead.',
    5: 'You are flying. Share that momentum with the community.',
  },
}

export function getLevelByScore(score) {
  const matched = LEVELS.find((level) => score >= level.min && score <= level.max) ?? LEVELS[0]

  return {
    ...matched,
    label: matched.koLabel,
  }
}

export function getLevelLabel(value, language = 'ko') {
  const matched = LEVELS.find((level) => level.value === Number(value)) ?? LEVELS[0]
  return language === 'en' ? matched.enLabel : matched.koLabel
}

export function getResultMessage(levelValue, language = 'ko') {
  return RESULT_MESSAGES[language]?.[levelValue] ?? RESULT_MESSAGES.ko[1]
}

export function getLevelValue(levelText) {
  const matched = String(levelText ?? '').match(/Lv(\d)/)
  return matched ? Number(matched[1]) : 1
}

export function localizeLevelText(levelText, language = 'ko') {
  return getLevelLabel(getLevelValue(levelText), language)
}
