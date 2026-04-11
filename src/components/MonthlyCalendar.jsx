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
  const completedDays = cells.filter((cell) => cell.done).length

  return (
    <section className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:p-6">
      <div className="app-section-heading compact">
        <div>
          <span className="app-section-kicker">{isEnglish ? 'Calendar' : '캘린더'}</span>
          <h2>{isEnglish ? 'Monthly' : '월간'}</h2>
        </div>
        <span className="community-mini-pill">
          {isEnglish ? `${completedDays} done` : `${completedDays}일`}
        </span>
      </div>

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
              aria-label={
                isEnglish
                  ? `${monthLabel} ${cell.day}${cell.done ? ', logged' : ''}${cell.isToday ? ', today' : ''}`
                  : `${monthLabel} ${cell.day}일${cell.done ? ', 기록 있음' : ''}${cell.isToday ? ', 오늘' : ''}`
              }
            >
              <span>{cell.day}</span>
              <strong aria-hidden="true">{cell.done ? '•' : ''}</strong>
            </article>
          ),
        )}
      </div>
    </section>
  )
}
