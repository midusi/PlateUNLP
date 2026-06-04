import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

/** Scanner-derived defaults prefilled when a known scanner is picked. */
type ScannerDefaults = { SCANRES: string; SCANGAIN: string; SCANSOFT: string }

export type PlateMetadataSuggestions = {
  TELESCOPE: string[]
  INSTRUME: string[]
  DETECTOR: string[]
  OBSERVER: string[]
  SCANNER: string[]
  SCANSOFT: string[]
  SCANAUTH: string[]
  /** Per-scanner scan settings collected from other plates in the project. */
  scannerDefaults: Record<string, ScannerDefaults>
}

function distinct(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  )
}

/**
 * Aggregates existing plate metadata values across every plate in the same
 * project, to power the autocomplete suggestions on the plate metadata form.
 * Computed once on form load.
 */
export const getPlateMetadataSuggestions = createServerFn()
  .inputValidator(z.object({ plateId: z.string() }))
  .handler(async ({ data }): Promise<PlateMetadataSuggestions> => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
      columns: { projectId: true },
    })
    if (!plate) throw new Error(`Plate with id ${data.plateId} not found`)

    const plates = await db.query.plate.findMany({
      where: (p, { eq }) => eq(p.projectId, plate.projectId),
      columns: {
        TELESCOPE: true,
        INSTRUME: true,
        DETECTOR: true,
        OBSERVER: true,
        SCANNER: true,
        SCANRES: true,
        SCANGAIN: true,
        SCANSOFT: true,
        SCANAUTH: true,
      },
    })

    const scannerDefaults: Record<string, ScannerDefaults> = {}
    for (const p of plates) {
      const scanner = p.SCANNER.trim()
      if (!scanner) continue
      let entry = scannerDefaults[scanner]
      if (!entry) {
        entry = { SCANRES: "", SCANGAIN: "", SCANSOFT: "" }
        scannerDefaults[scanner] = entry
      }
      if (!entry.SCANRES && p.SCANRES.trim()) entry.SCANRES = p.SCANRES
      if (!entry.SCANGAIN && p.SCANGAIN.trim()) entry.SCANGAIN = p.SCANGAIN
      if (!entry.SCANSOFT && p.SCANSOFT.trim()) entry.SCANSOFT = p.SCANSOFT
    }

    return {
      TELESCOPE: distinct(plates.map((p) => p.TELESCOPE)),
      INSTRUME: distinct(plates.map((p) => p.INSTRUME)),
      DETECTOR: distinct(plates.map((p) => p.DETECTOR)),
      OBSERVER: distinct(plates.map((p) => p.OBSERVER)),
      SCANNER: distinct(plates.map((p) => p.SCANNER)),
      SCANSOFT: distinct(plates.map((p) => p.SCANSOFT)),
      SCANAUTH: distinct(plates.map((p) => p.SCANAUTH)),
      scannerDefaults,
    }
  })

export const getPlateMetadataSuggestionsQueryOptions = (plateId: string) =>
  queryOptions({
    queryKey: ["plate", "metadata-suggestions", plateId],
    queryFn: () => getPlateMetadataSuggestions({ data: { plateId } }),
  })
