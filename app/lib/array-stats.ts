export function minBy<T>(values: T[], accessor: (value: T) => number): number | undefined {
  let min: number | undefined
  for (const value of values) {
    const candidate = accessor(value)
    if (Number.isNaN(candidate)) continue
    if (min === undefined || candidate < min) min = candidate
  }
  return min
}

export function maxBy<T>(values: T[], accessor: (value: T) => number): number | undefined {
  let max: number | undefined
  for (const value of values) {
    const candidate = accessor(value)
    if (Number.isNaN(candidate)) continue
    if (max === undefined || candidate > max) max = candidate
  }
  return max
}

export function bisectRightBy<T>(
  values: T[],
  target: number,
  accessor: (value: T) => number,
): number {
  let low = 0
  let high = values.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (target < accessor(values[mid])) high = mid
    else low = mid + 1
  }
  return low
}
