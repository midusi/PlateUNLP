import type { EmpiricalSpectrumPoint } from "./EmpiricalSpectrum"
import { parseFITS } from "fits2js"
import { type ChangeEvent, useState } from "react"
import { EmpiricalSpectrum } from "./EmpiricalSpectrum"

type LoadingState = "waiting" | "processing" | "finished" | "error"

export function FitsLoader({ plotColor }: { plotColor: string }) {
  const [loadingState, setLoadingState] = useState<LoadingState>("waiting")
  const [loadedData, setLoadedData] = useState<EmpiricalSpectrumPoint[] | null>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const file = event.target.files[0]
      setLoadingState("processing")
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = () => {
        if (reader.result) {
          try {
            let json: EmpiricalSpectrumPoint[]
            if (file.name.startsWith("WCOMP")) {
              const fits = parseFITS(reader.result as ArrayBuffer, 1)
              json = fits.data.map(
                (value, i): EmpiricalSpectrumPoint => ({ pixel: i, intensity: value }),
              )
            }
            else { // WOBJ y otros nombres
              const fits = parseFITS(reader.result as ArrayBuffer, 3)
              json = fits.data[0][0].map( // Hay 4 indices en [x][0], en este caso elegimos x=0
                (value, i): EmpiricalSpectrumPoint => ({ pixel: i, intensity: value }),
              )
            }
            setLoadedData(json)
            setLoadingState("finished")
          }
          catch (error) {
            console.error("Error al parsear el JSON:", error)
            setLoadingState("error")
          }
        }
      }
      reader.onerror = () => {
        console.error("Error al leer el archivo")
        setLoadingState("error")
      }
    }
  }

  return (
    <>
      {loadingState !== "finished" && (
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          accept=".fit,.fits"
        />
      )}
      {loadingState === "processing" && <p>Cargando contenido...</p>}
      {loadedData && <EmpiricalSpectrum data={loadedData} color={plotColor} />}
    </>
  )
}
