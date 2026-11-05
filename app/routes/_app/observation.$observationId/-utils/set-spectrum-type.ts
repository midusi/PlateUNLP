export type SpectrumType = "lamp" | "science"

/**
 * Cambia el tipo de un espectro conservando la regla de que hay un unico
 * espectro de ciencia: al marcar uno como `science`, todos los demas pasan a
 * ser `lamp`.
 * @returns Nuevo arreglo, sin modificar el recibido.
 */
export function setSpectrumType<T extends { id: string; type: SpectrumType }>(
  spectrums: T[],
  id: string,
  type: SpectrumType,
): T[] {
  if (type === "lamp") {
    return spectrums.map((s) => (s.id === id ? { ...s, type } : s))
  }
  return spectrums.map((s) => ({ ...s, type: s.id === id ? "science" : "lamp" }))
}
