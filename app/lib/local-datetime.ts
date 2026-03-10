const LOCAL_DATETIME_SECONDS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/
const LOCAL_DATETIME_MINUTES_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function normalizeLocalDateTime(value: string): string {
  if (LOCAL_DATETIME_SECONDS_RE.test(value)) return value
  if (LOCAL_DATETIME_MINUTES_RE.test(value)) return `${value}:00`
  return value
}

export function splitLocalDateTime(value: string) {
  const normalized = normalizeLocalDateTime(value)
  const [date, time] = normalized.split("T")
  if (!date || !time) {
    throw new TypeError(`Invalid local datetime value: ${value}`)
  }

  return { date, time }
}
