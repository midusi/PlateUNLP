import { BBClasses } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"

/**
 * Reparte las detecciones del modelo entre el espectro de ciencia y las dos lámparas.
 *
 * - Ciencia: la detección de clase `Science` con mayor confianza. Si el modelo marca más de una,
 *   las demás pasan a competir como lámparas.
 * - Lámparas: las dos detecciones restantes con mayor confianza, ordenadas de arriba hacia abajo
 *   (`lamp1` es la de más arriba).
 *
 * @throws Si no hay una detección de ciencia o si quedan menos de dos lámparas.
 */
export function pickSpectrumRoles(boxes: BoundingBox[]): {
  science: BoundingBox
  lamp1: BoundingBox
  lamp2: BoundingBox
} {
  const byConfidence = [...boxes].sort((a, b) => b.prob - a.prob)

  const science = byConfidence.find((box) => box.class_info.id === BBClasses.Science.id)
  if (!science) {
    throw new Error("El modelo no detectó el espectro de ciencia en la observación")
  }

  const lamps = byConfidence.filter((box) => box !== science).slice(0, 2)
  if (lamps.length < 2) {
    throw new Error(
      `El modelo detectó ${boxes.length} espectro(s); se necesitan 1 de ciencia y 2 lámparas`,
    )
  }

  const [lamp1, lamp2] = lamps.sort((a, b) => a.y - b.y)
  return { science, lamp1, lamp2 }
}
