import { useGlobalStore } from "../hooks/use-global-store"
import { Button } from "./ui/button"

export function ContinueButton() {
    const [lampPoints, materialPoints] = useGlobalStore(s => [
        s.lampPoints,
        s.materialPoints,
    ])

    const matches: {
        lamp: { x: number, y: number }
        material: { x: number, y: number }
    }[] = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
        matches.push({ lamp: lampPoints[i], material: materialPoints[i] })
    }

    function onClick() {
        const data = { matches }
        const json = JSON.stringify(data, null, 2)
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
                disabled={matches.length < 1}
                onClick={onClick}
            >
                Continue
            </Button>
        </div>
    )
}
