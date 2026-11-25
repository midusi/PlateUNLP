import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { type BoundingBox, type BoundingBoxChangeInfo, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { usePredictBBs } from "~/hooks/use-predict-BBs"
import { notifyError } from "~/lib/notifications"
import {
  boxFromExtent,
  type EndLines,
  endLinesOf,
  endLinesWithin,
  extendBoxToLines,
  meanAngle,
  type PlacedBox,
  rotatePlacedBox,
  toStoredGeometry,
} from "~/lib/oriented-box"
import { cn } from "~/lib/utils"
import { classesSpectrumPartSegmentation } from "~/types/BBClasses"
import type { BoundingBox as DetectedBox } from "~/types/BoundingBox"
import { addSpectrum } from "../-actions/add-spectrum"
import { addSpectrums } from "../-actions/add-spectrums"
import { deleteSpectrum } from "../-actions/delete-spectrum"
import { updateSpectrum } from "../-actions/update-spectrum"
import { updateSpectrumsTypes } from "../-actions/update-spectrums-types"
import { pickSpectrumRoles } from "../-utils/pick-spectrum-roles"


export type Spectrum = {
  type: "lamp" | "science"
  id: string
  imageWidth: number
  imageHeight: number
  imageLeft: number
  imageTop: number
  /** Caja orientada del espectro: sin estos datos es el propio rectangulo. */
  imageAngle?: number | null
}

export function spectrumToBoundingBox(spectrum: Spectrum, lampIndex?: number):
BoundingBox {
  let color = spectrum.type == 'lamp' ? 'red' : 'green';
  const label = spectrum.type === 'science'
    ? 'Science'
    : lampIndex !== undefined ? `Lamp ${lampIndex}` : 'Lamp'
  return {
    id: spectrum.id,
    name: "",
    label,
    color: color,
    top: spectrum.imageTop,
    left: spectrum.imageLeft,
    width: spectrum.imageWidth,
    height: spectrum.imageHeight,
    angle: spectrum.imageAngle ?? 0,
  }
}

/** La caja orientada que describe un `BoundingBox`: su centro es el de su rectangulo. */
function placedBoxOf(box: BoundingBox): PlacedBox {
  return {
    ...boxFromExtent(box.width, box.height, box.angle ?? 0),
    centerX: box.left + box.width / 2,
    centerY: box.top + box.height / 2,
  }
}

/**
 * Gira todas las cajas hasta el mismo angulo, cada una sobre su propio centro y conservando
 * sus extremos (se alargan o acortan sobre su eje). Si alguna llega al borde de la imagen
 * antes que el resto, el grupo entero se detiene donde se detiene la mas limitada.
 * `boxes` es el estado al empezar el arrastre, para no acumular redondeo.
 */
function rotateTogether(
  boxes: BoundingBox[],
  changed: BoundingBox,
  limits: { x: number; y: number },
): BoundingBox[] {
  const start = boxes.find((box) => box.id === changed.id) ?? changed
  const target = changed.angle ?? 0
  const turn = (box: BoundingBox, angle: number) =>
    rotatePlacedBox(placedBoxOf(box), angle, limits, true)

  // El angulo al que llega cada caja yendo hacia `target`; el grupo toma el mas cercano al inicial.
  const startAngle = start.angle ?? 0
  const group = boxes
    .map((box) => turn(box, target).angle)
    .reduce((best, angle) =>
      Math.abs(angle - startAngle) < Math.abs(best - startAngle) ? angle : best,
    )

  return boxes.map((box) => {
    const stored = toStoredGeometry(turn(box, group), limits, false)
    return {
      ...(box.id === changed.id ? changed : box),
      left: stored.imageLeft,
      top: stored.imageTop,
      width: stored.imageWidth,
      height: stored.imageHeight,
      angle: stored.imageAngle,
    }
  })
}

/**
 * Los espectros de una observacion comparten sus extremos: los tres empiezan y terminan
 * sobre dos rectas perpendiculares a la inclinacion promedio, no en la misma columna `x`.
 * Las lineas espectrales son perpendiculares a la dispersion, asi que asi la columna `i`
 * de cada espectro es la misma longitud de onda. Cada caja conserva su alto y su angulo, y
 * se alarga o acorta sobre su eje.
 *
 * - Si el usuario cambia los extremos (arrastra un borde izquierdo o derecho, o mueve la
 *   caja), las demas siguen las rectas de la modificada.
 * - Si cambia el alto de una caja, es ella la que vuelve a las rectas que tienen las demas.
 * - Si gira una caja, giran todas hasta el mismo angulo (`rotateTogether`).
 */
function shareEnds(
  boxes: BoundingBox[],
  changed: BoundingBox,
  info?: BoundingBoxChangeInfo,
): BoundingBox[] {
  const replace = () => boxes.map((box) => (box.id === changed.id ? changed : box))
  if (!info) return replace()
  const others = boxes.filter((box) => box.id !== changed.id)
  if (others.length === 0) return replace()
  if (info.action === "rotate") return rotateTogether(boxes, changed, info.limits)

  const horizontal =
    info.action === "move" || (info.action === "resize" && /[lr]/.test(info.dir ?? ""))
  const placedChanged = placedBoxOf(changed)
  const lines: EndLines = horizontal
    ? endLinesOf(placedChanged, meanAngle([placedChanged, ...others.map(placedBoxOf)]))
    : endLinesOf(placedBoxOf(others[0]), meanAngle(others.map(placedBoxOf)))

  /** `box` alargada hasta las rectas compartidas. */
  const onLines = (box: BoundingBox): BoundingBox => {
    const stored = toStoredGeometry(extendBoxToLines(placedBoxOf(box), lines), info.limits)
    return {
      ...box,
      left: stored.imageLeft,
      top: stored.imageTop,
      width: stored.imageWidth,
      height: stored.imageHeight,
      angle: stored.imageAngle,
    }
  }

  return boxes.map((box) => {
    if (box.id === changed.id) return horizontal ? changed : onLines(changed)
    return horizontal ? onLines(box) : box
  })
}

export function SpectrumsList({
  observationId,
  initialSpectrums,
}: {
  observationId: string
  initialSpectrums: Spectrum[]
}) {
  const router = useRouter()
  /** Cajas al empezar el arrastre en curso; `null` si no hay ninguno. */
  const dragStart = useRef<BoundingBox[] | null>(null)
  /** Ultima modificacion del arrastre en curso: que se estaba haciendo y los limites de la imagen. */
  const lastChange = useRef<BoundingBoxChangeInfo | undefined>(undefined)

  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    initialSpectrums.map((spectrum, i) => {
    const lampIndex = initialSpectrums
      .slice(0, i)
      .filter((s) => s.type === 'lamp')
      .length + 1
    return spectrumToBoundingBox(spectrum, spectrum.type === 'lamp' ? lampIndex : undefined)
    }),
  )

  useEffect(() => {
    setBoundingBoxes(
      initialSpectrums.map((spectrum, i) => {
        const lampIndex = initialSpectrums
          .slice(0, i)
          .filter((s) => s.type === "lamp")
          .length + 1
        return spectrumToBoundingBox(
          spectrum,
          spectrum.type === "lamp" ? lampIndex : undefined,
        )
      }),
    )
  }, [initialSpectrums])

  const determineBBFunction = usePredictBBs(
    640,
    "0.0.9.m.obb.components.cont2.onnx",
    classesSpectrumPartSegmentation,
    false,
    0.4,
  )

  const determineBBMut = useMutation({
    mutationFn: async () => {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error("No se pudo cargar la vista previa de la observación"))
        image.src = `/api/observation/${observationId}/preview`
      })

      const boundingBoxes = await determineBBFunction(observationId)
      const roles = pickSpectrumRoles(boundingBoxes ?? [])
      /**
       * Cada caja que predijo el modelo se alarga a lo largo de su eje, conservando su
       * inclinacion, hasta dos rectas compartidas perpendiculares a la inclinacion promedio,
       * lo mas separadas que permite el ancho de la observacion.
       */
      const placed = (box: DetectedBox): PlacedBox => ({
        ...boxFromExtent(box.width, box.height, box.angle),
        centerX: box.centerX,
        centerY: box.centerY,
      })
      const detected = [roles.science, roles.lamp1, roles.lamp2]
      const lines = endLinesWithin(detected.map(placed), img.naturalWidth)
      const toExtent = (box: DetectedBox) =>
        toStoredGeometry(extendBoxToLines(placed(box), lines), {
          x: img.naturalWidth,
          y: img.naturalHeight,
        })
      const science = toExtent(roles.science)
      const lamp1 = toExtent(roles.lamp1)
      const lamp2 = toExtent(roles.lamp2)

      const newSpectrums = await addSpectrums({
        data: { observationId, science, lamp1, lamp2 },
      })
      router.invalidate()
      const boundingBoxesFormated = [
        spectrumToBoundingBox(newSpectrums.science),
        spectrumToBoundingBox(newSpectrums.lamp1, 1),
        spectrumToBoundingBox(newSpectrums.lamp2, 2),
      ]
      setBoundingBoxes((prev) => [...boundingBoxesFormated])
    },
    onError: (error) => notifyError("Error determine bounding boxes", error),
  })

  const addSpectrumMut = useMutation({
    mutationFn: async (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => {
      const spectrum = await addSpectrum({
        data: { ...boundingBox, observationId },
      })
      setBoundingBoxes((prev) => {
        const lampCount = prev.filter((b) => b.color === 'red').length + 1
        return [spectrumToBoundingBox(spectrum, spectrum.type === 'lamp' ? lampCount : undefined), ...prev]
      })
    },
    onSuccess: () => router.invalidate(),
    onError: (error) => notifyError("Error adding spectrum", error),
  })

  /**
   * Borra solo el espectro indicado (la "x" de cada caja). Si era el de ciencia y quedan lámparas,
   * la más cercana a él pasa a ser el de ciencia: siempre tiene que haber uno.
   */
  const deleteSpectrumMut = useMutation({
    mutationFn: async (spectrumId: string) => {
      const deleted = boundingBoxes.find((box) => box.id === spectrumId)
      await deleteSpectrum({ data: { spectrumId } })

      if (deleted?.color !== "green") return { spectrumId, promotedId: null }
      const centerY = (box: BoundingBox) => box.top + box.height / 2
      const distance = (box: BoundingBox) => Math.abs(centerY(box) - centerY(deleted))
      const heir = boundingBoxes
        .filter((box) => box.id !== spectrumId && box.color === "red")
        .sort((a, b) => distance(a) - distance(b) || a.top - b.top)[0]
      if (!heir) return { spectrumId, promotedId: null }

      await updateSpectrumsTypes({ data: [{ id: heir.id, type: "science" }] })
      return { spectrumId, promotedId: heir.id }
    },
    onSuccess: ({ spectrumId, promotedId }) => {
      setBoundingBoxes((prev) =>
        prev
          .filter((box) => box.id !== spectrumId)
          .map((box) =>
            box.id === promotedId ? { ...box, color: "green", label: "Science" } : box,
          ),
      )
      router.invalidate()
    },
    onError: (error) => notifyError("Error deleting spectrum", error),
  })

  /** Borra todos los espectros de la observación (la escoba de la barra). */
  const clearSpectrumsMut = useMutation({
    mutationFn: async () => {
      await Promise.all(
        boundingBoxes.map((box) => deleteSpectrum({ data: { spectrumId: box.id } })),
      )
    },
    onSuccess: () => {
      setBoundingBoxes([])
      router.invalidate()
    },
    onError: (error) => notifyError("Error deleting spectrums", error),
  })

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="h-[500px] p-0">
        <BoundingBoxer
          imageSrc={`/api/observation/${observationId}/preview`}
          boundingBoxes={boundingBoxes}
          showBBList={false}
          keepEndLines
          showImageAdjustActions
          onBoundingBoxChange={(changedBox, info) => {
            // Las demas cajas se recalculan siempre desde su estado al empezar el arrastre: su
            // alto se deriva del rectangulo entero guardado, y rehacerlo en cada movimiento del
            // mouse acumula el redondeo hasta dejarlas con 1 px de alto.
            if (!dragStart.current) dragStart.current = boundingBoxes
            const base = dragStart.current
            lastChange.current = info
            setBoundingBoxes(() => shareEnds(base, changedBox, info))
          }}
          onBoundingBoxChangeEnd={async (changedBox) => {
            // Se rehace el calculo en vez de leer el estado: desde el campo de angulo, el cambio y
            // su fin llegan en el mismo instante y el estado todavia no tiene el cambio. Ademas la
            // caja modificada puede haber pedido mas de lo que el grupo permite.
            const final = shareEnds(dragStart.current ?? boundingBoxes, changedBox, lastChange.current)
            dragStart.current = null
            lastChange.current = undefined
            await Promise.all(
              final.map((box) =>
                updateSpectrum({
                  data: {
                    spectrumId: box.id,
                    imageTop: Math.round(box.top),
                    imageHeight: Math.round(box.height),
                    imageLeft: Math.round(box.left),
                    imageWidth: Math.round(box.width),
                    imageAngle: box.angle ?? 0,
                  },
                }),
              ),
            )
            router.invalidate()
          }}
          onBoundingBoxAdd={(boundingBox) => addSpectrumMut.mutate(boundingBox)}
          onBoundingBoxDelete={(id) => deleteSpectrumMut.mutate(id)}
        >
          <Button
            size="sm"
            variant="default"
            disabled={addSpectrumMut.isPending || determineBBMut.isPending}
            onClick={() => determineBBMut.mutate()}
            className="h-7"
          >
            <span
              className={cn(
                determineBBMut.isPending
                  ? "icon-[ph--spinner-bold] animate-spin"
                  : "icon-[ph--magic-wand-bold]",
              )}
            />
            Autodetect
          </Button>
          <Button
            size="sm"
            variant="destructive"
            title="Delete Observations"
            disabled={clearSpectrumsMut.isPending || boundingBoxes.length === 0}
            onClick={() => {
              clearSpectrumsMut.mutate()
            }}
            className="h-7 w-7 p-0"
          >
            <span className={cn(
              clearSpectrumsMut.isPending
                ? "icon-[ph--spinner-bold] animate-spin"
                : "icon-[ph--broom] text-base"
            )} />
            <span className="sr-only">Delete Observations</span>
          </Button>
        </BoundingBoxer>
      </CardContent>
    </Card>
  )
}
