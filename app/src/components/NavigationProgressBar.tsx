import { useState } from "react"
import { Button } from "./ui/button"
import "./css/ProgressBar.css"

interface ProgressBarProps {
    label: string
    value: number
    max: number
}

function ProgressBar({ label, value, max }: ProgressBarProps) {
    return (
        <div className="progress-bar" aria-labelledby="progress-bar-label">
            <span id="progress-bar-label">
                {label}
                :
                {" "}
                {value}
                %
            </span>
            <div className="progress-bar-completed" style={{ width: `${(value / max) * 100}%` }}>
            </div>
        </div>
    )
}

interface stepData {
    name: string
    content: JSX.Element
}

export function NavigationProgressBar() {
    const steptsArr: stepData[] = [
        { name: "Begin", content: <>BEGIN</> },
        { name: "Digitization", content: <>1</> },
        { name: "Spectrum segmentation", content: <>2</> },
        { name: "Feature extraction", content: <>3</> },
        { name: "Calibration", content: <>4</> },
        { name: "Completed", content: <>FIN</> },
    ]

    const min = 0
    const max = steptsArr.length - 1

    const [progress, setProgress] = useState(1)

    function simulateProgress(value: number) {
        const sum = progress + value
        if (sum >= min && sum <= max)
            setProgress(sum)
    }

    return (
        <>
            <ProgressBar label={steptsArr[progress].name} value={progress} max={max} />
            {steptsArr[progress].content}
            <div className="flex justify-between mt-4">
                <Button onClick={() => simulateProgress(-1)}>Prev</Button>
                <Button onClick={() => simulateProgress(1)}>Next</Button>
            </div>
        </>
    )
}
