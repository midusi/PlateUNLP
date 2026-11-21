import { clamp } from "~/lib/math"

/**
 * Rango de columnas visibles, `[start, end)`, medido en pixeles del recorte
 * (la columna `i` ocupa el intervalo `[i, i + 1)`).
 */
export interface XViewport {
  start: number
  end: number
}

/** Cantidad minima de columnas visibles al ampliar. */
export const MIN_VIEWPORT_SPAN = 20

/** Vista completa de `length` columnas. */
export function fullViewport(length: number): XViewport {
  return { start: 0, end: length }
}

/** Indica si el viewport abarca todas las columnas. */
export function isFullViewport(viewport: XViewport, length: number): boolean {
  return viewport.start <= 0 && viewport.end >= length
}

/**
 * Ajusta el viewport a `[0, length]`: el ancho queda entre el minimo y `length`
 * y la ventana se corre (sin achicarse) para no salirse de los bordes.
 */
export function clampViewport(viewport: XViewport, length: number): XViewport {
  const span = clamp(viewport.end - viewport.start, Math.min(MIN_VIEWPORT_SPAN, length), length)
  const start = clamp(viewport.start, 0, length - span)
  return { start, end: start + span }
}

/**
 * Acerca (`factor > 1`) o aleja (`factor < 1`) manteniendo `anchor` (una
 * columna) en la misma posicion de pantalla.
 */
export function zoomAt(
  viewport: XViewport,
  anchor: number,
  factor: number,
  length: number,
): XViewport {
  const span = viewport.end - viewport.start
  const newSpan = clamp(span / factor, Math.min(MIN_VIEWPORT_SPAN, length), length)
  const anchorRatio = (anchor - viewport.start) / span
  const start = anchor - anchorRatio * newSpan
  return clampViewport({ start, end: start + newSpan }, length)
}

/** Desplaza el viewport `deltaColumns` columnas, sin cambiar su ancho. */
export function panBy(viewport: XViewport, deltaColumns: number, length: number): XViewport {
  return clampViewport(
    { start: viewport.start + deltaColumns, end: viewport.end + deltaColumns },
    length,
  )
}
