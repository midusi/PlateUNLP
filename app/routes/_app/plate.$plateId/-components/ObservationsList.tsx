import { useMutation } from "@tanstack/react-query"
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
import { addObservation } from "../-actions/add-observation"
import type { getObservations } from "../-actions/get-observations"
import { updateObservation } from "../-actions/update-observation"
import { Link } from "@tanstack/react-router"

type Observation = Awaited<ReturnType<typeof getObservations>>[number]

function observationToBoundingBox(observation: Observation): BoundingBox {
  return {
    id: observation.id,
    name: observation.name,
    color: idToColor(observation.id),
    top: observation.imgTop,
    left: observation.imgLeft,
    width: observation.imgWidth,
    height: observation.imgHeight,
  }
}

export function ObservationsList({
  plateId,
  initialObservations,
}: {
  plateId: string
  initialObservations: Awaited<ReturnType<typeof getObservations>>
}) {
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    initialObservations.map(observationToBoundingBox),
  )

  const determineBBFunction = usePredictBBs(
    1024,
    "spectrum_detector.onnx",
    classesSpectrumDetection,
    false,
    0.7,
  )

  const addObservationMut = useMutation({
    mutationFn: async () => {
      const observation = await addObservation({ data: { plateId } })
      setBoundingBoxes((prev) => [observationToBoundingBox(observation), ...prev])
    },
    onError: (error) => notifyError("Error adding observation", error),
  })

  return (
    <Card className="p-0 overflow-hidden">
      <CardContent className="grid grid-cols-[1fr_300px] h-[500px] p-0">
        <BoundingBoxer
          imageSrc={`/plate/${plateId}/image`}
          boundingBoxes={boundingBoxes}
          onBoundingBoxChange={(boundingBox) => {
            setBoundingBoxes((prev) =>
              prev.map((box) => (box.id === boundingBox.id ? { ...box, ...boundingBox } : box)),
            )
          }}
          onBoundingBoxChangeEnd={(boundingBox) => {
            updateObservation({
              data: {
                observationId: boundingBox.id,
                name: boundingBox.name,
                imgTop: boundingBox.top,
                imgLeft: boundingBox.left,
                imgWidth: boundingBox.width,
                imgHeight: boundingBox.height,
              },
            })
          }}
        />
        <div className="border-l">
          <CardHeader className="p-2">
            <CardTitle>Observations</CardTitle>
            <div className="flex items-center justify-evenly">
              <Button
                size="sm"
                disabled={addObservationMut.isPending}
                onClick={() => notifyError("Not implemented yet")}
              >
                <span
                  className={cn(
                    addObservationMut.isPending
                      ? "icon-[ph--spinner-bold] animate-spin"
                      : "icon-[ph--magic-wand-bold]",
                  )}
                />
                Autodetect
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={addObservationMut.isPending}
                onClick={() => addObservationMut.mutate()}
              >
                <span
                  className={cn(
                    addObservationMut.isPending
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
                  <TableCell>
                    <Link to="/observation/$observationId" params={{observationId:boundingBox.id}}>
                      {boundingBox.name}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
