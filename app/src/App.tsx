import type { StepData } from "@/components/organisms/NewNavigationProgressBar"
import type { ProcessInfoForm } from "./interfaces/ProcessInfoForm"
import { NewNavigationProgressBar } from "@/components/organisms/NewNavigationProgressBar"
import { StepCalibration } from "@/components/pages/StepCalibration"
import { StepSpectrumSegmentation } from "@/components/pages/StepSpectrumSegmentation"
import { useState } from "react"
import { StepFeatureExtraction } from "./components/pages/StepFeatureExtraction"
import { StepMetadataRetrieval } from "./components/pages/StepMetadataRetrieval"
import { StepPlateMetadata } from "./components/pages/StepPlateMetadata"
import { StepPlateSegmentation } from "./components/pages/StepPlateSegmentation"

export default function App() {
  const [processInfo, setProcessInfo] = useState<ProcessInfoForm>({
    general: [
      { state: "NECESSARY_CHANGES" },
      ...Array.from({ length: 2 }, () => ({ state: "NOT_REACHED" as const })),
    ],
    perSpectrum: Array.from({ length: 4 }, () => ({ states: null })),
    selectedSpectrum: null,
  })

  // Steps info form
  const generalSteps: StepData[] = [
    {
      id: "Plate Metadata",
      content: <StepPlateMetadata index={0} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
    {
      id: "Plate Segmentation",
      content: <StepPlateSegmentation index={1} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
  ]
  const specificSteps: StepData[] = [
    {
      id: "Spectrum Segmentation",
      content: <StepSpectrumSegmentation index={3} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
    {
      id: "Spectrum Metadata",
      content: <StepMetadataRetrieval index={4} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
    {
      id: "Feature Extraction",
      content: <StepFeatureExtraction index={6} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
    {
      id: "Calibration",
      content: <StepCalibration index={6} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
  ]

  function onComplete(stageNumber: number) {
    if (stageNumber < processInfo.general.length - 1) {
      setProcessInfo(prev => ({
        ...prev,
        general: prev.general.map((spectrum, i) => (
          i === stageNumber
            ? {
              ...spectrum,
              state: "COMPLETE",
            }
            : (i === stageNumber + 1
              ? {
                ...spectrum,
                state: "NECESSARY_CHANGES",
              }
              : { ...spectrum }
            )
        ),
        ),
      }))
      processInfo.general[stageNumber].state = "COMPLETE"
      processInfo.general[stageNumber + 1].state = "NECESSARY_CHANGES"
    }
    else if (stageNumber === processInfo.general.length) {
      setProcessInfo(prev => ({
        ...prev,
        perSpectrum: prev.perSpectrum.map((spectrum, i) => (
          i === 0
            ? {
              ...spectrum,
              states: spectrum.states!.map(_ => "NECESSARY_CHANGES"),
            }
            : spectrum
        )),
      }))
      processInfo.perSpectrum[0].states = processInfo.perSpectrum[0].states!.map(() => "NECESSARY_CHANGES")
    }
  }

  return (
    <div className="w-full mx-auto">
      <header className="mb-12 bg-[#2D3748]">
        <h1 className="text-left text-2xl text-white font-bold tracking-tight p-4">
          🌌 PlateUNLP
        </h1>
      </header>

      <main className="px-8">
        <NewNavigationProgressBar
          general={generalSteps}
          perSpectrum={specificSteps}
          processInfo={processInfo}
        />
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
