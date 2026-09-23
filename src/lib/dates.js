// toYmd(date) — a Date to '2026-09-18'
export function toYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// fromYmd(ymd) — back again
export function fromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}
// isClosed(ymd) — weekend or bank holiday
export function isClosed(ymd) {
  const date = fromYmd(ymd)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

// datesBetween(start, end) — inclusive list of date strings
export function datesBetween(start, end) {
    const startDate = fromYmd(start)
    const endDate = fromYmd(end)
    const dates = []
    let currentDate = startDate
    while (currentDate <= endDate) {
      dates.push(toYmd(currentDate))
      currentDate = new Date(currentDate.getTime() + 86400000) // Add one day
    }
    return dates
}

// workingDays(start, end) — the count that actually costs someone leave
export function workingDays(start, end) {
  const dates = datesBetween(start, end)
  return dates.filter((date) => !isClosed(date)).length
}

// daysInMonth(year, month) — every day in a month with `{ ymd, number, letter, closed, isToday }`
export function daysInMonth(year, month) {
  const date = new Date(year, month - 1, 1)
  const days = []
  while (date.getMonth() === month - 1) {
    const ymd = toYmd(date)
    days.push({
      ymd,
      number: date.getDate(),
      letter: date.toLocaleDateString('en-US', { weekday: 'short' }),
      closed: isClosed(ymd),
      isToday: date.toDateString() === new Date().toDateString()
    })
    date.setDate(date.getDate() + 1)
  }
  return days
}

// prettyRange(start, end) — '21 Sep – 25 Sep'
export function prettyRange(start, end) {
  const startDate = fromYmd(start)
  const endDate = fromYmd(end)
  const options = { day: 'numeric', month: 'short' }
  const startStr = startDate.toLocaleDateString('en-US', options)
  const endStr = endDate.toLocaleDateString('en-US', options)
  return `${startStr} – ${endStr}`
}

// Days the office is closed. Scottish bank holidays for 2026 and 2027.
export const CLOSED_DAYS = [
  '2026-01-01', '2026-01-02', '2026-04-03', '2026-05-04', '2026-05-25',
  '2026-08-03', '2026-11-30', '2026-12-25', '2026-12-28',
  '2027-01-01', '2027-01-04', '2027-03-26', '2027-05-03', '2027-05-31',
  '2027-08-02', '2027-11-30', '2027-12-27', '2027-12-28'
]