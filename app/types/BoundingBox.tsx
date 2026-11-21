import type { BBClassesProps } from "~/types/BBClasses"

export interface BoundingBox {
  id: number | string
  name: string
  x: number
  y: number
  width: number
  height: number
  class_info: BBClassesProps
  prob: number
  // Caja orientada (OBB) que predijo el modelo: `x/y/width/height` son el
  // rectangulo alineado a los ejes que la contiene, y su tamaño propio se deriva
  // de ese rectangulo y del angulo (`boxFromExtent`).
  /** Centro de la caja orientada, sin acotar a la imagen. */
  centerX: number
  centerY: number
  /** Inclinacion en grados, sentido horario, en (-45, 45]. */
  angle: number
}
