import { useState } from "react"
import { Button } from "./ui/button"
import "./css/ProgressBar.css"

interface ProgressBarProps {
    value: number
    max: number
}

function ProgressBar({ value, max }: ProgressBarProps) {
    return (
        <div className="progress-bar" aria-labelledby="progress-bar-label">
            <div className="progress-bar-completed" style={{ width: `${(value / max) * 100}%` }}>
            </div>
        </div>
    )
}

export function NavigationProgressBar() {
    const [progress, setProgress] = useState(10)

    function simulateDeprogress() {
        setProgress(progress - 10)
    }

    function simulateProgress() {
        setProgress(progress + 10)
    }
    return (
        <>
            <ProgressBar value={progress} max={100} />
            <div className="flex justify-between mt-4">
                <Button onClick={simulateDeprogress}>Decrease Progress</Button>
                <Button onClick={simulateProgress}>Increase Progress</Button>
            </div>
        </>
    )
}
