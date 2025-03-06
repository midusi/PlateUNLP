import type { ProcessInfoForm } from "@/interfaces/ProcessInfoForm"
import { useGlobalStore } from "@/hooks/use-global-store"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"
import clsx from "clsx"
import { Tooltip } from "react-tooltip"
import { Button } from "../atoms/button"

interface NewNavigationProgressBarProps {
    general: StepData[]
    bridgeStep: StepData
    perSpectrum: StepData[]
    processInfo: ProcessInfoForm
}

export interface StepData {
    id: string
    content: JSX.Element
}

function getStepState(index: number, processInfo: ProcessInfoForm, selectedSpectrum: number | null):
    "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE" {
    // Comprobar existencia de paso destino
    const total = processInfo.general.length + processInfo.perSpectrum.length
    if (index < 0 || index >= total) {
        return "NOT_REACHED"
    }

    const slicePoint = processInfo.general.length
    return index < slicePoint
        ? processInfo.general[index].state
        : ((processInfo.perSpectrum[index - slicePoint].states && selectedSpectrum !== null)
            ? processInfo.perSpectrum[index - slicePoint].states![0]
            : "NOT_REACHED"
        )
}

export function NewNavigationProgressBar({ general, bridgeStep, perSpectrum, processInfo }: NewNavigationProgressBarProps) {
    const [actual, setActual, selectedSpectrum] = useGlobalStore(s => [
        s.actualStep,
        s.setActualStep,
        s.selectedSpectrum,
    ])

    const steps = [...general, bridgeStep, ...perSpectrum]

    const leftButton = (
        <Button
            className={clsx(
                "flex-shrink-0",
                "text-orange-500 bg-white shadow-none",
                "hover:text-black hover:bg-gray-200 transition active:bg-gray-400",
                "disabled:text-white",
            )}
            onClick={() => { setActual(actual - 1) }}
            disabled={getStepState(actual - 1, processInfo, selectedSpectrum) === "NOT_REACHED"}
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
            disabled={getStepState(actual + 1, processInfo, selectedSpectrum) === "NOT_REACHED"}
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
                        spectrumSelected={selectedSpectrum}
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
    setActualStep: (value: number) => void
    spectrumSelected: number | null
    processInfo: ProcessInfoForm
}

function NavigationLine({
    generalSteps,
    bridgeStep,
    specificSteps,
    actualStep,
    setActualStep,
    spectrumSelected,
    processInfo,
}: NavigationLineProps) {
    const steps = [...generalSteps, bridgeStep, ...specificSteps]
    const slicePoint: number = processInfo.general.length

    return (
        <div className="relative flex items-center flex-1 w-full">
            {/* Barra de progreso */}
            <div className="absolute left-0 right-0 h-1 bg-gray-500" />
            <div
                className="absolute left-0 h-1 bg-blue-500 transition-all duration-500"
                style={{ width: `${(actualStep / (steps.length - 1)) * 100}%` }}
            />
            {/* Puntos */}
            <div className="flex items-center justify-between w-full">
                {steps.map((step, index) => (
                    <StepPoint
                        key={step.id}
                        index={index}
                        step={step}
                        actualStepIndex={actualStep}
                        spectrumSelected={spectrumSelected}
                        processInfo={processInfo}
                        setActualStep={setActualStep}
                    />
                ),
                )}
            </div>
            <div
                className={clsx(
                    "absolute bg-gray-50 border rounded-lg  border-dashed",
                    "pb-4 pt-4",
                    spectrumSelected !== null ? "-z-10 border-yellow-300" : "-z-1 border-red-500 bg-opacity-90",
                )}
                style={{
                    left: `${Math.round(100 * slicePoint / steps.length)}%`,
                    right: `-1%`,
                }}
            >
                {spectrumSelected !== null && (
                    <span className={clsx(
                        "absolute top-0 left-1 text-left -translate-y-4",
                        "text-xs font-semibold ",
                        "text-black",
                    )}
                    >
                        {processInfo.spectrums[spectrumSelected].name}
                    </span>
                )}

            </div>
        </div>
    )
}

interface StepPointProps {
    index: number
    step: StepData
    actualStepIndex: number
    spectrumSelected: number | null
    processInfo: ProcessInfoForm
    setActualStep: (value: number) => void
}

function StepPoint({ index, step, actualStepIndex, spectrumSelected, processInfo, setActualStep }: StepPointProps) {
    const state = getStepState(index, processInfo, spectrumSelected)
    const clickAvailable: boolean = state !== "NOT_REACHED"
    const size: string = index === actualStepIndex ? "w-5 h-5" : "w-4 h-4"
    const color: string = index <= actualStepIndex ? "bg-blue-500" : "bg-gray-500"
    return (
        <>
            <span
                className={clsx(
                    "rounded-full",
                    color,
                    size,
                    clickAvailable && "cursor-pointer active:scale-90 active:bg-blue-700",
                    "relative flex items-center justify-center",
                )}
                onClick={clickAvailable
                    ? (_) => { setActualStep(index) }
                    : () => { }}
                data-tooltip-id={`step-${step.id}-2tooltip`}
            >
                {(index < processInfo.general.length || spectrumSelected !== null)
                    && (
                        <StatePoint
                            index={index}
                            actualStep={actualStepIndex}
                            state={state}
                        />
                    )}
            </span>
            <Tooltip
                id={`step-${step.id}-2tooltip`}
                place="top"
                delayShow={300}
                content={step.id}
            />
        </>
    )
}

interface StatePointProps {
    index: number
    actualStep: number
    state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
}

function StatePoint({ index, actualStep, state }: StatePointProps) {
    if (state === "NOT_REACHED")
        return null
    return (
        <span
            className={clsx(
                "absolute top-0 right-0 translate-x-1/4 -translate-y-1/4",
                "rounded-full border border-black",
                state === "COMPLETE"
                    ? "bg-green-400 active:bg-green-700"
                    : "bg-yellow-400 active:bg-yellow-500",
                index === actualStep ? "w-2.5 h-2.5" : "w-2 h-2",
                "cursor-pointer active:scale-90",
            )}
        />
    )
}
