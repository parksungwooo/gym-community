const QUESTIONS = [
  {
    id: 'q1',
    question: { ko: '하루에 얼마나 걸어요?', en: 'How much do you walk each day?' },
    options: [
      { label: { ko: '거의 안 걸어요', en: 'Almost none' }, score: 1 },
      { label: { ko: '10~30분', en: '10-30 min' }, score: 4 },
      { label: { ko: '30~60분', en: '30-60 min' }, score: 7 },
      { label: { ko: '1시간 이상', en: '60+ min' }, score: 10 },
    ],
  },
  {
    id: 'q2',
    question: { ko: '계단 3층, 숨차요?', en: 'Three floors. How hard?' },
    options: [
      { label: { ko: '많이 힘들어요', en: 'Very hard' }, score: 1 },
      { label: { ko: '살짝 버거워요', en: 'A bit hard' }, score: 4 },
      { label: { ko: '괜찮아요', en: 'Manageable' }, score: 7 },
      { label: { ko: '가뿐해요', en: 'Easy' }, score: 10 },
    ],
  },
  {
    id: 'q3',
    question: { ko: '이번 주 운동 몇 번?', en: 'Workouts this week?' },
    options: [
      { label: { ko: '아직 0회', en: '0' }, score: 1 },
      { label: { ko: '1~2회', en: '1-2' }, score: 4 },
      { label: { ko: '3~4회', en: '3-4' }, score: 7 },
      { label: { ko: '5회 이상', en: '5+' }, score: 10 },
    ],
  },
  {
    id: 'q4',
    question: { ko: '푸시업 몇 개 가능해요?', en: 'Push-ups in a row?' },
    options: [
      { label: { ko: '1~5개', en: '1-5' }, score: 1 },
      { label: { ko: '6~15개', en: '6-15' }, score: 4 },
      { label: { ko: '16~30개', en: '16-30' }, score: 7 },
      { label: { ko: '31개 이상', en: '31+' }, score: 10 },
    ],
  },
  {
    id: 'q5',
    question: { ko: '플랭크 얼마나 버텨요?', en: 'Plank hold time?' },
    options: [
      { label: { ko: '10초 미만', en: '< 10 sec' }, score: 1 },
      { label: { ko: '10~30초', en: '10-30 sec' }, score: 4 },
      { label: { ko: '31~60초', en: '31-60 sec' }, score: 7 },
      { label: { ko: '1분 이상', en: '60+ sec' }, score: 10 },
    ],
  },
  {
    id: 'q6',
    question: { ko: '아침 컨디션은 어때요?', en: 'Morning energy?' },
    options: [
      { label: { ko: '늘 피곤해요', en: 'Always tired' }, score: 1 },
      { label: { ko: '자주 무거워요', en: 'Often tired' }, score: 4 },
      { label: { ko: '가끔 피곤해요', en: 'Sometimes tired' }, score: 7 },
      { label: { ko: '꽤 상쾌해요', en: 'Fresh' }, score: 10 },
    ],
  },
  {
    id: 'q7',
    question: { ko: '유산소 20분 가능해요?', en: '20 min cardio?' },
    options: [
      { label: { ko: '아직 어려워요', en: 'Not yet' }, score: 1 },
      { label: { ko: '쉬면 가능해요', en: 'With breaks' }, score: 4 },
      { label: { ko: '무난해요', en: 'Comfortable' }, score: 7 },
      { label: { ko: '여유 있어요', en: 'Easy' }, score: 10 },
    ],
  },
  {
    id: 'q8',
    question: { ko: '물은 잘 마셔요?', en: 'Water each day?' },
    options: [
      { label: { ko: '2컵 이하', en: '2 cups or less' }, score: 1 },
      { label: { ko: '3~4컵', en: '3-4 cups' }, score: 4 },
      { label: { ko: '5~7컵', en: '5-7 cups' }, score: 7 },
      { label: { ko: '8컵 이상', en: '8+ cups' }, score: 10 },
    ],
  },
  {
    id: 'q9',
    question: { ko: '운동 후 회복은 빨라요?', en: 'Recovery speed?' },
    options: [
      { label: { ko: '다음날도 힘들어요', en: 'Still sore next day' }, score: 1 },
      { label: { ko: '조금 느려요', en: 'Slow' }, score: 4 },
      { label: { ko: '보통이에요', en: 'Average' }, score: 7 },
      { label: { ko: '빨라요', en: 'Quick' }, score: 10 },
    ],
  },
  {
    id: 'q10',
    question: { ko: '요즘 내 몸, 만족해요?', en: 'Body feels good lately?' },
    options: [
      { label: { ko: '바꾸고 싶어요', en: 'Want change' }, score: 1 },
      { label: { ko: '아쉬워요', en: 'Not great' }, score: 4 },
      { label: { ko: '괜찮아요', en: 'Okay' }, score: 7 },
      { label: { ko: '좋아요', en: 'Good' }, score: 10 },
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
