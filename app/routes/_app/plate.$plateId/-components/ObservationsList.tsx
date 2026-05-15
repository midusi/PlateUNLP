import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { formatObservation } from "~/lib/format"
import { notifyError } from "~/lib/notifications"
import { cn, idxToColor } from "~/lib/utils"
import { addObservation } from "../-actions/add-observation"
import { addObservations } from "../-actions/add-observations"
import type { Observation } from "../-actions/get-observations"
import { getObservationDetections } from "../-actions/get-observations-detections"
import { updateObservation } from "../-actions/update-observation"

function observationToBoundingBox(observation: Observation): BoundingBox {
  return {
    id: observation.id,
    name: observation.name,
    label: formatObservation(observation),
    color: "red",
    top: observation.imageTop,
    left: observation.imageLeft,
    width: observation.imageWidth,
    height: observation.imageHeight,
  }
}

function sortByLabel(boxes: BoundingBox[]): BoundingBox[] {
  return [...boxes].sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))
}

export function ObservationsList({
  plateId,
  initialObservations,
}: {
  plateId: string
  initialObservations: Observation[]
}) {
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    sortByLabel(
      initialObservations.map((obs, idx) => ({
        ...observationToBoundingBox(obs),
        color: idxToColor(idx),
      })),
    ),
  )

  const addObservationMut = useMutation({
    mutationFn: async (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => {
      const observation = await addObservation({ data: { ...boundingBox, plateId } })
      setBoundingBoxes((prev) => sortByLabel([...prev, observationToBoundingBox(observation)]))
    },
    onError: (error) => notifyError("Error adding observation", error),
  })

  const getObservationsDetectionsMut = useMutation({
    mutationFn: async (plateId: string) => {
      /** Detectar de observaciones */
      const observations = await getObservationDetections({ data: { plateId } })
      /** Salta error si algo impide que el proceso finalice */
      if (observations instanceof Response) {
        const errorText = await observations.text()
        throw new Error(errorText || "Error en la detección")
      }

      /** Agregar observaciones en la DB */
      const observations_added = await addObservations({
        data: {
          plateId,
          resetExisting: true, // Elimina observaciones previas para evitar solapamientos/confusiones
          observations: observations.map((obs) => ({
            top: Math.round(obs.imageTop),
            left: Math.round(obs.imageLeft),
            width: Math.round(obs.imageWidth),
            height: Math.round(obs.imageHeight),
          })),
        },
      })

      setBoundingBoxes(() => sortByLabel(observations_added.map(observationToBoundingBox)))
      return observations
    },
    onSuccess: (detections) => {
      console.log("Detections obtained:", detections)
    },
    onError: (error) => notifyError("Error obtainging observations detections", error),
  })

  return (
    <Card className="overflow-hidden p-0">
      <CardContent className="h-125 p-0">
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
