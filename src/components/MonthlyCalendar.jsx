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
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200">{isEnglish ? 'Calendar' : '캘린더'}</span>
          <h2 className="m-0 text-2xl font-black leading-tight text-gray-950 dark:text-white">{isEnglish ? 'Monthly' : '월간'}</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-800 dark:bg-white/10 dark:text-gray-100">
          {isEnglish ? `${completedDays} done` : `${completedDays}일`}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((day) => (
          <span key={day} className="text-xs font-black uppercase text-gray-700 dark:text-gray-200">{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) =>
          cell.empty ? (
            <div key={cell.key} className="aspect-square rounded-lg bg-transparent" />
          ) : (
            <article
              key={cell.key}
              className={`grid aspect-square place-items-center rounded-lg border text-center transition ${
                cell.done
                  ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                  : cell.isToday
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-700/20 dark:text-emerald-100'
                    : 'border-gray-100 bg-gray-50 text-gray-800 dark:border-white/10 dark:bg-neutral-950 dark:text-gray-100'
              }`}
              aria-label={
                isEnglish
                  ? `${monthLabel} ${cell.day}${cell.done ? ', logged' : ''}${cell.isToday ? ', today' : ''}`
                  : `${monthLabel} ${cell.day}일${cell.done ? ', 기록 있음' : ''}${cell.isToday ? ', 오늘' : ''}`
              }
            >
              <span className="text-sm font-black">{cell.day}</span>
              <strong className="sr-only">{cell.done ? (isEnglish ? 'Logged' : '기록 있음') : ''}</strong>
            </article>
          ),
        )}
      </div>
    </section>
  )
}
