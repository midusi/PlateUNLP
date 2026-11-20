import { z } from "zod"

/**
 * Campos de la caja orientada (OBB) que viajan junto al rectángulo envolvente
 * `imageLeft/Top/Width/Height`. Ver `~/lib/oriented-box`.
 *
 * Es opcional: sin ellos la caja es el propio rectángulo (ángulo 0).
 */
export const orientedBoxFields = {
  /** Inclinación en grados, sentido horario, en (-45, 45]. */
  imageAngle: z.number().gt(-45).lte(45).optional(),
}
