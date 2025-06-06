import type { Point } from "@/interfaces/Point"

/**
 * Funcion que dado un punto, una pendiente y una distancia devuelve los puntos
 * que corresponden siguiedo la pendiente a la distancia indicada.
 * @param {Point} point - Punto medio desde el que hacer las cuentas.
 * @param {number} m - Pendiente. Si es totalmente vertical mandar 'Infinity'.
 * @param {number} distance - Distancia entre el punto medio y los puntos buscados
 * @returns { forward, backward: Point } -
 * Puntos recorriendo la distancia hacia delante y hacia atrás
 */
export function extremePoints(
  point: Point,
  m: number,
  distance: number,
): { forward: Point; backward: Point } {
  let forward: Point
  let backward: Point
  if (m === Number.POSITIVE_INFINITY) {
    // Funcion totalmente vertical.
    forward = { x: point.x, y: point.y + distance }
    backward = { x: point.x, y: point.y - distance }
  } else {
    // Datos conocidos
    const hipotenusa = distance
    const anguloDeM = Math.atan(m) * (180 / Math.PI)
    // Cateto opuesto
    const opuesto = Math.sin(anguloDeM) * hipotenusa
    // Cateto adyacente
    const adyacente = Math.cos(anguloDeM) * hipotenusa
    // Cestino sumando
    forward = { x: point.x + adyacente, y: point.y + opuesto }
    // Cestino restando
    backward = { x: point.x - adyacente, y: point.y - opuesto }
  }

  return { forward, backward }
}
