import { useEffect, useState } from "react"
import { useExtractFeatures } from "@/hooks/use-extract-features"
import { useGlobalStore } from "@/hooks/use-global-store"
import type { StepProps } from "@/interfaces/StepProps"
import { Button } from "../atoms/button"
import { SimpleFunctionXY } from "../molecules/SimpleFunctionXY"
import { ImageWithPixelExtraction } from "../organisms/ImageWithPixelExtraction"
import { cropImages } from "@/lib/cropImage"
import { BoundingBox } from "@/interfaces/BoundingBox"

export function StepFeatureExtraction({
  index,
  processInfo,
  setProcessInfo,
}: StepProps) {
  const countCheckpoints = 5
  const segmentWidth = 60
  const useSpline = false
  const reuseScienceFunction = true

  // /** Extrae los expectros 1D de un conjunto de imagenes y guarda su información como imagenes */
  // const determineBBFunction = usePredictBBs(
  //   1088,
  //   "spectrum_part_segmentator.onnx",
  //   classesSpectrumPartSegmentation,
  //   true,
  //   0.6
  // )
  // useProcessSpectraPool(determineBBFunction)

  const [setActualStep, selectedSpectrum] = useGlobalStore((s) => [
    s.setActualStep,
    s.selectedSpectrum,
  ])

  // const [urls, setUrls] = useState<{
  //   science: string
  //   lamp1: string
  //   lamp2: string
  // } | null>({
  //   science: "/forTest/Test1_Science1_v2.png",
  //   lamp1: "/forTest/Test1_Lamp1_v2.png",
  //   lamp2: "/forTest/Test1_Lamp2_v2.png",
  // })
  const [urls, setUrls] = useState<{ science: string, lamp1: string, lamp2: string } | null>(null)
  useEffect(() => {
    const boundingBoxes: BoundingBox[] = [
      processInfo.data.spectrums[selectedSpectrum!].parts.science.boundingBox!,
      processInfo.data.spectrums[selectedSpectrum!].parts.lamp1.boundingBox!,
      processInfo.data.spectrums[selectedSpectrum!].parts.lamp2.boundingBox!,
    ].map(bb => ({
      ...bb,
      x: bb.x + processInfo.data.spectrums[selectedSpectrum!].spectrumBoundingBox.x,
      y: bb.y + processInfo.data.spectrums[selectedSpectrum!].spectrumBoundingBox.y
    }))

    cropImages(
      processInfo.data.plate.scanImage!,
      boundingBoxes,
    ).then(([science, lamp1, lamp2]) => {
      // console.log("BB: ", boundingBoxes)
      // for (let i = 0; i < [science, lamp1, lamp2].length; i++) {
      //   const a = document.createElement("a")
      //   a.href = [science, lamp1, lamp2][i]
      //   a.download = "imagen.png"
      //   a.click()
      // }

      setUrls({ science, lamp1, lamp2 })
    })
  }, [processInfo.data.plate.scanImage, processInfo.data.spectrums, selectedSpectrum])

  const {
    scienceInfo,
    scienceMediasPoints,
    scienceAvgOpening,
    scienceFunction,
    scienceTransversalFunctions,
    scienceTransversalAvgs,
    lamp1MediasPoints,
    lamp1AvgOpening,
    lamp1Function,
    lamp1TransversalFunctions,
    lamp1TransversalAvgs,
    lamp2MediasPoints,
    lamp2AvgOpening,
    lamp2Function,
    lamp2TransversalFunctions,
    lamp2TransversalAvgs,
  } = useExtractFeatures(
    countCheckpoints,
    segmentWidth,
    urls?.science,
    urls?.lamp1,
    urls?.lamp2,
    useSpline,
    reuseScienceFunction,
  )

  function onComplete() {
    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    /// Tambien realiza el guardado de los espectros extraidos para cada parte del espectro.
    const generalTotal = processInfo.processingStatus.generalSteps.length
    setProcessInfo((prev) => ({
      ...prev,
      /** Modificaciones relativas a guardar los espectros de ciencia adquiridos. */
      data: {
        ...prev.data,
        spectrums: prev.data.spectrums.map(
          (spectrum, idx) =>
            idx === selectedSpectrum // ¿Es el espectro seleccionado?
              ? {
                  // Si => Actualiza la información de los espectros extraidos con lo que calculo.
                  ...spectrum,
                  parts: {
                    ...spectrum.parts,
                    science: {
                      ...spectrum.parts.science,
                      extractedSpectrum: scienceTransversalAvgs!,
                    },
                    lamp1: {
                      ...spectrum.parts.lamp1,
                      extractedSpectrum: lamp1TransversalAvgs!,
                    },
                    lamp2: {
                      ...spectrum.parts.lamp2,
                      extractedSpectrum: lamp2TransversalAvgs!,
                    },
                  },
                }
              : spectrum, // No => mantener datos.
        ),
      },
      /** Modificaciones relativas a avisar que el paso esta completado. */
      processingStatus: {
        ...prev.processingStatus,
        specificSteps: prev.processingStatus.specificSteps.map(
          (step, i) =>
            i === index - generalTotal // La etapa actual de selectedSpectrum se marca como completado
              ? {
                  ...step,
                  states: step.states!.map((state, j) =>
                    j === selectedSpectrum ? ("COMPLETE" as const) : state,
                  ),
                }
              : i === index - generalTotal + 1 // Si hay otra etapa adelante se la marca como que necesita cambios
                ? {
                    ...step,
                    states: step.states!.map((state, j) =>
                      j === selectedSpectrum
                        ? ("NECESSARY_CHANGES" as const)
                        : state,
                    ),
                  }
                : step, // Cualquier otra etapa mantiene su informacion
        ),
      },
    }))
    setActualStep(index + 1)
  }

  return (
    <div className="w-full p-6 flex flex-col items-center">
      {urls && scienceInfo && (
        <div className="flex flex-col gap-4">
          <ImageWithPixelExtraction
            title="Science Spectrum"
            imageUrl={urls?.science}
            imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
            pointsWMed={scienceMediasPoints}
            drawFunction={scienceFunction!}
            perpendicularFunctions={scienceTransversalFunctions}
            opening={scienceAvgOpening}
          >
            <SimpleFunctionXY data={scienceTransversalAvgs} />
          </ImageWithPixelExtraction>

          <ImageWithPixelExtraction
            title="Lamp 1 Spectrum"
            imageUrl={urls?.lamp1}
            imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
            pointsWMed={lamp1MediasPoints}
            drawFunction={lamp1Function!}
            perpendicularFunctions={lamp1TransversalFunctions}
            opening={lamp1AvgOpening}
          >
            <SimpleFunctionXY data={lamp1TransversalAvgs} />
          </ImageWithPixelExtraction>

          <ImageWithPixelExtraction
            title="Lamp 2 Spectrum"
            imageUrl={urls?.lamp2}
            imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 2."
            pointsWMed={lamp2MediasPoints}
            drawFunction={lamp2Function!}
            perpendicularFunctions={lamp2TransversalFunctions}
            opening={lamp2AvgOpening}
          >
            <SimpleFunctionXY data={lamp2TransversalAvgs} />
          </ImageWithPixelExtraction>
        </div>
      )}
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>Save</Button>
    </div>
  )
}
