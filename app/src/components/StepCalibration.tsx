import type { EmpiricalSpectrumPoint } from "./EmpiricalSpectrum"
import { ContinueButton } from "@/components/ContinueButton"
import { FitsLoader } from "@/components/FitsLoader"
import { InferenceForm } from "@/components/InferenceForm"
import { ReferenceLampForm } from "@/components/ReferenceLampForm"
import { ReferenceLampRange } from "@/components/ReferenceLampRange"
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum"
import { useState } from "react"

export function StepCalibration() {
    const [scienceSpectrumData, setScienceSpectrumData] = useState<EmpiricalSpectrumPoint[] | null>(null)

    return (
        <>
            <div className="flex w-full">
                <div className="w-1/4 bg-gray-200 p-4 rounded-md">
                    <ReferenceLampForm />
                    <InferenceForm />
                </div>

                <div className="w-3/4 bg-gray-100 p-4">
                    <ReferenceLampRange />
                    <ReferenceLampSpectrum />
                    <h1 className="text-2xl font-bold">Empirical Comparison Lamp</h1>
                    <FitsLoader
                        plotColor="#0ea5e9"
                        setData={() => { }}
                        interactable
                        preview
                    />
                    <h1 className="text-2xl font-bold">Empirical Spectrum</h1>
                    <FitsLoader
                        plotColor="#16a34a"
                        setData={setScienceSpectrumData}
                        interactable={false}
                        preview
                    />
                </div>
            </div>

            <ContinueButton data={scienceSpectrumData} />
        </>
    )
}
