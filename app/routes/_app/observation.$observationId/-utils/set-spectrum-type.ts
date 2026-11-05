export type SpectrumType = "lamp" | "science"

/**
 * Cambia el tipo de un espectro conservando la regla de que hay un unico
 * espectro de ciencia: al marcar uno como `science`, todos los demas pasan a
 * ser `lamp`. El grado de la traza solo cuenta en el de ciencia (las lamparas
 * reusan su traza), asi que el nuevo espectro de ciencia hereda el del anterior.
 * @returns Nuevo arreglo, sin modificar el recibido.
 */
export function setSpectrumType<T extends { id: string; type: SpectrumType; fitDegree: number }>(
  spectrums: T[],
  id: string,
  type: SpectrumType,
): T[] {
  if (type === "lamp") {
    return spectrums.map((s) => (s.id === id ? { ...s, type } : s))
  }
  const previous = spectrums.find((s) => s.type === "science" && s.id !== id)
  return spectrums.map((s) =>
    s.id === id
      ? { ...s, type: "science", fitDegree: previous?.fitDegree ?? s.fitDegree }
      : { ...s, type: "lamp" },
  )
}
