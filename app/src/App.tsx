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
import { StepSpectrumSelection } from "./components/pages/StepSpectrumSelection"

export default function App() {
  const [processInfo, setProcessInfo] = useState<ProcessInfoForm>({
    processingStatus: {
      generalSteps: [
        { state: "NECESSARY_CHANGES" },
        ...Array.from({ length: 2 }, () => ({ state: "NOT_REACHED" as const })),
      ],
      specificSteps: Array.from({ length: 4 }, () => ({ states: null })),
    },
    data: {
      plate: {
        scanImage: null,
        sharedMetadata: {
          OBSERVAT: "",
          OBSERVER: "",
          DIGITALI: 0,
          SCANNER: "",
          SOFTWARE: "",
          PLATE_N: ""
        },
      },
      spectrums: []
    },
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
  const bridgeStep: StepData = {
    id: "Spectrum Selection",
    content: <StepSpectrumSelection index={2} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
  }
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
      content: <StepFeatureExtraction index={5} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
    {
      id: "Calibration",
      content: <StepCalibration index={6} processInfo={processInfo} setProcessInfo={setProcessInfo} />,
    },
  ]

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
          bridgeStep={bridgeStep}
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
