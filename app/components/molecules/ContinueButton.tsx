import { Button } from "~/components/atoms/button"
import { useGlobalStore } from "~/hooks/use-global-store"
import { CustomError } from "~/lib/utils"

export interface Point {
  x: number
  y: number
}

interface EmpiricalSpectrumPoint {
  pixel: number
  intensity: number
}

interface ContinueButtonProps {
  className: string
  data: EmpiricalSpectrumPoint[] | null
  inSuccessfulCase: () => void
}

function defaultBehavior() {}

export function ContinueButton({
  className,
  data,
  inSuccessfulCase = defaultBehavior,
}: ContinueButtonProps) {
  const [lampPoints, materialPoints, pixelToWavelengthFunction] = useGlobalStore((s) => [
    s.lampPoints,
    s.materialPoints,
    s.pixelToWavelengthFunction,
  ])

  const matches: {
    lamp: Point
    material: Point
  }[] = []
  const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
  for (let i = 0; i < smallArr.length; i++) {
    matches.push({ lamp: lampPoints[i], material: materialPoints[i] })
  }

  function onClick() {
    if (!data) {
      throw new Error("No estan cargados los datos del espectro de ciencia")
    }
    if (pixelToWavelengthFunction instanceof CustomError) {
      throw pixelToWavelengthFunction
    }
    const regressionedData = data.map(({ pixel, intensity }) => ({
      x: pixelToWavelengthFunction(pixel),
      y: intensity,
    }))
    const json = JSON.stringify({ regressionedData }, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "calibratedLamp.json"
    link.click()
    URL.revokeObjectURL(url) // Libera el objeto URL después de la descarga

    inSuccessfulCase()
  }

  return (
    <div className={className}>
      <Button disabled={pixelToWavelengthFunction instanceof CustomError} onClick={onClick}>
        Export
      </Button>
    </div>
  )
}
