import type { Point } from "@/interfaces/Point"

/**
 * Funcion que dado un punto, una pendiente y una distancia devuelve los puntos
 * que corresponden siguiedo la pendiente a la distancia indicada.
 * @param {Point} point - Punto medio desde el que hacer las cuentas.
 * @param {number} m - Pendiente
 * @param {number} distance - Distancia entre el punto medio y los puntos buscados
 * @returns { forward: Point, backward: Point } -
 * Puntos recorriendo la distancia hacia delante y hacia atrás
 */
export function extremePoints(point: Point, m: number, distance: number): { forward: Point, backward: Point } {
  // Datos conocidos
  const hipotenusa = distance
  const anguloDeM = Math.atan(m) * (180 / Math.PI)
  // Cateto opuesto
  const opuesto = Math.sin(anguloDeM) * hipotenusa
  // Cateto adyacente
  const adyacente = Math.cos(anguloDeM) * hipotenusa
  // Cestino sumando
  const forward = { x: point.x + adyacente, y: point.y + opuesto }
  // Cestino restando
  const backward = { x: point.x - adyacente, y: point.y - opuesto }

  return { forward, backward }
}
