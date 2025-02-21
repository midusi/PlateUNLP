import clsx from "clsx"
import { useState } from "react"

interface NewNavigationProgressBarProps {
    general: JSX.Element[]
    perSpectrum: JSX.Element[]
}

export function NewNavigationProgressBar({ general, perSpectrum }: NewNavigationProgressBarProps) {
    const [actual, setActual] = useState(0)
    const generalSteps: JSX.Element[] = [
        <div>Step 1</div>,
        <div>Step 2</div>,

    ]
    const bridgeStep = <div>Step 3</div>
    const specificSteps: JSX.Element[] = [
        <div>Step 4</div>,
        <div>Step 5</div>,
        <div>Step 6</div>,
    ]

    return (
        <NavigationLine
            generalSteps={generalSteps}
            specificSteps={specificSteps}
            actualStep={actual}
            setActualStep={setActual}
        />
    )
}

interface NavigationLineProps {
    generalSteps: JSX.Element[]
    specificSteps: JSX.Element[]
    actualStep: number
    setActualStep: React.Dispatch<React.SetStateAction<number>>
}

function NavigationLine({ generalSteps, specificSteps, actualStep, setActualStep }: NavigationLineProps) {
    const steps = [...generalSteps, ...specificSteps]
    const slicePoint: number = generalSteps.length

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

    return (
        <div className="relative flex items-center flex-1">
            <div className="flex items-center justify-between w-full">
                {steps.map((_, index: number) => (
                    components[index]
                ))}
            </div>
            <div
                className={clsx(
                    "absolute bg-gray-50 border rounded-lg  border-dashed",
                    "-z-10 py-4",
                )}
                style={{
                    left: `${Math.round(100 * slicePoint / steps.length) + 3}%`,
                    right: `-2%`,
                }}
            >
                <span className={clsx(
                    "absolute top-0 left-10 -translate-x-1/2 -translate-y-4",
                    "text-xs font-semibold ",
                )}
                >
                    Spectrum Nº_
                </span>
            </div>
        </div>
    )
}
