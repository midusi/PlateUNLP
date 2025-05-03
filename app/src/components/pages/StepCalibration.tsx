import type { EmpiricalSpectrumPoint } from "@/components/molecules/EmpiricalSpectrum"
import type { StepProps } from "@/interfaces/StepProps"
import { CardTitle } from "@/components/atoms/card"
import { ContinueButton } from "@/components/molecules/ContinueButton"
import { EmpiricalSpectrum } from "@/components/molecules/EmpiricalSpectrum"
import { ReferenceLampRangeUI } from "@/components/molecules/ReferenceLampRangeUI"
import { ReferenceLampSpectrum } from "@/components/molecules/ReferenceLampSpectrum"
import { FitsLoader } from "@/components/organisms/FitsLoader"
import { InferenceForm } from "@/components/organisms/InferenceForm"
import { ReferenceLampForm } from "@/components/organisms/ReferenceLampForm"
import { useGlobalStore } from "@/hooks/use-global-store"
import { Pane, ResizablePanes } from "resizable-panes-react"

export function StepCalibration({ index, processInfo, setProcessInfo }: StepProps) {
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])
  const scienceSpectrum = processInfo.data.spectrums[selectedSpectrum!].parts.science.extractedSpectrum!
    .map((y, idx) => ({
      pixel: idx,
      intensity: y,
    }))
  const lamp1Spectrum = processInfo.data.spectrums[selectedSpectrum!].parts.lamp1.extractedSpectrum!
    .map((y, idx) => ({
      pixel: idx,
      intensity: y,
    }))
  const lamp2Spectrum = processInfo.data.spectrums[selectedSpectrum!].parts.lamp2.extractedSpectrum!
    .map((y, idx) => ({
      pixel: idx,
      intensity: y,
    }))

  function onComplete() {
    /// AGREGAR GUARDADO DE DATOS EXTRAIDOS

    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    const generalTotal = processInfo.processingStatus.generalSteps.length
    setProcessInfo(prev => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        specificSteps: prev.processingStatus.specificSteps.map((step, i) => (
          (i === (index - generalTotal)) // La etapa actual de selectedSpectrum se marca como completado
            ? {
                ...step,
                states: step.states!.map((state, j) => (
                  j === selectedSpectrum
                    ? "COMPLETE" as const
                    : state
                )),
              }
            : ((i === (index - generalTotal + 1))// Si hay otra etapa adelante se la marca como que necesita cambios
                ? {
                    ...step,
                    states: step.states!.map((state, j) => (
                      j === selectedSpectrum
                        ? "NECESSARY_CHANGES" as const
                        : state
                    )),
                  }
                : step // Cualquier otra etapa mantiene su informacion
              )
        )),
      },
    }))
    setActualStep(2) // Redirige a Spectrum Selection
  }

  return (
    <>
      <ResizablePanes
        vertical
        uniqueId="uniqueId"
        resizerSize={5}
        resizerClass="w-full bg-gradient-to-t from-sky-300 to-sky-200 border-2 border-gray-300 rounded-md flex justify-center items-center"
      >
        <Pane id="P0" size={30} minSize={20} className="bg-gray-200 p-4">
          <ReferenceLampForm />
          <InferenceForm />
        </Pane>
        <Pane id="P1" size={70} minSize={20} className="bg-gray-100 p-4">
          <CardTitle>Teorical Comparison Lamp</CardTitle>
          <ReferenceLampRangeUI />
          <div className="flex flex-col h-screen">
            <div className="flex-1">
              <ReferenceLampSpectrum />
            </div>
            <div className="flex-1">
              <CardTitle>Empirical Comparison Lamp 1</CardTitle>
              <div className="flex-1 h-full">
                <EmpiricalSpectrum
                  data={lamp1Spectrum!}
                  color="#0ea5e9"
                  interactable
                  preview
                />
              </div>
            </div>

            <div className="flex-1">
              <CardTitle>Empirical Science Spectrum</CardTitle>
              <EmpiricalSpectrum
                data={scienceSpectrum}
                color="#0ea5e9"
                interactable
                preview
              />
            </div>
          </div>

        </Pane>
      </ResizablePanes>
      <ContinueButton
        className="flex justify-center pt-4"
        data={scienceSpectrum}
        inSuccessfulCase={onComplete}
      />
    </>
  )
}
