import type { EmpiricalSpectrumPoint } from "@/components/molecules/EmpiricalSpectrum"
import { EmpiricalSpectrum } from "@/components/molecules/EmpiricalSpectrum"
import { Uploader } from "@/components/molecules/Uploader"
import { FITS } from "fits2js"
import { type ChangeEvent, useEffect, useMemo, useState } from "react"

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

    const loadedData = Array.from(fits.data.getData().take(fits.data.NAXISn[0])).map(
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
            console.error("Error parsing JSON:", error)
            setLoadingState("error")
          }
        }
      }
      reader.onerror = () => {
        console.error("Error reading file")
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
                    fits?.header.getValue("DATE-OBS")?.trim(),
                    fits?.header.getValue("TELESCOP")?.trim(),
                    fits?.header.getValue("INSTRUME")?.trim(),
                    fits?.header.getValue("OBSERVER")?.trim(),
                    fits?.header.getValue("OBJECT")?.trim(),
                    fits?.header.getValue("EQUINOX"),
                    fits?.header.getValue("EPOCH"),
                  ].filter(Boolean).join(" /// ")
                }
              </p>
            )
          : loadingState === "error"
            ? <p className="text-red-500">Error loading file</p>
            : null}
      </div>
      {loadingState === "processing" && <p>Loading content...</p>}
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
