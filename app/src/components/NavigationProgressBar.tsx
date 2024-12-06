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
    const min = 0
    const max = 100

    const [progress, setProgress] = useState(10)

    function simulateProgress(value: number) {
        const sum = progress + value
        if (sum >= min && sum <= max)
            setProgress(sum)
    }
    return (
        <>
            <ProgressBar value={progress} max={max} />
            <div className="flex justify-between mt-4">
                <Button onClick={() => simulateProgress(-10)}>Decrease Progress</Button>
                <Button onClick={() => simulateProgress(10)}>Increase Progress</Button>
            </div>
        </>
    )
}
