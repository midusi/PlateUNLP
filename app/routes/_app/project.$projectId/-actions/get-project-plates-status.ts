import { createServerFn } from "@tanstack/react-start"
import { asc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { calibration, observation, plate, spectrum } from "~/db/schema"

export type CircleState = "empty" | "partial" | "done"

export type ObservationStatus = {
  id: string
  obsN: string
  metadata: CircleState // O
  extraction: CircleState // E
  calibration: CircleState // C
}

export type PlateStatus = {
  plateId: string
  plateMetadata: CircleState // P
  observations: ObservationStatus[]
  sortRank: number
}

type ObservationProgress = {
  id: string
  plateId: string
  metadataCompletion: number
  obsN: string
  spectrumCount: number
  extractedSpectrumCount: number
  calibratedWithPoints: boolean
}

function toPercent(value: number) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return Math.round(clamped * 10) / 10
}

function metadataCircle(completion: number): CircleState {
  const pct = toPercent(completion)
  if (pct === 0) return "empty"
  if (pct < 100) return "partial"
  return "done"
}

function extractionCircle(o: ObservationProgress): CircleState {
  if (o.extractedSpectrumCount > 0) return "done"
  if (o.spectrumCount > 0) return "partial"
  return "empty"
}

function calibrationCircle(o: ObservationProgress): CircleState {
  return o.calibratedWithPoints ? "done" : "empty"
}

function computeSortRank(plateMetadata: CircleState, observations: ObservationStatus[]): number {
  if (plateMetadata !== "done") return 0
  if (observations.length === 0) return 1
  if (observations.some((o) => o.metadata !== "done")) return 1
  if (observations.some((o) => o.extraction !== "done")) return 2
  if (observations.some((o) => o.calibration !== "done")) return 3
  return 4
}

function buildPlateStatus(
  plateRow: { id: string; metadataCompletion: number },
  observations: ObservationProgress[],
): PlateStatus {
  const plateMetadata = metadataCircle(plateRow.metadataCompletion)

  const obsStatuses: ObservationStatus[] = observations.map((o) => ({
    id: o.id,
    obsN: o.obsN,
    metadata: metadataCircle(o.metadataCompletion),
    extraction: extractionCircle(o),
    calibration: calibrationCircle(o),
  }))

  return {
    plateId: plateRow.id,
    plateMetadata,
    observations: obsStatuses,
    sortRank: computeSortRank(plateMetadata, obsStatuses),
  }
}

export const getProjectPlatesStatus = createServerFn()
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => {
    const [projectPlates, observations] = await Promise.all([
      db.query.plate.findMany({
        where: (t, { eq }) => eq(t.projectId, data.projectId),
        columns: {
          id: true,
          metadataCompletion: true,
        },
      }),
      db
        .select({
          id: observation.id,
          plateId: observation.plateId,
          obsN: observation["OBS-N"],
          metadataCompletion: observation.metadataCompletion,
          spectrumCount: sql<number>`count(${spectrum.id})`,
          extractedSpectrumCount: sql<number>`sum(case when json_array_length(${spectrum.intensityArr}) > 0 then 1 else 0 end)`,
          calibratedWithPoints: sql<number>`max(case when ${calibration.id} is not null and json_array_length(${calibration.lampPoints}) > 0 and json_array_length(${calibration.materialPoints}) > 0 then 1 else 0 end)`,
        })
        .from(observation)
        .innerJoin(plate, eq(plate.id, observation.plateId))
        .leftJoin(spectrum, eq(spectrum.observationId, observation.id))
        .leftJoin(calibration, eq(calibration.observationId, observation.id))
        .where(eq(plate.projectId, data.projectId))
        .groupBy(
          observation.id,
          observation.plateId,
          observation["OBS-N"],
          observation.metadataCompletion,
        )
        .orderBy(asc(observation["OBS-N"])),
    ])

    const observationsByPlate = new Map<string, ObservationProgress[]>()
    for (const row of observations) {
      if (!observationsByPlate.has(row.plateId)) {
        observationsByPlate.set(row.plateId, [])
      }

      observationsByPlate.get(row.plateId)!.push({
        id: row.id,
        plateId: row.plateId,
        obsN: row.obsN,
        metadataCompletion: row.metadataCompletion,
        spectrumCount: Number(row.spectrumCount) || 0,
        extractedSpectrumCount: Number(row.extractedSpectrumCount) || 0,
        calibratedWithPoints: Number(row.calibratedWithPoints) > 0,
      })
    }

    return projectPlates.map((plateRow) =>
      buildPlateStatus(plateRow, observationsByPlate.get(plateRow.id) ?? []),
    )
  })
