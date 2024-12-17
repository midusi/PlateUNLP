import type { EmpiricalSpectrumPoint } from "./EmpiricalSpectrum"
import { Input } from "@/components/ui/input"
import { FITS } from "fits2js"
import { type ChangeEvent, useEffect, useMemo, useState } from "react"
import { EmpiricalSpectrum } from "./EmpiricalSpectrum"
import { Uploader } from "./Uploader"

type LoadingState = "waiting" | "processing" | "finished" | "error"

interface FitsLoaderProps {
  plotColor: string
  setData: React.Dispatch<React.SetStateAction<EmpiricalSpectrumPoint[] | null>>
  interactable: boolean
  preview: boolean
}

export function FitsLoader({ plotColor, setData, interactable = true, preview = true }: FitsLoaderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("waiting")
  const [fits, setFits] = useState<FITS | null>(null)

  const loadedData = useMemo((): EmpiricalSpectrumPoint[] | null => {
    if (!fits) {
      return null
    }

    // This code takes the first row of the data and maps it to a JSON object
    // with the pixel and intensity values. It does it like this because there
    // are some FITS files that have more than one row of data, but taking the
    // first row is enough for now.
    const loadedData = Array.from(fits.getData().take(fits.NAXISn[0])).map(
      ({ coordinates, value }) => ({ pixel: coordinates[0], intensity: value }),
    )
    return loadedData
  }, [fits])

  useEffect(() => {
    if (loadedData) {
      setData(loadedData)
    }
  }, [loadedData, setData])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0]
      setLoadingState("processing")
      const reader = new FileReader()
      reader.readAsArrayBuffer(file)
      reader.onload = () => {
        if (reader.result) {
          try {
            const result = FITS.fromBuffer(reader.result as ArrayBuffer, null)
            setFits(result)
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
    <div className="flex flex-col flex-1 h-full my-2">
      <div className="flex-1 flex h-full">
        {!loadedData && (
          <Uploader accept=".fit,.fits" onChange={handleFileChange} showInfoDeleteRow={false} />
        )}
        {loadingState === "finished"
          ? (
            <p className="ml-4">
              {
                [
                  fits?.getHeader("DATE-OBS")?.trim(),
                  fits?.getHeader("TELESCOP")?.trim(),
                  fits?.getHeader("INSTRUME")?.trim(),
                  fits?.getHeader("OBSERVER")?.trim(),
                  fits?.getHeader("OBJECT")?.trim(),
                  fits?.getHeader("EQUINOX"),
                  fits?.getHeader("EPOCH"),
                ].filter(Boolean).join(" /// ")
              }
            </p>
          )
          : loadingState === "error"
            ? <p className="text-red-500">Error al cargar el archivo</p>
            : null}
      </div>
      {loadingState === "processing" && <p>Cargando contenido...</p>}
      {loadedData
        && (
          <EmpiricalSpectrum
            data={loadedData}
            color={plotColor}
            interactable={interactable}
            preview={preview}
          />
        )}
    </div>
  )
}
