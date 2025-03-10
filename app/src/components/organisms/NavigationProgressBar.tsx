import { Button } from "@/components/atoms/button"
import { useGlobalStore } from "@/hooks/use-global-store"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import "@/css/ProgressBar.css"

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
    initialStep: number
}

export function NavigationProgressBar({ stepsArr, initialStep }: NavigationProgressBarProps) {
    const [progress, setProgress] = useState(initialStep)
    const [completedStages] = useGlobalStore(s => [
        s.completedStages,
    ])

    const min = 0
    const max = stepsArr.length - 1

    function simulateProgress(value: number) {
        const sum = progress + value
        if (sum >= min && sum <= max)
            setProgress(sum)
    }

    function disabledPrev(): boolean {
        return (progress === min)
    }

    function disabledNext(): boolean {
        return (progress === max || progress > completedStages)
    }

    function disabledItem(index: number): boolean {
        return index > (completedStages + 1)
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center w-full mt-4">
                <Button
                    className="flex-shrink-0"
                    onClick={() => simulateProgress(-1)}
                    disabled={disabledPrev()}
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </Button>
                <div className="relative flex-grow mx-2">
                    <ProgressBar value={progress} max={max} />
                    <div className="absolute top-1/2 left-0 w-full flex justify-between transform -translate-y-1/2">
                        {stepsArr.map((step, index) => (
                            <div
                                key={step.name}
                                onClick={() => {
                                    if (!disabledItem(index)) {
                                        setProgress(index)
                                    }
                                }}
                                aria-disabled={disabledItem(index)}
                                className={
                                    `flex items-center justify-center p-2 rounded-lg 
                                ${progress === index
                                        ? "border border-black"
                                        : "border border-gray-300"
                                    }
                                ${index <= progress
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-300 text-black"
                                    }
                                ${disabledItem(index) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`
                                }
                                style={{
                                    position: "relative",
                                    top: "-50%",
                                }}
                            >
                                {step.name}
                            </div>
                        ))}
                    </div>
                </div>
                <Button
                    className="flex-shrink-0"
                    onClick={() => simulateProgress(1)}
                    disabled={disabledNext()}
                >
                    <ChevronRightIcon className="h-5 w-5" />
                </Button>
            </div>

            <div className="pt-8 pb-6">
                {stepsArr[progress].content}
            </div>

            <div className="flex justify-between">
                <Button onClick={() => simulateProgress(-1)} disabled={disabledPrev()}>
                    <ChevronLeftIcon className="h-5 w-5" />
                </Button>
                <Button onClick={() => simulateProgress(1)} disabled={disabledNext()}>
                    <ChevronRightIcon className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
