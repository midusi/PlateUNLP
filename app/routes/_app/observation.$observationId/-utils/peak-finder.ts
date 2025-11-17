export function peakFinder(
  data: {
    wavelength: number
    intensity: number
  }[],
  xVal: number,
  deltaPercent: number = 0.01,
): {
  wavelength: number
  intensity: number
} {
  /** Separar un subset del 10% del tamaño de la funcion */
  const minW = data[0].wavelength
  const maxW = data[data.length - 1].wavelength
  const range = maxW - minW
  const delta = range * deltaPercent
  console.log(`Delta ${delta}`)
  const window = data.filter((p) => Math.abs(p.wavelength - xVal) < delta)

  if (window.length === 0) {
    console.log("Solo hay un pico en las proximidades no hay necesidad de ajustar en busca de otro")
    return {
      wavelength: xVal,
      intensity: 0,
    }
  }

  const peak = window.reduce((max, p) => (p.intensity > max.intensity ? p : max))

  return peak
}
