import { createServerFn } from "@tanstack/react-start"
import { asc, eq, sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { calibration, observation, plate, spectrum } from "~/db/schema"

export type PlateProcessingStatusKey =
  | "plate-metadata"
  | "observation-metadata"
  | "spectrum-detection"
  | "signal-extraction"
  | "calibration"
  | "completed"

type ContinueTarget =
  | { type: "plate"; plateId: string }
  | { type: "observation"; observationId: string }
  | { type: "calibration"; observationId: string }

export type PlateProcessingStatus = {
  plateId: string
  statusKey: PlateProcessingStatusKey
  statusLabel: string
  statusRank: number
  stageProgress: number
  overallProgress: number
  continueTarget: ContinueTarget | null
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

const STAGE_META: Record<PlateProcessingStatusKey, { label: string; rank: number }> = {
  "plate-metadata": { label: "Plate metadata", rank: 0 },
  "observation-metadata": { label: "Observation metadata", rank: 1 },
  "spectrum-detection": { label: "Spectrum detection", rank: 2 },
  "signal-extraction": { label: "Signal extraction", rank: 3 },
  calibration: { label: "Calibration", rank: 4 },
  completed: { label: "Completed", rank: 5 },
}

function toPercent(value: number) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return Math.round(clamped * 10) / 10
}

function stageLabel(key: PlateProcessingStatusKey) {
  return STAGE_META[key].label
}

function statusRank(key: PlateProcessingStatusKey) {
  return STAGE_META[key].rank
}

function overallProgressFromStage(stage: PlateProcessingStatusKey, stageProgress: number) {
  const rank = statusRank(stage)
  if (stage === "completed") return 100
  return toPercent(((rank + stageProgress / 100) / 5) * 100)
}

function pickObservation(
  observations: ObservationProgress[],
  predicate: (o: ObservationProgress) => boolean,
) {
  return observations
    .filter(predicate)
    .sort((a, b) => {
      if (a.metadataCompletion !== b.metadataCompletion) {
        return a.metadataCompletion - b.metadataCompletion
      }
      return a.obsN.localeCompare(b.obsN)
    })[0]
}

function plateContinueTarget(plateId: string): ContinueTarget {
  return { type: "plate", plateId }
}

function observationContinueTarget(
  plateId: string,
  observationId: string | undefined,
  type: "observation" | "calibration" = "observation",
): ContinueTarget {
  if (!observationId) return plateContinueTarget(plateId)
  return { type, observationId }
}

function buildPlateStatus(params: {
  plateId: string
  stage: PlateProcessingStatusKey
  stageProgress: number
  continueTarget: ContinueTarget | null
}): PlateProcessingStatus {
  const stageProgress = toPercent(params.stageProgress)

  return {
    plateId: params.plateId,
    statusKey: params.stage,
    statusLabel: stageLabel(params.stage),
    statusRank: statusRank(params.stage),
    stageProgress,
    overallProgress: overallProgressFromStage(params.stage, stageProgress),
    continueTarget: params.continueTarget,
  }
}

function getPlateStatus(plateRow: { id: string; metadataCompletion: number }, observations: ObservationProgress[]) {
  const plateMetadataCompletion = toPercent(plateRow.metadataCompletion)

  if (plateMetadataCompletion < 100) {
    return buildPlateStatus({
      plateId: plateRow.id,
      stage: "plate-metadata",
      stageProgress: plateMetadataCompletion,
      continueTarget: plateContinueTarget(plateRow.id),
    })
  }

  const countObservations = observations.length

  if (countObservations === 0) {
    return buildPlateStatus({
      plateId: plateRow.id,
      stage: "spectrum-detection",
      stageProgress: 0,
      continueTarget: plateContinueTarget(plateRow.id),
    })
  }

  const minObservationMetadata = toPercent(
    observations.reduce((min, current) => Math.min(min, current.metadataCompletion), 100),
  )
  if (minObservationMetadata < 100) {
    const nextObservation = pickObservation(observations, (o) => o.metadataCompletion < 100)
    return buildPlateStatus({
      plateId: plateRow.id,
      stage: "observation-metadata",
      stageProgress: minObservationMetadata,
      continueTarget: observationContinueTarget(plateRow.id, nextObservation?.id),
    })
  }

  const observationsWithDetectedSpectra = observations.filter((o) => o.spectrumCount > 0).length
  const detectionProgress = toPercent((observationsWithDetectedSpectra / countObservations) * 100)
  if (observationsWithDetectedSpectra < countObservations) {
    const nextObservation = pickObservation(observations, (o) => o.spectrumCount === 0)
    return buildPlateStatus({
      plateId: plateRow.id,
      stage: "spectrum-detection",
      stageProgress: detectionProgress,
      continueTarget: observationContinueTarget(plateRow.id, nextObservation?.id),
    })
  }

  const observationsWithExtractedSignal = observations.filter((o) => o.extractedSpectrumCount > 0).length
  const extractionProgress = toPercent((observationsWithExtractedSignal / countObservations) * 100)
  if (observationsWithExtractedSignal < countObservations) {
    const nextObservation = pickObservation(observations, (o) => o.extractedSpectrumCount === 0)
    return buildPlateStatus({
      plateId: plateRow.id,
      stage: "signal-extraction",
      stageProgress: extractionProgress,
      continueTarget: observationContinueTarget(plateRow.id, nextObservation?.id),
    })
  }

  const calibratedObservations = observations.filter((o) => o.calibratedWithPoints).length
  const calibrationProgress = toPercent((calibratedObservations / countObservations) * 100)
  if (calibratedObservations < countObservations) {
    const nextObservation = pickObservation(observations, (o) => !o.calibratedWithPoints)
    return buildPlateStatus({
      plateId: plateRow.id,
      stage: "calibration",
      stageProgress: calibrationProgress,
      continueTarget: observationContinueTarget(plateRow.id, nextObservation?.id, "calibration"),
    })
  }

  return buildPlateStatus({
    plateId: plateRow.id,
    stage: "completed",
    stageProgress: 100,
    continueTarget: null,
  })
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
          extractedSpectrumCount:
            sql<number>`sum(case when json_array_length(${spectrum.intensityArr}) > 0 then 1 else 0 end)`,
          calibratedWithPoints:
            sql<number>`max(case when ${calibration.id} is not null and json_array_length(${calibration.lampPoints}) > 0 and json_array_length(${calibration.materialPoints}) > 0 then 1 else 0 end)`,
        })
        .from(observation)
        .innerJoin(plate, eq(plate.id, observation.plateId))
        .leftJoin(spectrum, eq(spectrum.observationId, observation.id))
        .leftJoin(calibration, eq(calibration.observationId, observation.id))
        .where(eq(plate.projectId, data.projectId))
        .groupBy(observation.id, observation.plateId, observation["OBS-N"], observation.metadataCompletion)
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
      getPlateStatus(plateRow, observationsByPlate.get(plateRow.id) ?? []),
    )
  })