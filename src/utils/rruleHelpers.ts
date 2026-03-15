export const WEEKDAYS = [
  { label: 'Mon', rruleDay: 'MO' },
  { label: 'Tue', rruleDay: 'TU' },
  { label: 'Wed', rruleDay: 'WE' },
  { label: 'Thu', rruleDay: 'TH' },
  { label: 'Fri', rruleDay: 'FR' },
  { label: 'Sat', rruleDay: 'SA' },
  { label: 'Sun', rruleDay: 'SU' },
]

export function buildRrule(freq: string, interval: number, days: string[], endType: 'until' | 'count', until: string, count: number) {
  let rule = `FREQ=${freq};INTERVAL=${interval}`
  if (freq === 'WEEKLY' && days.length > 0) rule += `;BYDAY=${days.join(',')}`
  if (endType === 'count') rule += `;COUNT=${count}`
  else {
    const d = new Date(`${until}T23:59:59Z`)
    rule += `;UNTIL=${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
  }
  return rule
}

export function rruleHumanText(freq: string, interval: number, days: string[], endType: 'until' | 'count', until: string, count: number) {
  const freqLabel = freq === 'DAILY' ? 'day' : freq === 'WEEKLY' ? 'week' : 'month'
  const intervalText = interval === 1 ? `Every ${freqLabel}` : `Every ${interval} ${freqLabel}s`
  const daysText = freq === 'WEEKLY' && days.length > 0 ? ` on ${days.join(', ')}` : ''
  const endText = endType === 'count' ? `, ${count} times` : ` until ${until}`
  return `${intervalText}${daysText}${endText}`
}
