import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { notifyError } from "~/lib/notifications"
import { cn, idxToColor } from "~/lib/utils"
import { classesSpectrumDetection } from "~/types/BBClasses"
import { addObservation } from "../-actions/add-observation"
import type { Observation } from "../-actions/get-observations"
import { updateObservation } from "../-actions/update-observation"
import { getProjectName } from "../../project.$projectId/-actions/get-project-name"
import { getObservationDetections } from "../-actions/get-observations-detections"

function observationToBoundingBox(observation: Observation): BoundingBox {
  return {
    id: observation.id,
    name: observation.name,
    color: "red",
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
    initialObservations.map((obs, idx) => {
      return {
        ...observationToBoundingBox(obs),
        color: idxToColor(idx),
      }
    }),
  )

  const addObservationMut = useMutation({
    mutationFn: async (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => {
      const observation = await addObservation({ data: { ...boundingBox, plateId } })
      setBoundingBoxes((prev) => [observationToBoundingBox(observation), ...prev])
    },
    onError: (error) => notifyError("Error adding observation", error),
  })

  const getObservationsDetectionsMut = useMutation({
    mutationFn: async (plateId: string) => {
      
      return await getObservationDetections({ data: { plateId } })
      //setBoundingBoxes((prev) => [observationToBoundingBox(observation), ...prev])
    },
    onSuccess: (detections) => {
      console.log("Detections obtained:", detections)
    },
    onError: (error) => notifyError("Error obtainging observations detections", error),
  })


  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="h-[500px] p-0">
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
          showBBList={true}
        >
          <Button
            size="sm"
            variant="default"
            disabled={addObservationMut.isPending || getObservationsDetectionsMut.isPending}
            onClick={() => {
              getObservationsDetectionsMut.mutate(plateId)
            }}
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
      </CardContent>
    </Card>
  )
}
