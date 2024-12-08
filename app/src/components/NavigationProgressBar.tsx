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
            <div className="progress-bar-completed rounded-full" style={{ width: `${(value / max) * 100}%` }} />
        </div>
    )
}

export interface stepData {
    name: string
    content: JSX.Element
}

interface NavigationProgressBarProps {
    stepsArr: stepData[]
}

export function NavigationProgressBar({ stepsArr }: NavigationProgressBarProps) {
    const [progress, setProgress] = useState(1)

    const min = 0
    const max = stepsArr.length - 1

    function simulateProgress(value: number) {
        const sum = progress + value
        if (sum >= min && sum <= max)
            setProgress(sum)
    }

    return (
        <div className="w-full space-y-4">
            <ProgressBar value={progress} max={max} />
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

            <h1 className="pt-14 pb-10 text-center mt-12 mb-16 text-4xl font-bold tracking-tight lg:text-5xl">
                {stepsArr[progress].name}
            </h1>
            <div className="pt-14 pb-10">
                {stepsArr[progress].content}
            </div>

            <div className="flex justify-between mt-4">
                <Button onClick={() => simulateProgress(-1)} disabled={progress === min}>Prev</Button>
                <Button onClick={() => simulateProgress(1)} disabled={progress === max}>Next</Button>
            </div>
        </div>
    )
}
