import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table"
import { usePredictBBs } from "~/hooks/use-predict-BBs"
import { notifyError } from "~/lib/notifications"
import { cn, idToColor } from "~/lib/utils"
import { classesSpectrumDetection } from "~/types/BBClasses"
import { addSpectrum } from "../-actions/add-spectrum"
import { addSpectrums } from "../-actions/add-spectrums"
import type { getSpectrums } from "../-actions/get-spectrums"
import { updateSpectrum } from "../-actions/update-spectrum"

export type Spectrum = Awaited<ReturnType<typeof getSpectrums>>[number]

export function spectrumToBoundingBox(spectrum: Spectrum): BoundingBox {
  return {
    id: spectrum.id,
    name: "",
    color: idToColor(spectrum.id),
    top: spectrum.imgTop,
    left: spectrum.imgLeft,
    width: spectrum.imgWidth,
    height: spectrum.imgHeight,
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
    1088,
    "spectrum_part_segmentator.onnx",
    classesSpectrumDetection,
    false,
    0.7,
  )

  const determineBBMut = useMutation({
    mutationFn: async () => {
      /** Obtener ancho de la imagen */
      const img = new Image()
      img.src = `/observation/${observationId}/image`
      img.onload = async () => {
        /** Obtener predicciones */
        const boundingBoxes = await determineBBFunction(`/observation/${observationId}/image`)
        /** Actualizar base de datos */
        const science = {
          imgTop: boundingBoxes[0].y,
          imgLeft: 0, // Forzar ancho maximo
          imgWidth: img.naturalWidth, // Forzar ancho maximo
          imgHeight: boundingBoxes[0].height,
        }
        const lamp1 = {
          imgTop: boundingBoxes[1].y,
          imgLeft: 0, // Forzar ancho maximo
          imgWidth: img.naturalWidth, // Forzar ancho maximo
          imgHeight: boundingBoxes[1].height,
        }
        const lamp2 = {
          imgTop: boundingBoxes[2].y,
          imgLeft: 0, // Forzar ancho maximo
          imgWidth: img.naturalWidth, // Forzar ancho maximo
          imgHeight: boundingBoxes[2].height,
        }
        const newSpectrums = await addSpectrums({ data: { observationId, science, lamp1, lamp2 } })
        router.invalidate()
        const boundingBoxesFormated = [
          spectrumToBoundingBox(newSpectrums.science),
          spectrumToBoundingBox(newSpectrums.lamp1),
          spectrumToBoundingBox(newSpectrums.lamp2),
        ]
        setBoundingBoxes((prev) => [...boundingBoxesFormated, ...prev])
      }
    },
    onError: (error) => notifyError("Error determine bounding boxes", error),
  })

  const addSpectrumMut = useMutation({
    mutationFn: async () => {
      const spectrum = await addSpectrum({ data: { observationId } })
      setBoundingBoxes((prev) => [spectrumToBoundingBox(spectrum), ...prev])
    },
    onError: (error) => notifyError("Error adding spectrum", error),
  })

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid h-[500px] grid-cols-[1fr_300px] p-0">
        <BoundingBoxer
          imageSrc={`/observation/${observationId}/image`}
          boundingBoxes={boundingBoxes}
          onBoundingBoxChange={(boundingBox) => {
            setBoundingBoxes((prev) =>
              prev.map((box) => (box.id === boundingBox.id ? { ...box, ...boundingBox } : box)),
            )
          }}
          onBoundingBoxChangeEnd={async (boundingBox) => {
            await updateSpectrum({
              data: {
                spectrumId: boundingBox.id,
                imgTop: boundingBox.top,
                imgLeft: boundingBox.left,
                imgWidth: boundingBox.width,
                imgHeight: boundingBox.height,
              },
            })
            router.invalidate()
          }}
        />
        <div className="border-l">
          <CardHeader className="p-2">
            <CardTitle>Spectrums</CardTitle>
            <div className="flex items-center justify-evenly">
              <Button
                size="sm"
                disabled={addSpectrumMut.isPending || determineBBMut.isPending}
                onClick={() => determineBBMut.mutate()}
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
                variant="secondary"
                disabled={addSpectrumMut.isPending || determineBBMut.isPending}
                onClick={() => addSpectrumMut.mutate()}
              >
                <span
                  className={cn(
                    addSpectrumMut.isPending
                      ? "icon-[ph--spinner-bold] animate-spin"
                      : "icon-[ph--plus-bold]",
                  )}
                />
                Add
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <Table>
            <TableBody>
              {boundingBoxes.map((boundingBox) => (
                <TableRow key={boundingBox.id}>
                  <TableCell className="font-medium"></TableCell>
                  <TableCell>{boundingBox.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
