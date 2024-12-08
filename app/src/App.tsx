import type { stepData } from "./components/NavigationProgressBar"
import { NavigationProgressBar } from "./components/NavigationProgressBar"
import { StepCalibration } from "./components/StepCalibration"

export default function App() {
  return (
    <div className="max-w-6xl px-8 mx-auto">
      <header>
        <h1 className="text-center mt-12 mb-16 text-4xl font-bold tracking-tight lg:text-5xl">
          🌌 PlateUNLP
        </h1>
      </header>

      <main>
        <NavigationProgressBar stepsArr={[
          { name: "Begin", content: <>BEGIN</> },
          { name: "Digitization", content: <>1</> },
          { name: "Spectrum segmentation", content: <>2</> },
          { name: "Feature extraction", content: <>3</> },
          { name: "Calibration", content: <StepCalibration /> },
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
