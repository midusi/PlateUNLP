import type { EmpiricalSpectrumPoint } from "./EmpiricalSpectrum"
import { FITS } from "fits2js"
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
            const fits = FITS.fromBuffer(reader.result as ArrayBuffer, null)
            // This code takes the first row of the data and maps it to a JSON object
            // with the pixel and intensity values. It does it like this because there
            // are some FITS files that have more than one row of data, but taking the
            // first row is enough for now.
            const json = Array.from(fits.getData().take(fits.NAXISn[0])).map(
              ({ coordinates, value }): EmpiricalSpectrumPoint => ({ pixel: coordinates[0], intensity: value }),
            )
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
