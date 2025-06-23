import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import type { StepData } from "~/components/organisms/NewNavigationProgressBar"
import { NewNavigationProgressBar } from "~/components/organisms/NewNavigationProgressBar"
import { StepCalibration } from "~/components/pages/StepCalibration"
import { StepFeatureExtraction } from "~/components/pages/StepFeatureExtraction"
import { StepMetadataRetrieval } from "~/components/pages/StepMetadataRetrieval"
import { StepPlateMetadata } from "~/components/pages/StepPlateMetadata"
import { StepPlateSegmentation } from "~/components/pages/StepPlateSegmentation"
import { StepSpectrumSegmentation } from "~/components/pages/StepSpectrumSegmentation"
import { StepSpectrumSelection } from "~/components/pages/StepSpectrumSelection"
import type { ProcessInfoForm } from "~/types/ProcessInfoForm"

export const Route = createFileRoute("/plate/$plateId/")({
  component: RouteComponent,
})

function RouteComponent() {
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
          DIGITALI: "",
          SCANNER: "",
          SOFTWARE: "",
          PLATE_N: "",
          DETECTOR: "",
          INSTRUMENT: "",
          TELESCOPE: "",
        },
      },
      spectrums: [],
    },
  })

  // Steps info form
  const generalSteps: StepData[] = [
    {
      id: "Plate Metadata",
      content: (
        <StepPlateMetadata index={0} processInfo={processInfo} setProcessInfo={setProcessInfo} />
      ),
    },
    {
      id: "Plate Segmentation",
      content: (
        <StepPlateSegmentation
          index={1}
          processInfo={processInfo}
          setProcessInfo={setProcessInfo}
        />
      ),
    },
  ]
  const bridgeStep: StepData = {
    id: "Spectrum Selection",
    content: (
      <StepSpectrumSelection index={2} processInfo={processInfo} setProcessInfo={setProcessInfo} />
    ),
  }
  const specificSteps: StepData[] = [
    {
      id: "Spectrum Metadata",
      content: (
        <StepMetadataRetrieval
          index={3}
          processInfo={processInfo}
          setProcessInfo={setProcessInfo}
        />
      ),
    },
    {
      id: "Spectrum Segmentation",
      content: (
        <StepSpectrumSegmentation
          index={4}
          processInfo={processInfo}
          setProcessInfo={setProcessInfo}
        />
      ),
    },
    {
      id: "Extraction",
      content: (
        <StepFeatureExtraction
          index={5}
          processInfo={processInfo}
          setProcessInfo={setProcessInfo}
        />
      ),
    },
    {
      id: "Calibration",
      content: (
        <StepCalibration index={6} processInfo={processInfo} setProcessInfo={setProcessInfo} />
      ),
    },
  ]
  return (
    <NewNavigationProgressBar
      general={generalSteps}
      bridgeStep={bridgeStep}
      perSpectrum={specificSteps}
      processInfo={processInfo}
    />
  )
}
