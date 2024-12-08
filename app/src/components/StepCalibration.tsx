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
            <ReferenceLampForm />

            <section className="space-y-0 my-8">
                <ReferenceLampRange />
                <ReferenceLampSpectrum />
                <div>
                    <h1 className="text-2xl font-bold">Empirical Comparison Lamp</h1>
                    <FitsLoader
                        plotColor="#0ea5e9"
                        setData={() => { }}
                        interactable
                        preview
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Empirical Spectrum</h1>
                    <FitsLoader
                        plotColor="#16a34a"
                        setData={setScienceSpectrumData}
                        interactable={false}
                        preview
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Inference function fit</h1>
                    <InferenceForm />
                </div>
            </section>

            <ContinueButton data={scienceSpectrumData} />
        </>
    )
}
