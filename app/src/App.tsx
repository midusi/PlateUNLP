import { useState } from "react"
import type { StepData } from "@/components/organisms/NewNavigationProgressBar"
import { NewNavigationProgressBar } from "@/components/organisms/NewNavigationProgressBar"
import { StepCalibration } from "@/components/pages/StepCalibration"
import { StepSpectrumSegmentation } from "@/components/pages/StepSpectrumSegmentation"
import type { loginForm } from "./components/molecules/LoginForm"
import { LoginForm } from "./components/molecules/LoginForm"
import { StepFeatureExtraction } from "./components/pages/StepFeatureExtraction"
import { StepMetadataRetrieval } from "./components/pages/StepMetadataRetrieval"
import { StepPlateMetadata } from "./components/pages/StepPlateMetadata"
import { StepPlateSegmentation } from "./components/pages/StepPlateSegmentation"
import { StepSpectrumSelection } from "./components/pages/StepSpectrumSelection"
import type { ProcessInfoForm } from "./interfaces/ProcessInfoForm"

import { trpc } from "./lib/trpc"

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
        <StepPlateMetadata
          index={0}
          processInfo={processInfo}
          setProcessInfo={setProcessInfo}
        />
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
      <StepSpectrumSelection
        index={2}
        processInfo={processInfo}
        setProcessInfo={setProcessInfo}
      />
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
        <StepCalibration
          index={6}
          processInfo={processInfo}
          setProcessInfo={setProcessInfo}
        />
      ),
    },
  ]
  const [loginError, setLoginError] = useState<string>()
  const [loginSuccess, setLoginSuccess] = useState<boolean>(true)
  const handleLogin = (UserData: loginForm) => {
    setLoginError("")
    trpc.login
      .mutate({
        Email: UserData.Email,
        Password: UserData.Password,
      })
      .then((resultado) => {
        if (!resultado) {
          setLoginError("Incorrect credentials")
        } else {
          setLoginSuccess(true)
        }
      })
  }

  return (
    <div className="w-full mx-auto">
      <header className="mb-12 bg-[#2D3748]">
        <h1 className="text-left text-2xl text-white font-bold tracking-tight p-4">
          🌌 PlateUNLP
        </h1>
      </header>

      <main>
        {!loginSuccess && (
          <LoginForm login={handleLogin} errorMessage={loginError} />
        )}
        {loginSuccess && (
          <NewNavigationProgressBar
            general={generalSteps}
            bridgeStep={bridgeStep}
            perSpectrum={specificSteps}
            processInfo={processInfo}
          />
        )}
      </main>

      <footer className="mt-40 mb-20 text-xs italic text-center text-muted-foreground">
        Copyright @{new Date().getFullYear()} III-LIDI, Facultad de Informática,
        Universidad Nacional de la Plata
      </footer>

      <button
        type="button"
        onClick={() =>
          trpc.crearUsuario
            .mutate({
              name: Math.random().toString(),
              email: `${Math.random().toString()}@gmail.com`,
            })
            .then((resultado) => console.log(resultado))
        }
      >
        crear
      </button>
      <button
        type="button"
        onClick={() =>
          trpc.consulta.query().then((resultado) => console.log(resultado))
        }
      >
        consulta
      </button>
    </div>
  )
}
