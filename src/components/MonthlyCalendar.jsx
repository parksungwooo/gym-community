import { useI18n } from '../i18n.js'

function getCalendarDays(history, language) {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const firstWeekday = firstDay.getDay()
  const doneDates = new Set(history.map((item) => item.date))
  const cells = []

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ key: `empty-${i}`, empty: true })
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), day)
    const key = date.toLocaleDateString('sv-SE')
    cells.push({
      key,
      day,
      done: doneDates.has(key),
      isToday: key === new Date().toLocaleDateString('sv-SE'),
    })
  }

  return {
    monthLabel: now.toLocaleDateString(language === 'en' ? 'en-US' : 'ko-KR', {
      year: 'numeric',
      month: 'long',
    }),
    cells,
  }
}

export default function MonthlyCalendar({ history }) {
  const { language, isEnglish } = useI18n()
  const { monthLabel, cells } = getCalendarDays(history, language)
  const weekdays = isEnglish ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['일', '월', '화', '수', '목', '금', '토']

  return (
    <section className="card record-module-card compact">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Calendar' : '캘린더'}</span>
          <h2>{isEnglish ? 'Monthly Calendar' : '월간 캘린더'}</h2>
        </div>
        <span className="community-mini-pill">{monthLabel}</span>
      </div>
      <p className="subtext compact">{isEnglish ? `Workout completion for ${monthLabel}.` : `${monthLabel} 운동 완료 현황입니다.`}</p>

      <div className="calendar-weekdays">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) =>
          cell.empty ? (
            <div key={cell.key} className="calendar-cell empty" />
          ) : (
            <article
              key={cell.key}
              className={`calendar-cell ${cell.done ? 'done' : ''} ${cell.isToday ? 'today' : ''}`}
            >
              <span>{cell.day}</span>
              <strong>{cell.done ? (isEnglish ? 'Done' : '완료') : '-'}</strong>
            </article>
          ),
        )}
      </div>
    </section>
  )
}

