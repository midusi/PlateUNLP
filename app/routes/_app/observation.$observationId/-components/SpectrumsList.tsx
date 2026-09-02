import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { usePredictBBs } from "~/hooks/use-predict-BBs"
import { notifyError } from "~/lib/notifications"
import { cn, idToColor } from "~/lib/utils"
import { classesSpectrumDetection } from "~/types/BBClasses"
import { addSpectrum } from "../-actions/add-spectrum"
import { addSpectrums } from "../-actions/add-spectrums"
import { deleteSpectrum } from "../-actions/delete-spectrum"
import { updateSpectrum } from "../-actions/update-spectrum"


export type Spectrum = {
  type: "lamp" | "science"
  id: string
  imageWidth: number
  imageHeight: number
  imageLeft: number
  imageTop: number
}

export function spectrumToBoundingBox(spectrum: Spectrum): BoundingBox {
  console.log(spectrum.type);
  let color = spectrum.type == 'lamp' ? 'red' : 'green';
  return {
    id: spectrum.id,
    name: "",
    color: color,
    top: spectrum.imageTop,
    left: spectrum.imageLeft,
    width: spectrum.imageWidth,
    height: spectrum.imageHeight,
  }
}

export function SpectrumsList({
  observationId,
  initialSpectrums,
}: {
  observationId: string
  initialSpectrums: Spectrum[]
}) {
  const router = useRouter()

  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    initialSpectrums.map(spectrumToBoundingBox),
  )

  const determineBBFunction = usePredictBBs(
    640,
    "detect_observations.3.0.0.m.onnx",
    classesSpectrumDetection,
    false,
    0.7,
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
      if (!boundingBoxes || boundingBoxes.length < 3) {
        throw new Error("No se detectaron observaciones en la placa")
      }

      const science = {
        imageTop: Math.round(boundingBoxes[0].y),
        imageLeft: 0,
        imageWidth: img.naturalWidth,
        imageHeight: Math.round(boundingBoxes[0].height),
      }
      const lamp1 = {
        imageTop: Math.round(boundingBoxes[1].y),
        imageLeft: 0,
        imageWidth: img.naturalWidth,
        imageHeight: Math.round(boundingBoxes[1].height),
      }
      const lamp2 = {
        imageTop: Math.round(boundingBoxes[2].y),
        imageLeft: 0,
        imageWidth: img.naturalWidth,
        imageHeight: Math.round(boundingBoxes[2].height),
      }

      const newSpectrums = await addSpectrums({
        data: { observationId, science, lamp1, lamp2 },
      })
      router.invalidate()
      const boundingBoxesFormated = [
        spectrumToBoundingBox(newSpectrums.science),
        spectrumToBoundingBox(newSpectrums.lamp1),
        spectrumToBoundingBox(newSpectrums.lamp2),
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
      setBoundingBoxes((prev) => [spectrumToBoundingBox(spectrum), ...prev])
    },
    onError: (error) => notifyError("Error adding spectrum", error),
  })

  const deleteSpectrumMut = useMutation({
    mutationFn: async (spectrumId: string) => {
      await Promise.all(
        boundingBoxes.map((box) => deleteSpectrum({ data: { spectrumId: box.id } }))
      )
      setBoundingBoxes((prev) => ([]))
    },
    onError: (error) => notifyError("Error deleting spectrum", error),
  })

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="h-[500px] p-0">
        <BoundingBoxer
          imageSrc={`/api/observation/${observationId}/preview`}
          boundingBoxes={boundingBoxes}
          showBBList={false}
          onBoundingBoxChange={(boundingBox) => {
            setBoundingBoxes((prev) =>
              prev.map((box) => (box.id === boundingBox.id ? { ...box, ...boundingBox } : box)),
            )
          }}
          onBoundingBoxChangeEnd={async (boundingBox) => {
            await updateSpectrum({
              data: {
                spectrumId: boundingBox.id,
                imageTop: boundingBox.top,
                imageLeft: boundingBox.left,
                imageWidth: boundingBox.width,
                imageHeight: boundingBox.height,
              },
            })
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
            disabled={deleteSpectrumMut.isPending || boundingBoxes.length === 0}
            onClick={() => {
              deleteSpectrumMut.mutate(observationId)
            }}
            className="h-7 w-7 p-0"
          >
            <span className={cn(
              deleteSpectrumMut.isPending
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
