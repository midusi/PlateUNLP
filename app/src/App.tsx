import { ReferenceLampForm } from "@/components/ReferenceLampForm"
import { ReferenceLampRange } from "@/components/ReferenceLampRange"
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum"
import { useState } from "react"
import { ContinueButton } from "./components/ContinueButton"
import { FitsLoader } from "./components/FitsLoader"
import { InferenceForm } from "./components/InferenceForm"

interface EmpiricalSpectrumPoint {
  pixel: number
  intensity: number
}

export default function App() {
  const [scienceSpectrumData, setScienceSpectrumData] = useState<EmpiricalSpectrumPoint[] | null>(null)
  return (
    <div className="max-w-6xl px-8 mx-auto">
      <header>
        <h1 className="text-center mt-12 mb-16 text-4xl font-bold tracking-tight lg:text-5xl">
          🌌 PlateUNLP
        </h1>
      </header>

      <main>
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
      </main>

      <footer className="mt-40 mb-20 text-xs italic text-center text-muted-foreground">
        Copyright @
        {new Date().getFullYear()}
        {" "}
        III-LIDI, Facultad de Informática, Universidad Nacional de la Plata
      </footer>
    </div>
  )
}
