import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import { useState } from "react"
import { Tooltip } from "react-tooltip"
import { Button } from "../atoms/button"
import { StepSpectrumSelection } from "../pages/StepSpectrumSelection"

interface NewNavigationProgressBarProps {
    general: JSX.Element[]
    perSpectrum: JSX.Element[]
}

export interface StepData {
    id: string
    content: JSX.Element
    complete: boolean
    enable: boolean
}

export function NewNavigationProgressBar({ general, perSpectrum }: NewNavigationProgressBarProps) {
    const [actual, setActual] = useState(0)
    const [specificObject, setSpecificObject] = useState<string | null>(null)
    const generalSteps: StepData[] = [
        { id: "Begin", content: <div key="1">Step 1</div>, complete: true, enable: true },
        { id: "Plate Metadata", content: <div key="2">Step 2</div>, complete: true, enable: true },
        { id: "Plate Segmentation", content: <div key="3">Step 3</div>, complete: true, enable: true },
    ]
    const bridgeStep = {
        id: "Spectrum Selection",
        content: <StepSpectrumSelection setSpecificObject={setSpecificObject} />,
        complete: false,
        enable: true,
    }
    const specificSteps: StepData[] = [
        { id: "Spectrum Segmentation", content: <div key="5">Step 5</div>, complete: false, enable: false },
        { id: "Spectrum Metadata", content: <div key="6">Step 6</div>, complete: false, enable: false },
        { id: "Feature Extraction", content: <div key="7">Step 7</div>, complete: false, enable: false },
        { id: "Calibration", content: <div key="8">Step 8</div>, complete: false, enable: false },
        { id: "Complete", content: <div key="9">Step 9</div>, complete: false, enable: false },
    ]
    const steps = [...generalSteps, bridgeStep, ...specificSteps]

    const leftButton = (
        <Button
            className={clsx(
                "flex-shrink-0",
                "text-orange-500 bg-white shadow-none",
                "hover:text-black hover:bg-gray-200 transition active:bg-gray-400",
                "disabled:text-white",
            )}
            onClick={() => setActual(actual - 1)}
            disabled={actual === 0}
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
                "disabled:text-white",
            )}
            onClick={() => setActual(actual + 1)}
            disabled={((specificObject === null) && (actual === generalSteps.length)) || (actual === steps.length)}
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
                        bridgeStep={bridgeStep}
                        specificSteps={specificSteps}
                        actualStep={actual}
                        setActualStep={setActual}
                        specificObject={specificObject}
                    />
                </div>
                <div className="w-[5%] flex items-center justify-center">
                    {rigthButton}
                </div>
            </div>
            <div className="flex items-center justify-center">
                {steps[actual].content}
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
    generalSteps: StepData[]
    bridgeStep: StepData
    specificSteps: StepData[]
    actualStep: number
    setActualStep: React.Dispatch<React.SetStateAction<number>>
    specificObject: string | null
}

function NavigationLine({ generalSteps, bridgeStep, specificSteps, actualStep, setActualStep, specificObject }: NavigationLineProps) {
    const steps = [...generalSteps, bridgeStep, ...specificSteps]
    const slicePoint: number = generalSteps.length + 1

    const components = steps.map((step, index) => (
        <div key={step.id} className="flex items-center w-full last:w-auto">
            <span
                className={clsx(
                    "rounded-full",
                    index <= actualStep ? "bg-blue-500" : "bg-gray-500",
                    index === actualStep ? "w-5 h-5" : "w-4 h-4",
                    ((specificObject !== null) || (index < slicePoint))
                    && "cursor-pointer active:scale-90 active:bg-blue-700",
                    "relative flex items-center justify-center",
                )}
                onClick={(_) => {
                    ((specificObject !== null) || (index < slicePoint))
                        && setActualStep(index)
                }}
                data-tooltip-id={`step-${step.id}-2tooltip`}
            >
                {step.enable && (
                    <span
                        className={clsx(
                            "rounded-full",
                            step.complete
                                ? "bg-green-400 active:bg-green-700"
                                : "bg-yellow-400 active:bg-yellow-500",
                            index === actualStep ? "w-3 h-3" : "w-2 h-2",
                            ((specificObject !== null) || (index < slicePoint))
                            && "cursor-pointer active:scale-90",
                        )}
                    />
                )}
            </span>
            <Tooltip
                id={`step-${step.id}-2tooltip`}
                place="top"
                delayShow={300}
                content={step.id}
            />
            {index < steps.length - 1 && (
                <div className="relative flex-1 h-1">
                    <div className="absolute inset-0 h-full bg-gray-500" />
                    <div
                        className={clsx(
                            "absolute inset-0 h-full",
                            "transition-all duration-500",
                            "bg-blue-500"
                        )}
                        style={{ width: index < actualStep ? "100%" : "0%" }}
                    />
                </div>

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
                    "pb-4 pt-4",
                    specificObject ? "-z-10 border-yellow-300" : "-z-1 border-red-500 bg-opacity-90",
                )}
                style={{
                    left: `${Math.round(100 * slicePoint / steps.length)}%`,
                    right: `-1%`,
                }}
            >
                <span className={clsx(
                    "absolute top-0 left-1 text-left -translate-y-4",
                    "text-xs font-semibold ",
                    specificObject ? "text-black" : "text-gray-200",
                )}
                >
                    {specificObject}
                </span>
            </div>
        </div>
    )
}
