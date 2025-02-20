import { group } from "node:console"
import clsx from "clsx"
import { useState } from "react"

interface NewNavigationProgressBarProps {
    general: JSX.Element[]
    perSpectrum: JSX.Element[]
}

export function NewNavigationProgressBar({ general, perSpectrum }: NewNavigationProgressBarProps) {
    const [actual, setActual] = useState(0)
    const steps: JSX.Element[] = [
        <div>Step 1</div>,
        <div>Step 2</div>,
        <div>Step 3</div>,
        <div>Step 4</div>,
        <div>Step 5</div>,
        <div>Step 6</div>,
    ]

    return (
        <NavigationLine
            steps={steps}
            actualStep={actual}
            setActualStep={setActual}
        />
    )
}

interface NavigationLineProps {
    steps: JSX.Element[]
    actualStep: number
    setActualStep: React.Dispatch<React.SetStateAction<number>>
}

function NavigationLine({ steps, actualStep, setActualStep }: NavigationLineProps) {
    const components = steps.map((_, index) => (
        <div key={index} className="flex items-center w-full last:w-auto">
            <span
                className={clsx(
                    "rounded-full",
                    index < actualStep ? "bg-blue-500" : "bg-gray-500",
                    index === actualStep ? "w-5 h-5" : "w-4 h-4",
                    "cursor-pointer active:scale-90 active:bg-blue-700",
                )}
                onClick={_ => setActualStep(index)}
            />
            {index < steps.length - 1 && (
                <div className={clsx(
                    "h-1 flex-1",
                    index < actualStep ? "bg-blue-500" : "bg-gray-500",
                )}
                />
            )}
        </div>
    ))

    const slicePoint: number = 2
    return (
        <div className="relative flex items-center flex-1">
            <div className="flex items-center justify-between w-full">
                {steps.map((step: JSX.Element, index: number) => (
                    components[index]
                ))}
            </div>
            <div
                className="absolute bg-gray-100 border rounded-lg -z-10 px-4 py-4"
                style={{
                    left: `${Math.round(100 * slicePoint / steps.length)}%`,
                    right: 0,
                }}
            />
        </div>
    )
}
