const A = "A".charCodeAt(0)
const Z = "Z".charCodeAt(0)

/**
 * Encodes a 0-based index into a FITS-friendly observation label.
 * 0..25 → A..Z, 26..51 → _A.._Z, 52..77 → __A..__Z, etc.
 *
 * The underscore prefix sorts after Z in ASCII (`_` is 0x5F, `Z` is 0x5A),
 * so labels remain lexicographically ordered as the depth grows.
 */
export function obsNFromIndex(index: number): string {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`obsNFromIndex: expected non-negative integer, got ${index}`)
  }
  const depth = Math.floor(index / 26)
  const letter = String.fromCharCode(A + (index % 26))
  return "_".repeat(depth) + letter
}

/** Inverse of {@link obsNFromIndex}. Returns -1 if the label is not a valid OBS-N. */
export function obsNToIndex(label: string): number {
  let depth = 0
  while (depth < label.length && label.charCodeAt(depth) === "_".charCodeAt(0)) depth++
  if (depth !== label.length - 1) return -1
  const code = label.charCodeAt(depth)
  if (code < A || code > Z) return -1
  return depth * 26 + (code - A)
}

/**
 * Given the current highest OBS-N on a plate (or an empty/null value for an
 * empty plate), returns the next label in the sequence.
 */
export function nextObsN(currentMax: string | null | undefined): string {
  if (!currentMax) return "A"
  const idx = obsNToIndex(currentMax)
  return obsNFromIndex(idx < 0 ? 0 : idx + 1)
}
