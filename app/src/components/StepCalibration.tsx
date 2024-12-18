import type { EmpiricalSpectrumPoint } from "./EmpiricalSpectrum"
import { ContinueButton } from "@/components/ContinueButton"
import { FitsLoader } from "@/components/FitsLoader"
import { InferenceForm } from "@/components/InferenceForm"
import { ReferenceLampForm } from "@/components/ReferenceLampForm"
import { ReferenceLampRange } from "@/components/ReferenceLampRange"
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum"
import { useState } from "react"
import { CardTitle } from "./ui/card"

interface StageProps {
    onComplete: () => void
}

export function StepCalibration({ onComplete }: StageProps) {
    const [scienceSpectrumData, setScienceSpectrumData] = useState<EmpiricalSpectrumPoint[] | null>(null)

    return (
        <>
            <div className="flex w-full">
                <div className="w-1/4 bg-gray-200 p-4 rounded-md">
                    <ReferenceLampForm />
                    <InferenceForm />
                </div>

                <div className="w-3/4 bg-gray-100 p-4">
                    <CardTitle>Teorical Comparison Lamp</CardTitle>
                    <ReferenceLampRange />
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

                </div>
            </div>

            <ContinueButton className="flex justify-center pt-4" data={scienceSpectrumData} />
        </>
    )
}
