import type { ProcessInfoForm } from "@/interfaces/ProcessInfoForm"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import { useState } from "react"
import { Tooltip } from "react-tooltip"
import { Button } from "../atoms/button"
import { StepSpectrumSelection } from "../pages/StepSpectrumSelection"

interface NewNavigationProgressBarProps {
    general: StepData[]
    perSpectrum: StepData[]
    processInfo: ProcessInfoForm
}

export interface StepData {
    id: string
    content: JSX.Element
    state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
}

export function NewNavigationProgressBar({ general, perSpectrum, processInfo }: NewNavigationProgressBarProps) {
    const [actual, setActual] = useState(0)
    const [specificObject, setSpecificObject] = useState<string | null>(null)

    const bridgeStep: StepData = {
        id: "Spectrum Selection",
        content: <StepSpectrumSelection setSpecificObject={setSpecificObject} />,
        state: "NECESSARY_CHANGES",
    }
    const steps = [...general, bridgeStep, ...perSpectrum]

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
            disabled={((specificObject === null) && (actual === general.length)) || (actual === steps.length)}
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
                        generalSteps={general}
                        bridgeStep={bridgeStep}
                        specificSteps={perSpectrum}
                        actualStep={actual}
                        setActualStep={setActual}
                        specificObject={specificObject}
                        processInfo={processInfo}
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
    processInfo: ProcessInfoForm
}

function NavigationLine({
    generalSteps,
    bridgeStep,
    specificSteps,
    actualStep,
    setActualStep,
    specificObject,
    processInfo,
}: NavigationLineProps) {
    const steps = [...generalSteps, bridgeStep, ...specificSteps]
    const slicePoint: number = generalSteps.length + 1

    const components = steps.map((step, index) => (
        <div key={step.id} className="flex items-center w-full last:w-auto">
            <span
                className={clsx(
                    "rounded-full",
                    index <= actualStep ? "bg-blue-500" : "bg-gray-500",
                    index === actualStep ? "w-5 h-5" : "w-4 h-4",
                    ((processInfo.perSpectrum !== null) || (index < slicePoint))
                    && "cursor-pointer active:scale-90 active:bg-blue-700",
                    "relative flex items-center justify-center",
                )}
                onClick={(_) => {
                    ((processInfo.perSpectrum !== null) || (index < slicePoint))
                        && setActualStep(index)
                }}
                data-tooltip-id={`step-${step.id}-2tooltip`}
            >
                {
                    (
                        (index < slicePoint
                            && processInfo.general[index].state !== "NOT_REACHED") // es general
                        || (index >= slicePoint
                            && processInfo.perSpectrum !== null
                            && processInfo.perSpectrum[index - slicePoint][0].state !== "NOT_REACHED")) // es un paso especifico
                    && (
                        <span
                            className={clsx(
                                "absolute top-0 right-0 translate-x-1/4 -translate-y-1/4",
                                "rounded-full border border-black",
                                step.state === "COMPLETE"
                                    ? "bg-green-400 active:bg-green-700"
                                    : "bg-yellow-400 active:bg-yellow-500",
                                index === actualStep ? "w-2.5 h-2.5" : "w-2 h-2",
                                ((processInfo.perSpectrum !== null) || (index < slicePoint))
                                && "cursor-pointer active:scale-90",
                            )}
                        />
                    )
                }
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
                            "bg-blue-500",
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
