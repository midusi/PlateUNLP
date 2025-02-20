import { NavigationProgressBar } from "@/components/organisms/NavigationProgressBar"
import { NewNavigationProgressBar } from "@/components/organisms/NewNavigationProgressBar"
import { StepCalibration } from "@/components/pages/StepCalibration"
import { StepSpectrumSegmentation } from "@/components/pages/StepSpectrumSegmentation"
import { StepMetadataRetrieval } from "./components/pages/StepMetadataRetrieval"
import { StepPlateSegmentation } from "./components/pages/StepPlateSegmentation"
import { useGlobalStore } from "./hooks/use-global-store"

export default function App() {
  const [completedStages, setCompletedStages] = useGlobalStore(s => [
    s.completedStages,
    s.setCompletedStages,
  ])

  function onComplete(stageNumber: number) {
    if (stageNumber === completedStages + 1)
      setCompletedStages(stageNumber)
  }

  return (
    <div className="w-full mx-auto">
      <header className="mb-12 bg-[#2D3748]">
        <h1 className="text-left text-2xl text-white font-bold tracking-tight p-4">
          🌌 PlateUNLP
        </h1>
      </header>

      <main className="px-8">
        <NewNavigationProgressBar general={[]} perSpectrum={[]}/>
        <NavigationProgressBar
          initialStep={1}
          stepsArr={[
            { name: "Begin", content: <>BEGIN</> },
            { name: "Plate segmentation", content: <StepPlateSegmentation onComplete={() => onComplete(1)} /> },
            { name: "Metadata retrieval", content: <StepMetadataRetrieval onComplete={() => onComplete(2)} /> },
            { name: "Spectrum segmentation", content: <StepSpectrumSegmentation onComplete={() => onComplete(3)} /> },
            { name: "Feature extraction", content: <>4</> },
            { name: "Calibration", content: <StepCalibration onComplete={() => onComplete(5)} /> },
            { name: "Completed", content: <>FIN</> },
          ]}
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
