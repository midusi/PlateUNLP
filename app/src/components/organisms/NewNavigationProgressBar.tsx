import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import { useState } from "react"
import { Button } from "../atoms/button"

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

    const leftButton = (
        <Button
            className={clsx(
                "flex-shrink-0",
                "text-orange-500 bg-white shadow-none",
                "hover:text-black hover:bg-gray-200 transition active:bg-gray-400",
            )}
        // onClick={() => simulateProgress(1)}
        // disabled={disabledNext()}
        >
            <ChevronLeftIcon className="h-5 w-5" />
        </Button>
    )

    const rigthButton = (
        <Button
            className={clsx(
                "flex-shrink-0",
                "text-orange-500 bg-white shadow-none",
                "hover:text-black hover:bg-gray-200 transition active:bg-gray-400",
            )}
        // onClick={() => simulateProgress(1)}
        // disabled={disabledNext()}
        >
            <ChevronRightIcon className="h-5 w-5" />
        </Button>
    )

    return (
        <>
            <div className="flex w-full">
                <div className="w-[5%] flex items-center justify-center">
                    {leftButton}
                </div>
                <div className="w-[90%] flex items-center justify-center m-4">
                    <NavigationLine
                        generalSteps={generalSteps}
                        specificSteps={specificSteps}
                        actualStep={actual}
                        setActualStep={setActual}
                    />
                </div>
                <div className="w-[5%] flex items-center justify-center">
                    {rigthButton}
                </div>
            </div>
            <div className="flex items-center justify-center">
                {
                    [...generalSteps, bridgeStep, ...specificSteps][actual]
                }
            </div>
            <div className="flex w-full">
                <div className="w-[5%] flex items-center justify-center">
                    {leftButton}
                </div>
                <div className="w-[90%] flex items-center justify-center m-4" />
                <div className="w-[5%] flex items-center justify-center">
                    {rigthButton}
                </div>
            </div>

        </>
    )
}

interface NavigationLineProps {
    generalSteps: JSX.Element[]
    bridgeStep: JSX.Element
    specificSteps: JSX.Element[]
    actualStep: number
    setActualStep: React.Dispatch<React.SetStateAction<number>>
}

function NavigationLine({ generalSteps, bridgeStep, specificSteps, actualStep, setActualStep }: NavigationLineProps) {
    const steps = [...generalSteps, bridgeStep, ...specificSteps]
    const slicePoint: number = generalSteps.length + 1

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
                    "absolute bg-gray-50 border rounded-lg  border-dashed border-gray-200",
                    "-z-10 py-4",
                )}
                style={{
                    left: `${Math.round(100 * slicePoint / steps.length) + 8}%`,
                    right: `-1%`,
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
