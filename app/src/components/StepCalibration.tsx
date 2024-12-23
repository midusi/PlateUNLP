import type { EmpiricalSpectrumPoint } from "./EmpiricalSpectrum"
import { ContinueButton } from "@/components/ContinueButton"
import { FitsLoader } from "@/components/FitsLoader"
import { InferenceForm } from "@/components/InferenceForm"
import { ReferenceLampForm } from "@/components/ReferenceLampForm"
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum"
import { useState } from "react"
import { Pane, ResizablePanes } from "resizable-panes-react"
import { ReferenceLampRangeUI } from "./ReferenceLampRangeUI"
import { CardTitle } from "./ui/card"

interface StageProps {
    onComplete: () => void
}

export function StepCalibration({ onComplete }: StageProps) {
    const [scienceSpectrumData, setScienceSpectrumData] = useState<EmpiricalSpectrumPoint[] | null>(null)

    return (
        <>
            <ResizablePanes
                vertical
                uniqueId="uniqueId"
                resizerSize={5}
                resizerClass="w-full bg-gradient-to-t from-sky-300 to-sky-200 border-2 border-gray-300 rounded-md flex justify-center items-center"
            >
                <Pane id="P0" size={30} minSize={20} className="bg-gray-200 p-4">
                    <ReferenceLampForm />
                    <InferenceForm />
                </Pane>
                <Pane id="P1" size={70} minSize={20} className="bg-gray-100 p-4">
                    <CardTitle>Teorical Comparison Lamp</CardTitle>
                    <ReferenceLampRangeUI />
                    <div className="flex flex-col h-screen">
                        <div className="flex-1">
                            <ReferenceLampSpectrum />
                        </div>
                        <div className="flex-1">
                            <CardTitle>Empirical Comparison Lamp</CardTitle>
                            <div className="flex-1 h-full">
                                <FitsLoader
                                    plotColor="#0ea5e9"
                                    setData={() => { }}
                                    interactable
                                    preview
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <CardTitle>Empirical Spectrum</CardTitle>
                            <FitsLoader
                                plotColor="#16a34a"
                                setData={setScienceSpectrumData}
                                interactable={false}
                                preview
                            />
                        </div>
                    </div>

                </Pane>
            </ResizablePanes>
            <ContinueButton
                className="flex justify-center pt-4"
                data={scienceSpectrumData}
                inSuccessfulCase={onComplete}
            />
        </>
    )
}
