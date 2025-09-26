export async function parseLampFile(
  file: File,
): Promise<{ wavelength: number; material: string; intensity: number }[]> {
  const text = await file.text()
  const lines = text.split(/\r?\n/)

  const data = lines
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#")) // ignorar comentarios y líneas vacías
    .map((line) => {
      const parts = line.split(/\s+/)
      const wavelength = parseFloat(parts[0])
      let intensity = 0
      let material = ""

      if (parts.length === 2) {
        // solo hay wavelength e intensidad
        intensity = parseFloat(parts[1])
        material = "-" // vacío porque no hay material
      } else if (parts.length >= 3) {
        intensity = parseFloat(parts[2])
        material = parts[1] // segunda columna
      }

      return {
        wavelength,
        material,
        intensity,
      }
    })
    .filter((d) => !Number.isNaN(d.wavelength) && !Number.isNaN(d.intensity))

  return data
}
