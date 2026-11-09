import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { usePredictBBs } from "~/hooks/use-predict-BBs"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import { classesSpectrumPartSegmentation } from "~/types/BBClasses"
import type { BoundingBox as DetectedBox } from "~/types/BoundingBox"
import { addSpectrum } from "../-actions/add-spectrum"
import { addSpectrums } from "../-actions/add-spectrums"
import { deleteSpectrum } from "../-actions/delete-spectrum"
import { updateSpectrum } from "../-actions/update-spectrum"
import { pickSpectrumRoles } from "../-utils/pick-spectrum-roles"


export type Spectrum = {
  type: "lamp" | "science"
  id: string
  imageWidth: number
  imageHeight: number
  imageLeft: number
  imageTop: number
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
    0.5,
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
      const toExtent = (box: DetectedBox) => ({
        imageTop: Math.round(box.y),
        imageLeft: 0,
        imageWidth: img.naturalWidth,
        imageHeight: Math.round(box.height),
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
          showImageAdjustActions
          onBoundingBoxChange={(changedBox) => {
            setBoundingBoxes((prev) => {
              const activeBoxPrev = prev.find((b) => b.id === changedBox.id);
              const newLeft = changedBox.left ?? activeBoxPrev?.left ?? 0;
              const newWidth = changedBox.width ?? activeBoxPrev?.width ?? 0;

              return prev.map((box) => ({
                ...box,
                ...(box.id === changedBox.id ? changedBox : {}),
                left: newLeft,
                width: newWidth,
              }));
            });
          }}
          onBoundingBoxChangeEnd={async (changedBox) => {
            const activeBox = boundingBoxes.find((b) => b.id === changedBox.id);
            const finalLeft = changedBox.left ?? activeBox?.left ?? 0;
            const finalWidth = changedBox.width ?? activeBox?.width ?? 0;

            await Promise.all(
              boundingBoxes.map((box) => {
                const finalTop = box.id === changedBox.id ? (changedBox.top ?? box.top) : box.top;
                const finalHeight = box.id === changedBox.id ? (changedBox.height ?? box.height) : box.height;

                return updateSpectrum({
                  data: {
                    spectrumId: box.id,
                    imageTop: Math.round(finalTop),
                    imageHeight: Math.round(finalHeight),
                    imageLeft: Math.round(finalLeft),
                    imageWidth: Math.round(finalWidth),
                  },
                });
              })
            );
            router.invalidate();
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
