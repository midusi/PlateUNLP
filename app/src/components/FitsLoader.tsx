import { parseFITS } from "fits2js"
import { type ChangeEvent, useState } from "react"
import Json1DPlot from "./Json1DPlot"

const LoadingStates = {
  WAITING: 0,
  INPROCCES: 1,
  FINISHED: 2,
  ERROR: 3,
}

export default function FitsLoader() {
  const [loadingState, setLoadingState] = useState(LoadingStates.WAITING)
  const [fileContent, setFileContent] = useState<any | null>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const file = event.target.files[0]
      setLoadingState(LoadingStates.INPROCCES)
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = () => {
        if (reader.result) {
          try {
            const fits = parseFITS(reader.result as ArrayBuffer, 1)
            const json = fits.data.map((value, i) => ({ pixel: i, intensity: value }))
            setFileContent(json)
            setLoadingState(LoadingStates.FINISHED)
          }
          catch (error) {
            console.error("Error al parsear el JSON:", error)
            setLoadingState(LoadingStates.ERROR)
          }
        }
      }
      reader.onerror = () => {
        console.error("Error al leer el archivo")
        setLoadingState(LoadingStates.ERROR)
      }
    }
  }

  return (
    <>
      {loadingState !== LoadingStates.FINISHED
      && (
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          accept=".fit,.fits"
        />
      )}
      {loadingState === LoadingStates.INPROCCES
      && <p>Cargando contenido...</p>}
      {fileContent
      && <Json1DPlot data={fileContent} />}
    </>
  )
}
