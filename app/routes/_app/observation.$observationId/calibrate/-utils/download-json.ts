export function downloadJSON(data: any, fileName = "data.json") {
  // Convertir objeto a string JSON
  const jsonStr = JSON.stringify(data, null, 2) // null,2 -> indentación legible

  // Crear un blob con tipo MIME de JSON
  const blob = new Blob([jsonStr], { type: "application/json" })

  // Crear un link temporal para forzar la descarga
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()

  // Limpiar
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
