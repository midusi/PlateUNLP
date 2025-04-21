import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { XYChart } from "@visx/xychart"
import { Button } from "../atoms/button"

export function StepFeatureExtraction({ index, processInfo, setProcessInfo }: StepProps) {
  const imageSrc = "/forTest/Lamp1.png"
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])

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
    setActualStep(index + 1)
  }

  return (
    <div className="w-full p-6 flex flex-col items-center">
      <SimpleImage src={imageSrc} />
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>
        Save
      </Button>
    </div>
  )
}

function SimpleImage({ src }: { src: string }) {
  return (
    <div className="relative w-full h-[300px] mb-6">
      <img
        src={src}
        alt="Feature Extraction Image"
      />
    </div>
  )
}

function SimpleFunctionXY({ src }: { src: string }) {
  return (
    <XYChart
      theme={theme}
      xScale={config.x}
      yScale={config.y}
      height={Math.min(400, height)}
      captureEvents={!editAnnotationLabelPosition}
      onPointerUp={(d) => {
        setAnnotationDataKey(d.key as "New York" | "San Francisco" | "Austin")
        setAnnotationDataIndex(d.index)
      }}
    >

    </XYChart>
  )
}
