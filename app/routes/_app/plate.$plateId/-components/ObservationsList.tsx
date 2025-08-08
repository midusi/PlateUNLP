import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
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
import type { Observation } from "../-actions/get-observations"
import { updateObservation } from "../-actions/update-observation"

function observationToBoundingBox(observation: Observation): BoundingBox {
  return {
    id: observation.id,
    name: observation.name,
    color: idToColor(observation.id),
    top: observation.imageTop,
    left: observation.imageLeft,
    width: observation.imageWidth,
    height: observation.imageHeight,
  }
}

export function ObservationsList({
  plateId,
  initialObservations,
}: {
  plateId: string
  initialObservations: Observation[]
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
    mutationFn: async (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => {
      const observation = await addObservation({ data: { ...boundingBox, plateId } })
      setBoundingBoxes((prev) => [observationToBoundingBox(observation), ...prev])
    },
    onError: (error) => notifyError("Error adding observation", error),
  })

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="grid h-[500px] grid-cols-[1fr_300px] p-0">
        <BoundingBoxer
          imageSrc={`/plate/${plateId}/preview`}
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
                imageTop: boundingBox.top,
                imageLeft: boundingBox.left,
                imageWidth: boundingBox.width,
                imageHeight: boundingBox.height,
              },
            })
          }}
          onBoundingBoxAdd={(boundingBox) => addObservationMut.mutate(boundingBox)}
        >
          <Button
            size="sm"
            variant="default"
            disabled={addObservationMut.isPending}
            onClick={() => notifyError("Not implemented yet")}
            className="h-7"
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
        </BoundingBoxer>
        <div className="border-l">
          <CardHeader className="p-2">
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <Separator />
          <Table>
            <TableBody>
              {boundingBoxes.map((boundingBox) => (
                <TableRow key={boundingBox.id}>
                  <TableCell className="font-medium"></TableCell>
                  <TableCell>
                    <Link
                      to="/observation/$observationId"
                      params={{ observationId: boundingBox.id }}
                    >
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
