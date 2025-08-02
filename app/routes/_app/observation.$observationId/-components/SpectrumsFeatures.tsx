import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "~/components/ui/card"
import { extractLamp, extractScience, type extractSpectrumResponse } from "~/lib/extract-features"
import { loadImage } from "~/lib/image"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import { ImageWithPixelExtraction } from "../../../../components/ImageWithPixelExtraction"
import { SimpleFunctionXY } from "../../../../components/SimpleFunctionXY"
import type { getSpectrums } from "../-actions/get-spectrums"
import type { Spectrum } from "../-utils/spectrum-to-bounding-box"

export function SpectrumsFeatures({
  observationId,
  spectrums,
}: {
  observationId: string
  spectrums: Awaited<ReturnType<typeof getSpectrums>>
}) {
  const reuseScienceFunction = true

  const [useSpline, setUseSpline] = useState(false)
  const [tempUseSpline, setTempUseSpline] = useState(false)
  const prevUseSpline = useRef(false)

  const [tempCheckpoints, setTempCheckpoints] = useState(5)
  const [countCheckpoints, setCountCheckpoints] = useState(5)
  const prevCountCheckpoints = useRef(5)

  const [segmentWidth, setSegmentWidth] = useState(100)
  const prevSegmentWidth = useRef(100)
  const [scienceAnalysis, setScienceAnalysis] = useState<{
    width: number
    height: number
    analysis: extractSpectrumResponse
  }>()
  const [state, setState] = useState<"waiting" | "running" | "ready">("waiting")

  const [observationImage, setObservationImage] = useState<HTMLImageElement | null>(null)

  // Crop and save the spectrum image to be analyzed
  const [spectrumsData, setSpectrumsData] = useState<
    {
      data: Spectrum
      image: Uint8Array
      analysis: extractSpectrumResponse
    }[]
  >([])
  useEffect(() => {
    if (!observationImage) {
      loadImage(`/observation/${observationId}/image`).then((image) => setObservationImage(image))
      return
    }
    if (spectrums.length === 0) return

    /** Coloca primero el espectro de ciencia */
    const indexSpectrum = spectrums.findIndex((s) => s.type === "science")
    const specScience = spectrums[indexSpectrum]
    const spectrumsArr = [...spectrums]
    spectrumsArr.splice(indexSpectrum, 1)
    let scienceInfo:
      | {
          width: number
          height: number
          analysis: extractSpectrumResponse
        }
      | undefined = scienceAnalysis

    /** Procesa espectro de ciencia */
    const saved = spectrumsData.find((s) => s.data.id === specScience.id)
    if (
      !saved ||
      specScience.type !== saved.data.type ||
      specScience.imgTop !== saved.data.imgTop ||
      specScience.imgLeft !== saved.data.imgLeft ||
      specScience.imgWidth !== saved.data.imgWidth ||
      specScience.imgHeight !== saved.data.imgHeight ||
      prevCountCheckpoints.current !== countCheckpoints ||
      prevUseSpline.current !== useSpline
    ) {
      const canvas = document.createElement("canvas")
      canvas.width = specScience.imgWidth
      canvas.height = specScience.imgHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        notifyError("Failed to create canvas context for spectrum image.")
        return
      }
      ctx.filter = "grayscale(1)"
      ctx.drawImage(
        observationImage,
        specScience.imgLeft,
        specScience.imgTop,
        specScience.imgWidth,
        specScience.imgHeight,
        0,
        0,
        specScience.imgWidth,
        specScience.imgHeight,
      )
      const data = new Uint8Array(
        ctx.getImageData(0, 0, specScience.imgWidth, specScience.imgHeight, {}).data.buffer,
      )
      canvas.remove()

      /** Extraer caracteristicas */
      const result: extractSpectrumResponse = extractScience({
        science: data,
        width: specScience.imgWidth,
        height: specScience.imgHeight,
        countCheckpoints,
        segmentWidth: segmentWidth,
        fitFunction: useSpline ? "spline" : "linal-regression",
      })
      scienceInfo = {
        width: specScience.imgWidth,
        height: specScience.imgHeight,
        analysis: result,
      }
      setScienceAnalysis({ ...scienceInfo })

      setSpectrumsData((prev) =>
        [
          ...prev.filter((s) => s.data.id !== specScience.id),
          { data: { ...specScience }, image: data, analysis: result },
        ].sort((a, b) => a.data.imgTop - b.data.imgTop || a.data.imgLeft - b.data.imgLeft),
      )
    }

    /** Procesa lamparas de comparación */
    for (const spectrum of spectrumsArr) {
      const saved = spectrumsData.find((s) => s.data.id === spectrum.id)
      if (
        saved &&
        spectrum.type === saved.data.type &&
        spectrum.imgTop === saved.data.imgTop &&
        spectrum.imgLeft === saved.data.imgLeft &&
        spectrum.imgWidth === saved.data.imgWidth &&
        spectrum.imgHeight === saved.data.imgHeight &&
        prevCountCheckpoints.current === countCheckpoints &&
        prevUseSpline.current === useSpline
      ) {
        continue
      }

      const canvas = document.createElement("canvas")
      canvas.width = spectrum.imgWidth
      canvas.height = spectrum.imgHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        notifyError("Failed to create canvas context for spectrum image.")
        return
      }
      ctx.filter = "grayscale(1)"
      ctx.drawImage(
        observationImage,
        spectrum.imgLeft,
        spectrum.imgTop,
        spectrum.imgWidth,
        spectrum.imgHeight,
        0,
        0,
        spectrum.imgWidth,
        spectrum.imgHeight,
      )
      const data = new Uint8Array(
        ctx.getImageData(0, 0, spectrum.imgWidth, spectrum.imgHeight, {}).data.buffer,
      )
      canvas.remove()

      /** Extraer caracteristicas */
      //   const result: extractSpectrumResponse = extractLamp({
      //     science: {
      //       width: scienceInfo!.width,
      //       height: scienceInfo!.height!,
      //       mediasPoints: scienceInfo!.analysis.mediasPoints,
      //       opening: scienceInfo!.analysis.opening,
      //       rectFunction: scienceInfo!.analysis.rectFunction,
      //       transversalAvgs: scienceInfo!.analysis.transversalAvgs,
      //     },
      //     lamp: data,
      //     width: spectrum.imgWidth,
      //     height: spectrum.imgHeight,
      //     countCheckpoints,
      //     segmentWidth: segmentWidth,
      //     fitFunction: useSpline ? "spline" : "linal-regression",
      //   })
      const result: extractSpectrumResponse = extractScience({
        science: data,
        width: spectrum.imgWidth,
        height: spectrum.imgHeight,
        countCheckpoints,
        segmentWidth: segmentWidth,
        fitFunction: useSpline ? "spline" : "linal-regression",
      })

      setSpectrumsData((prev) =>
        [
          ...prev.filter((s) => s.data.id !== spectrum.id),
          { data: { ...spectrum }, image: data, analysis: result },
        ].sort((a, b) => a.data.imgTop - b.data.imgTop || a.data.imgLeft - b.data.imgLeft),
      )
    }

    prevCountCheckpoints.current = countCheckpoints
    prevUseSpline.current = useSpline
    setState("ready")
  }, [
    observationId,
    observationImage,
    spectrums,
    spectrumsData.find,
    scienceAnalysis,
    segmentWidth,
    countCheckpoints,
    useSpline,
  ])

  return (
    <Card>
      <CardContent>
        {state === "waiting" && <span>Waiting definition of spectrums</span>}
        {state === "running" && <span className={cn("icon-[ph--spinner-bold] animate-spin")} />}
        {state === "ready" && (
          <>
            <div id="spectrum-extraction-controls" className="mb-4 ml-8 flex flex-row gap-16">
              <div id="count-checkpoints-control">
                <label className="flex flex-row gap-2">
                  <p>Count checkpoints: {tempCheckpoints}</p>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    step={1}
                    value={tempCheckpoints}
                    onChange={(e) => setTempCheckpoints(Number(e.target.value))}
                    onMouseUp={() => setCountCheckpoints(tempCheckpoints)}
                    onTouchEnd={() => setCountCheckpoints(tempCheckpoints)}
                  />
                </label>
              </div>
              <div id="use-spline-control">
                <label className="flex flex-row gap-2">
                  Use spline
                  <input
                    type="checkbox"
                    checked={tempUseSpline}
                    onChange={(e) => setTempUseSpline(e.target.checked)}
                    onPointerUp={() => setUseSpline(tempUseSpline)}
                  />
                </label>
              </div>
              {/* <div id="segment-width-control">
								<input
									type="range"
									min={10}
									max={200}
									step={1}
									value={segmentWidth}
									onChange={(e) => setSegmentWidth(Number(e.target.value))}
								/>
								<p>Segment width: {segmentWidth}</p>
							</div> */}
            </div>
            <hr />
            {spectrumsData.map((sd, i) => (
              <div key={`Spectrum Analysis ${sd.data.id}`}>
                <ImageWithPixelExtraction
                  title={`Spectrum ${i} (${sd.data.type})`}
                  image={`/spectrum/${sd.data.id}/image?ts=${Date.now()}`}
                  imageAlt="Pixel-by-pixel analysis of spectrum to extract spectrum function."
                  pointsWMed={sd.analysis.mediasPoints}
                  drawFunction={sd.analysis.rectFunction}
                  opening={sd.analysis.opening}
                />
                <SimpleFunctionXY data={sd.analysis.transversalAvgs} />
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
