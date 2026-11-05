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

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/** Factor que lleva el MAD a una estimacion de sigma en una distribucion normal. */
const MAD_TO_SIGMA = 1.4826

/**
 * Sigma robusta: MAD (mediana de |valor - mediana|) escalada para equivaler a
 * la desviacion estandar de una normal. A diferencia de esta, unos pocos
 * valores muy alejados casi no la mueven.
 */
export function robustSigma(values: number[]): number {
  const center = median(values)
  return MAD_TO_SIGMA * median(values.map((v) => Math.abs(v - center)))
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
