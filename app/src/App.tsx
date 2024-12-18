import { NavigationProgressBar } from "./components/NavigationProgressBar"
import { StepCalibration } from "./components/StepCalibration"
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
        <NavigationProgressBar
          initialStep={4}
          stepsArr={[
            { name: "Begin", content: <>BEGIN</> },
            { name: "Digitization", content: <>1</> },
            { name: "Spectrum segmentation", content: <>2</> },
            { name: "Feature extraction", content: <>3</> },
            { name: "Calibration", content: <StepCalibration onComplete={() => onComplete(4)} /> },
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
