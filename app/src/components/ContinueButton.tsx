import { CustomError } from "@/lib/utils"
import { useGlobalStore } from "../hooks/use-global-store"
import { Button } from "./ui/button"

export interface Point {
    x: number
    y: number
}

interface EmpiricalSpectrumPoint {
    pixel: number
    intensity: number
}

interface ContinueButtonProps {
    data: EmpiricalSpectrumPoint[] | null
}

export function ContinueButton({ data }: ContinueButtonProps) {
    const [lampPoints, materialPoints, pixelToWavelengthFunction] = useGlobalStore(s => [
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
    }

    return (
        <div className="flex justify-center">
            <Button
                disabled={pixelToWavelengthFunction instanceof CustomError}
                onClick={onClick}
            >
                Continue
            </Button>
        </div>
    )
}
