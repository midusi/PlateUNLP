export async function parseLampFile(
  file: File,
): Promise<{ wavelength: number; material: string; intensity: number }[]> {
  const text = await file.text()
  const lines = text.split(/\r?\n/)

  const data = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#")) // ignorar comentarios y líneas vacías
    // Primero parsear las líneas en tokens para decidir el orden de columnas
    .map((line) => line.split(/\s+/))

  // Determinar orden de columnas (wavelength vs intensity)
  const sampleRows = data.slice(0, 50)
  const numericPairs: Array<[number | null, number | null]> = []

  for (const parts of sampleRows) {
    const nums = parts.map((p) => {
      const v = parseFloat(p)
      return Number.isNaN(v) ? null : v
    })
    // tomar los dos primeros números si existen
    const found = nums.filter((n) => n !== null) as number[]
    if (found.length >= 2) numericPairs.push([found[0], found[1]])
  }

  function scoreColumn(colIndex: 0 | 1) {
    const vals = numericPairs.map((p) => (colIndex === 0 ? p[0] : p[1])).filter((v) => v !== null) as number[]
    if (vals.length === 0) return -Infinity
    const unique = new Set(vals.map((v) => v.toFixed(4))).size
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min
    const fracAvg = vals.reduce((s, v) => s + Math.abs(v - Math.round(v)), 0) / vals.length
    const median = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)]

    let score = 0
    if (fracAvg > 0.1) score += 2 // likely wavelengths have decimals
    if (range > 100) score += 1
    if (unique > vals.length * 0.6) score += 1
    if (median >= 100 && median <= 30000) score += 1
    if (median < 50) score -= 1
    return score
  }

  const score0 = scoreColumn(0)
  const score1 = scoreColumn(1)

  const firstIsWavelength = score0 >= score1

  const parsedData = data
    .map((parts) => {
      const tokens = parts
      const nums = tokens.map((t) => {
        const v = parseFloat(t)
        return Number.isNaN(v) ? null : v
      })

      let wavelength = NaN
      let intensity = NaN
      let material = "-"

      // si hay header explícito en la línea de tokens
      const lowerTokens = tokens.map((t) => t.toLowerCase())
      if (lowerTokens.includes("wavelength") || lowerTokens.includes("intensity")) {
        // asignar por posición de las palabras
        const wIdx = lowerTokens.indexOf("wavelength")
        const iIdx = lowerTokens.indexOf("intensity")
        if (wIdx !== -1 && tokens[wIdx + 1]) {
          const w = parseFloat(tokens[wIdx + 1])
          if (!Number.isNaN(w)) wavelength = w
        }
        if (iIdx !== -1 && tokens[iIdx + 1]) {
          const it = parseFloat(tokens[iIdx + 1])
          if (!Number.isNaN(it)) intensity = it
        }
      }

      // Si no se asignó por header, usar heurística por columnas
      if (Number.isNaN(wavelength) || Number.isNaN(intensity)) {
        const a = nums[0]
        const b = nums[1]
        if (a !== null && b !== null) {
          if (firstIsWavelength) {
            wavelength = a
            intensity = b
          } else {
            wavelength = b
            intensity = a
          }
        } else if (a !== null) {
          // si solo hay un número, adivinar por rango
          if (a > 1000) wavelength = a
          else intensity = a
        }

        // material: primer token no numérico
        const mat = tokens.find((t) => Number.isNaN(parseFloat(t)))
        if (mat) material = mat
      }

      return { wavelength, material, intensity }
    })
    .filter((d) => !Number.isNaN(d.wavelength) && !Number.isNaN(d.intensity))

  return parsedData

  return data
}
