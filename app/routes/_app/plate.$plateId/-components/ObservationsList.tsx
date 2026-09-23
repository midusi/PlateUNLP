import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import { notifyError } from "~/lib/notifications"
import { obsNFromIndex, obsNToIndex } from "~/lib/obs-n"
import { cn, idToColor } from "~/lib/utils"
import { addObservation } from "../-actions/add-observation"
import { addObservations } from "../-actions/add-observations"
import { deleteObservation } from "../-actions/delete-observation"
import { deleteObservations } from "../-actions/delete-observations"
import type { Observation } from "../-actions/get-observations"
import { getObservationDetections } from "../-actions/get-spectrums-detections"
import { updateObservation } from "../-actions/update-observation"

function generateSequentialLabel(index: number, prefix: string = "Obs."): string {
  const letter = String.fromCharCode(65 + (index % 26))
  const repetition = Math.floor(index / 26)
  const suffix = repetition > 0 ? `${repetition + 1}` : ""
  return `${prefix} ${letter}${suffix}`
}

function observationToBoundingBox(observation: Observation, index: number): BoundingBox {
  return {
    id: observation.id,
    name: observation.name,
    label: observation.name || generateSequentialLabel(index),
    color: idToColor(observation.id),
    top: observation.imageTop,
    left: observation.imageLeft,
    width: observation.imageWidth,
    height: observation.imageHeight,
  }
}

function getObsNFromLabel(label: string | undefined, boundingBoxes: BoundingBox[]): string {
  if (!label) return obsNFromIndex(boundingBoxes.length)
  
  // Intentar extraer índice del label secuencial "Obs. A", "Obs. B", etc.
  const match = label.match(/Obs\.\s+([A-Z])(?:(\d+))?/)
  if (match) {
    const letter = match[1]
    const repetition = match[2] ? parseInt(match[2]) - 1 : 0
    const extractedIndex = repetition * 26 + (letter.charCodeAt(0) - 65)
    return obsNFromIndex(extractedIndex)
  }
  
  // Si no es un label secuencial, devolver OBS-N actual o generar uno nuevo
  const idx = obsNToIndex(label)
  return idx >= 0 ? label : obsNFromIndex(boundingBoxes.length)
}

function sortByHeight(boxes: BoundingBox[]): BoundingBox[] {
  return [...boxes].sort((a, b) => (a.top ?? 0) - (b.top ?? 0))
}

export function ObservationsList({
  plateId,
  initialObservations,
}: {
  plateId: string
  initialObservations: Observation[]
}) {
  const router = useRouter()
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    sortByHeight(
      initialObservations.map((obs, idx) => observationToBoundingBox(obs, idx)),
    ),
  )
  const prevLabelsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const current: Record<string, string> = {}
    boundingBoxes.forEach((b) => (current[b.id] = b.name ?? b.label))    
    const prev = prevLabelsRef.current
    const changes: Array<{ id: string; prev?: string; curr?: string }> = []
    const keys = new Set([...Object.keys(prev), ...Object.keys(current)])
    keys.forEach((k) => {
      if (prev[k] !== current[k]) changes.push({ id: k, prev: prev[k], curr: current[k] })
    })
    prevLabelsRef.current = current
  }, [boundingBoxes])

  const deleteObservationMut = useMutation({
    mutationFn: async (observationId: string) => {
      await deleteObservation({ data: { observationId } })
      setBoundingBoxes((prev) => prev.filter((box) => box.id !== observationId))
    },
    onError: (error) => notifyError("Error deleting observation", error),
  })

  const deleteObservationsMut = useMutation({
    mutationFn: async (plateId: string) => {
      await deleteObservations({ data: { plateId } })
      setBoundingBoxes([])
    },
    onError: (error) => notifyError("Error deleting observations", error),
  })

  const addObservationMut = useMutation({
    mutationFn: async (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => {
      const observation = await addObservation({ data: { ...boundingBox, plateId } })
      setBoundingBoxes((prev) => sortByHeight([...prev, observationToBoundingBox(observation, prev.length)]))
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

      setBoundingBoxes(() => sortByHeight(observations_added.map((obs, idx) => observationToBoundingBox(obs, idx))))
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
          imageSrc={`/api/plate/${plateId}/preview`}
          boundingBoxes={boundingBoxes}
          onBoundingBoxChange={(boundingBox) => {
            setBoundingBoxes((prev) =>
              prev.map((box) => (box.id === boundingBox.id ? { ...box, ...boundingBox } : box)),
            )
          }}
          onBoundingBoxChangeEnd={async (boundingBox) => {
            try {
              const newName = boundingBox.label ?? boundingBox.name
              
              // Validar que no exista otro nombre igual
              const duplicateName = boundingBoxes.some(
                (box) => box.id !== boundingBox.id && (box.name ?? box.label) === newName
              )
              if (duplicateName) {
                notifyError("Error", new Error(`The name '${newName}' already exists in another observation. Please choose a unique name.`))
                return
              }
              
              // Generar OBS-N basado en el label
              const newObsN = getObsNFromLabel(newName, boundingBoxes)
              
              await updateObservation({
                data: {
                  observationId: boundingBox.id,
                  name: newName,
                  "OBS-N": newName,
                  imageTop: boundingBox.top,
                  imageLeft: boundingBox.left,
                  imageWidth: boundingBox.width,
                  imageHeight: boundingBox.height,
                },
              })
              router.invalidate()
            } catch (error) {
              notifyError("Error saving observation", error)
            }
          }}
          onBoundingBoxAdd={(boundingBox) => addObservationMut.mutate(boundingBox)}
          onBoundingBoxDelete={(id) => deleteObservationMut.mutate(id)}
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
          <Button
            size="sm"
            variant="destructive"
            title="Delete Observations"
            disabled={deleteObservationsMut.isPending || boundingBoxes.length === 0}
            onClick={() => {
              deleteObservationsMut.mutate(plateId)
            }}
            className="h-7 w-7 p-0"
          >
            <span className={cn(
              deleteObservationsMut.isPending
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
