const QUESTIONS = [
  {
    id: 'q1',
    question: { ko: '하루 평균 걷는 시간은?', en: 'How long do you walk on average each day?' },
    options: [
      { label: { ko: '10분 미만', en: 'Less than 10 min' }, score: 1 },
      { label: { ko: '10~30분', en: '10-30 min' }, score: 4 },
      { label: { ko: '30~60분', en: '30-60 min' }, score: 7 },
      { label: { ko: '60분 이상', en: 'More than 60 min' }, score: 10 },
    ],
  },
  {
    id: 'q2',
    question: { ko: '계단 3층을 오를 때 숨이 차는 정도는?', en: 'How out of breath do you get after climbing three floors of stairs?' },
    options: [
      { label: { ko: '매우 힘들다', en: 'Very hard' }, score: 1 },
      { label: { ko: '조금 힘들다', en: 'A little hard' }, score: 4 },
      { label: { ko: '보통이다', en: 'Manageable' }, score: 7 },
      { label: { ko: '거의 안 힘들다', en: 'Barely hard' }, score: 10 },
    ],
  },
  {
    id: 'q3',
    question: { ko: '일주일 운동 횟수는?', en: 'How many times do you work out in a week?' },
    options: [
      { label: { ko: '0회', en: '0 times' }, score: 1 },
      { label: { ko: '1~2회', en: '1-2 times' }, score: 4 },
      { label: { ko: '3~4회', en: '3-4 times' }, score: 7 },
      { label: { ko: '5회 이상', en: '5+ times' }, score: 10 },
    ],
  },
  {
    id: 'q4',
    question: { ko: '팔굽혀펴기 연속 수행 가능 횟수는?', en: 'How many push-ups can you do in a row?' },
    options: [
      { label: { ko: '1~5개', en: '1-5 reps' }, score: 1 },
      { label: { ko: '6~15개', en: '6-15 reps' }, score: 4 },
      { label: { ko: '16~30개', en: '16-30 reps' }, score: 7 },
      { label: { ko: '31개 이상', en: '31+ reps' }, score: 10 },
    ],
  },
  {
    id: 'q5',
    question: { ko: '플랭크 유지 시간은?', en: 'How long can you hold a plank?' },
    options: [
      { label: { ko: '10초 미만', en: 'Less than 10 sec' }, score: 1 },
      { label: { ko: '10~30초', en: '10-30 sec' }, score: 4 },
      { label: { ko: '31~60초', en: '31-60 sec' }, score: 7 },
      { label: { ko: '61초 이상', en: 'More than 61 sec' }, score: 10 },
    ],
  },
  {
    id: 'q6',
    question: { ko: '아침에 일어났을 때 피로감은?', en: 'How tired do you feel when you wake up?' },
    options: [
      { label: { ko: '항상 피곤하다', en: 'Always tired' }, score: 1 },
      { label: { ko: '자주 피곤하다', en: 'Often tired' }, score: 4 },
      { label: { ko: '가끔 피곤하다', en: 'Sometimes tired' }, score: 7 },
      { label: { ko: '대체로 상쾌하다', en: 'Usually refreshed' }, score: 10 },
    ],
  },
  {
    id: 'q7',
    question: { ko: '유산소 운동(달리기/사이클) 20분 가능 여부는?', en: 'Can you do 20 minutes of cardio without much trouble?' },
    options: [
      { label: { ko: '거의 불가능', en: 'Almost impossible' }, score: 1 },
      { label: { ko: '중간에 쉬어야 가능', en: 'Possible with breaks' }, score: 4 },
      { label: { ko: '무난히 가능', en: 'Comfortably possible' }, score: 7 },
      { label: { ko: '여유롭게 가능', en: 'Very easy' }, score: 10 },
    ],
  },
  {
    id: 'q8',
    question: { ko: '평소 물 섭취량은?', en: 'How much water do you usually drink?' },
    options: [
      { label: { ko: '하루 2컵 이하', en: '2 cups or less' }, score: 1 },
      { label: { ko: '하루 3~4컵', en: '3-4 cups' }, score: 4 },
      { label: { ko: '하루 5~7컵', en: '5-7 cups' }, score: 7 },
      { label: { ko: '하루 8컵 이상', en: '8+ cups' }, score: 10 },
    ],
  },
  {
    id: 'q9',
    question: { ko: '운동 후 회복 속도는?', en: 'How quickly do you recover after exercise?' },
    options: [
      { label: { ko: '다음날까지 매우 힘들다', en: 'Still exhausted the next day' }, score: 1 },
      { label: { ko: '회복이 느리다', en: 'Recovery feels slow' }, score: 4 },
      { label: { ko: '보통이다', en: 'Average recovery' }, score: 7 },
      { label: { ko: '회복이 빠르다', en: 'Recovery feels quick' }, score: 10 },
    ],
  },
  {
    id: 'q10',
    question: { ko: '최근 1개월 몸 상태 만족도는?', en: 'How satisfied are you with your body condition in the last month?' },
    options: [
      { label: { ko: '매우 불만족', en: 'Very dissatisfied' }, score: 1 },
      { label: { ko: '불만족', en: 'Dissatisfied' }, score: 4 },
      { label: { ko: '보통', en: 'Neutral' }, score: 7 },
      { label: { ko: '만족', en: 'Satisfied' }, score: 10 },
    ],
  },
]

export function getTestQuestions(language = 'ko') {
  return QUESTIONS.map((item) => ({
    id: item.id,
    question: item.question[language],
    options: item.options.map((option) => ({
      label: option.label[language],
      score: option.score,
    })),
  }))
}
