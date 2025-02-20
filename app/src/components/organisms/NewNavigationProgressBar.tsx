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
        <NavigationlineWithBox
            steps={steps}
            actualStep={actual}
            setActualStep={setActual}
        />
    )
}

interface NavigationlineWithBoxProps {
    steps: JSX.Element[]
    actualStep: number
    setActualStep: React.Dispatch<React.SetStateAction<number>>
}

function NavigationlineWithBox({ steps, actualStep, setActualStep }: NavigationlineWithBoxProps) {
    const groups = [
        steps.slice(0, 4),
        steps.slice(4),
    ]
    const percents = groups.map(group => Math.round(100 * group.length / steps.length))

    return (
        <>
            <div className="flex items-center w-full">
                <div
                    className="flex items-center justify-between border rounded-lg px-4 py-2 bg-gray-100"
                    style={{ flexBasis: `${percents[0]}%` }}
                >
                    <NavigationLine steps={groups[0]} actualStep={0} setActualStep={setActualStep} />
                </div>
                <div
                    className="flex items-center justify-between border rounded-lg px-4 py-2 bg-gray-100"
                    style={{ flexBasis: `${percents[1]}%` }}
                >
                    <NavigationLine steps={groups[1]} actualStep={0} setActualStep={setActualStep} />
                </div>
            </div>
        </>
    )
}

interface NavigationLineProps {
    steps: JSX.Element[]
    actualStep: number
    setActualStep: React.Dispatch<React.SetStateAction<number>>
}

function NavigationLine({ steps, actualStep, setActualStep }: NavigationLineProps) {
    return (
        <div className="flex items-center justify-between w-full">
            {steps.map((_: JSX.Element, index: number) => (
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
            ))}
        </div>
    )
}
