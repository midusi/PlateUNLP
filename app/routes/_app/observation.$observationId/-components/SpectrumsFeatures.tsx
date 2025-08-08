import { spec } from "node:test/reporters"
import * as tf from "@tensorflow/tfjs"
import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "~/components/ui/card"
import { extractScience, type extractSpectrumResponse } from "~/lib/extract-features"
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
  observationTensor,
}: {
  observationId: string
  spectrums: Awaited<ReturnType<typeof getSpectrums>>
  observationTensor: tf.Tensor2D
}) {
  const reuseScienceFunction = false

  const [useSpline, setUseSpline] = useState(false)
  const [tempUseSpline, setTempUseSpline] = useState(false)
  const prevUseSpline = useRef(false)

  const [tempCheckpoints, setTempCheckpoints] = useState(5)
  const [countCheckpoints, setCountCheckpoints] = useState(5)
  const prevCountCheckpoints = useRef(5)

  const [segmentWidth, setSegmentWidth] = useState(100)
  const prevSegmentWidth = useRef(100)
  const [state, setState] = useState<"waiting" | "running" | "ready">("waiting")

  // Crop and save the spectrum image to be analyzed
  const [spectrumsData, setSpectrumsData] = useState<
    {
      data: Spectrum
      analysis: extractSpectrumResponse
    }[]
  >([])

  useEffect(() => {
    if (!observationTensor) return

    if (spectrums.length === 0) return

    /** Coloca primero el espectro de ciencia */
    const indexSpectrum = spectrums.findIndex((s) => s.type === "science")
    const specScience = spectrums[indexSpectrum]
    const spectrumsArr = [...spectrums]
    spectrumsArr.splice(indexSpectrum, 1)

    /**
     * Contador ordenado de los espectros que fueron revisados hasta ahora (util para el orden
     * de aplicación de mascaras)
     */
    const specCounter: string[] = []

    /** Convertir imagen de observacion a Tensor4D Grey [1, H, W, 1] */
    let obsTensor = observationTensor.expandDims(0).expandDims(-1) as tf.Tensor4D

    /** Tensor de zeros, para la futura aplicacion de mascaras. */
    const zeros = tf.zerosLike(obsTensor)

    /** Arreglo con informacion cacheada de espectros procesados hasta ahora */
    let spectrumsDataCached = [...spectrumsData]

    /** Procesar todos los espectros del listado */
    spectrumsArr.unshift(specScience)
    for (const spectrum of spectrumsArr) {
      /**
       * Checkea si este es el primer espectro procesado en este bucle, si no lo es parchea el
       * tensor de la observación completa para no considerar la información de otros espectros
       * para el calculo de este.
       */
      if (specCounter.length !== 0) {
        const previusSpectrum = spectrumsDataCached.find(
          (s) => s.data.id === specCounter[specCounter.length - 1],
        )
        if (previusSpectrum) {
          const previusMask = previusSpectrum.analysis.spectrumMask // [1, imageH, imageW, 1]
          /** Expandir mascara a dimension de observación */
          const obsHeight = obsTensor.shape[1]
          const obsWidth = obsTensor.shape[2]
          const { imageTop, imageLeft, imageHeight, imageWidth } = previusSpectrum.data
          const top = Math.floor(imageTop)
          const left = Math.floor(imageLeft)
          const bottom = obsHeight - top - Math.floor(imageHeight)
          const right = obsWidth - left - Math.floor(imageWidth)
          const padArrays: Array<[number, number]> = [
            [0, 0], // batch agregados
            [top, bottom], // filas agregadas
            [left, right], // columnas agregadas
            [0, 0], // canales agregados
          ]
          const maskPadded = previusMask.pad(padArrays)
          obsTensor = zeros.where(maskPadded, obsTensor)
        }
      }

      /** Registrar el id del espectro que se procesa ahora. */
      specCounter.push(spectrum.id)

      /** Si no cambio ningun parametro de configuración entonces no hay que recalcular nada */
      const saved = spectrumsData.find((s) => s.data.id === spectrum.id)
      if (
        saved &&
        spectrum.type === saved.data.type &&
        spectrum.imageTop === saved.data.imageTop &&
        spectrum.imageLeft === saved.data.imageLeft &&
        spectrum.imageWidth === saved.data.imageWidth &&
        spectrum.imageHeight === saved.data.imageHeight &&
        prevCountCheckpoints.current === countCheckpoints &&
        prevUseSpline.current === useSpline
      ) {
        continue
      }

      /** Sebimagen que corresponde al espectro en forma de tensor */
      const top = Math.floor(spectrum.imageTop);
      const left = Math.floor(spectrum.imageLeft);
      const height = Math.floor(spectrum.imageHeight);
      const width = Math.floor(spectrum.imageWidth);
      const spectrumTensor = tf.slice(
        obsTensor,
        [0, top, left, 0],
        [1, height, width, obsTensor.shape[3]],
      )

      /** Extraer caracteristicas */
      const result: extractSpectrumResponse = extractScience({
        science: spectrumTensor,
        width: width,
        height: height,
        countCheckpoints,
        segmentWidth: segmentWidth,
        fitFunction: useSpline ? "spline" : "linal-regression",
      })

      spectrumsDataCached = [
        ...spectrumsDataCached.filter((s) => s.data.id !== spectrum.id),
        { data: { ...spectrum }, analysis: result },
      ]
    }
    spectrumsDataCached.sort(
      (a, b) => a.data.imageTop - b.data.imageTop || a.data.imageLeft - b.data.imageLeft,
    )
    setSpectrumsData(spectrumsDataCached)

    prevCountCheckpoints.current = countCheckpoints
    prevUseSpline.current = useSpline
    setState("ready")
  }, [
    observationId,
    spectrums,
    segmentWidth,
    countCheckpoints,
    useSpline,
    observationTensor,
    setSpectrumsData,
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
              {/* <div id="use-spline-control">
                <label className="flex flex-row gap-2">
                  Use spline
                  <input
                    type="checkbox"
                    checked={tempUseSpline}
                    onChange={(e) => setTempUseSpline(e.target.checked)}
                    onPointerUp={() => setUseSpline(tempUseSpline)}
                  />
                </label>
              </div> */}
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
                  image={{
                    url: `/observation/${observationId}/preview`,
                    width: sd.data.imageWidth,
                    height: sd.data.imageHeight,
                    top: sd.data.imageTop,
                    left: sd.data.imageLeft,
                  }}
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
