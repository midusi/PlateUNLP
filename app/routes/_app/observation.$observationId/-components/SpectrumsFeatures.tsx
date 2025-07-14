import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { extractFeatures, type extractFeaturesResponse } from "~/lib/extract-features"
import { crop } from "~/lib/image"
import { cn } from "~/lib/utils"
import { ImageWithPixelExtraction } from "../../../../components/ImageWithPixelExtraction"
import { SimpleFunctionXY } from "../../../../components/SimpleFunctionXY"
import type { getSpectrums } from "../-actions/get-spectrums"

export function SpectrumsFeatures({
  observationId,
  spectrums,
}: {
  observationId: string
  spectrums: Awaited<ReturnType<typeof getSpectrums>>
}) {
  const countCheckpoints = 5
  const segmentWidth = 60
  const useSpline = false
  const reuseScienceFunction = true

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [science, setScience] = useState<Uint8Array<ArrayBufferLike>>()
  const [lamp1, setLamp1] = useState<Uint8Array<ArrayBufferLike>>()
  const [lamp2, setLamp2] = useState<Uint8Array<ArrayBufferLike>>()
  const [specAnalysis, setSpecAnalysis] =
    useState<extractFeaturesResponse<Uint8Array<ArrayBufferLike>>>()

  useEffect(() => {
    /** Si no hay suficientes espectros o el id de observacion no hace nada */
    if (!observationId || spectrums.length < 3) return
    console.log(1)
    const run = async () => {
      const images = await crop(
        `/observation/${observationId}/image`,
        spectrums.map((s) => ({
          top: s.imgTop,
          left: s.imgLeft,
          width: s.imgWidth,
          height: s.imgHeight,
        })),
      )
      console.log(2)
      /** Identificar imagenes de cada espectro */
      /** Imagen de espectro de ciencia */
      const science = images[0]
      /** Imagen de espectro de lampara de comparación 1 */
      const lamp1 = images[1]
      /** Imagen de espectro de lampara de comparación 2 */
      const lamp2 = images[2]
      console.log(3)
      /** Extraer caracteristicas en base a las imagenes de los espectros. */
      const spectrumAnalysis = extractFeatures(
        countCheckpoints,
        segmentWidth,
        science,
        lamp1,
        lamp2,
        useSpline,
        reuseScienceFunction,
      )
      console.log(4)
      /** Actualizar variables superiores */
      setScience(science.data)
      setLamp1(lamp1.data)
      setLamp2(lamp2.data)
      setSpecAnalysis(spectrumAnalysis)
      setIsLoading(false)
      console.log(5)
    }

    run()

    /** Funcion de Limpieza */
    return () => {}
  }, [observationId, spectrums])

  function downloadImage(buffer: Uint8Array, filename = "lamp1.png") {
    console.log(buffer)
    const blob = new Blob([buffer], { type: "image/png" }) // o image/jpeg si corresponde
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()

    // Limpieza
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <Button onClick={() => downloadImage(lamp1!, "lamp1.png")}>Descargar imagen</Button>
      <CardContent>
        {isLoading || !specAnalysis ? (
          <span className={cn("icon-[ph--spinner-bold] animate-spin")} />
        ) : (
          <div className="flex flex-col content-center justify-center gap-4">
            <div id="Spectrum-Extracted-Science">
              <ImageWithPixelExtraction
                title="Science Spectrum"
                image={science!}
                imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
                pointsWMed={specAnalysis.scienceMediasPoints}
                drawFunction={specAnalysis.scienceFunction!}
                perpendicularFunctions={specAnalysis.scienceTransversalFunctions}
                opening={specAnalysis.scienceAvgOpening}
              />
              <SimpleFunctionXY data={specAnalysis.scienceTransversalAvgs} />
            </div>

            <div id="Spectrum-Extracted-Lamp1">
              <ImageWithPixelExtraction
                title="Lamp 1 Spectrum"
                image={lamp1!}
                imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
                pointsWMed={specAnalysis.lamp1MediasPoints}
                drawFunction={specAnalysis.lamp1Function!}
                perpendicularFunctions={specAnalysis.lamp1TransversalFunctions}
                opening={specAnalysis.lamp1AvgOpening}
              />
              <SimpleFunctionXY data={specAnalysis.lamp1TransversalAvgs} />
            </div>

            <div id="Spectrum-Extracted-Lamp2">
              <ImageWithPixelExtraction
                title="Lamp 2 Spectrum"
                image={lamp2!}
                imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 2."
                pointsWMed={specAnalysis.lamp2MediasPoints}
                drawFunction={specAnalysis.lamp2Function!}
                perpendicularFunctions={specAnalysis.lamp2TransversalFunctions}
                opening={specAnalysis.lamp2AvgOpening}
              />
              <SimpleFunctionXY data={specAnalysis.lamp2TransversalAvgs} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
