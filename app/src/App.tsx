import { ReferenceLampForm } from "@/components/ReferenceLampForm"
import { ReferenceLampRange } from "@/components/ReferenceLampRange"
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum"
import { useRef, useState } from "react"
import { ContinueButton } from "./components/ContinueButton"
import { FitsLoader } from "./components/FitsLoader"
import { linearRegression } from "./lib/utils"

interface EmpiricalSpectrumPoint {
  pixel: number
  intensity: number
}

interface InferenceOption {
  name: string
  function: (x: number[], y: number[]) => ((value: number) => number)
}

const radioOptions: InferenceOption[] = [
  {
    name: "Linear regresion",
    function: linearRegression,
  },
  {
    name: "Legendre (8 coefficients)",
    function: linearRegression, // Cambiar por legendreRegression
  },
]

export default function App() {
  const [scienceSpectrumData, setScienceSpectrumData] = useState<EmpiricalSpectrumPoint[] | null>(null)
  const [exportedFunction, setExportedFunction] = useState(radioOptions[0])

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
        </section>

        {/* Refactorizar: De aca hasta despues del objeto ContinueButton. */}
        <p>
          Wavelength inference method:
          {radioOptions.map((option: InferenceOption) => (
            <label key={option.name} style={{ display: "block", marginBottom: "8px" }}>
              <input
                type="radio"
                name="inferenceMethod"
                value={option.name}
                checked={exportedFunction.name === option.name}
                onChange={() => {
                  setExportedFunction(option)
                }}
              />
              {option.name}

            </label>
          ))}
        </p>
        <ContinueButton data={scienceSpectrumData} inferenceFunction={exportedFunction.function} />
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
