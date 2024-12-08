import { useState } from "react"
import { Button } from "./ui/button"
import "./css/ProgressBar.css"

interface ProgressBarProps {
    label: string
    value: number
    max: number
}

function ProgressBar({ label, value, max }: ProgressBarProps) {
    const label_formated = `${label} (${value}/${max})`
    return (
        <div className="progress-bar" aria-labelledby="progress-bar-label">
            <span id="progress-bar-label" className="block mb-2 text-center">
                {label_formated}
            </span>
            <div className="progress-bar-completed rounded-full" style={{ width: `${(value / max) * 100}%` }} />
        </div>
    )
}

interface stepData {
    name: string
    content: JSX.Element
}

export function NavigationProgressBar() {
    const stepsArr: stepData[] = [
        { name: "Begin", content: <>BEGIN</> },
        { name: "Digitization", content: <>1</> },
        { name: "Spectrum segmentation", content: <>2</> },
        { name: "Feature extraction", content: <>3</> },
        { name: "Calibration", content: <>4</> },
        { name: "Completed", content: <>FIN</> },
    ]

    const min = 0
    const max = stepsArr.length - 1

    const [progress, setProgress] = useState(1)

    function simulateProgress(value: number) {
        const sum = progress + value
        if (sum >= min && sum <= max)
            setProgress(sum)
    }

    return (
        <div className="w-full space-y-4">
            <ProgressBar label={stepsArr[progress].name} value={progress} max={max} />
            <div className="relative w-full">
                <div className="absolute top-[-12px] left-0 w-full flex justify-between">
                    {stepsArr.map((step, index) => (
                        <div
                            key={step.name}
                            className={`flex items-center justify-center w-6 h-6 rounded-full ${index <= progress ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                                }`}
                        >
                            {index}
                        </div>
                    ))}
                </div>
            </div>
            <div className="pt-14 pb-10 text-center">
                {stepsArr[progress].content}
            </div>

            <div className="flex justify-between mt-4">
                <Button onClick={() => simulateProgress(-1)} disabled={progress === min}>Prev</Button>
                <Button onClick={() => simulateProgress(1)} disabled={progress === max}>Next</Button>
            </div>
        </div>
    )
}
