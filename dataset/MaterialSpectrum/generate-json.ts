/**
 * @fileoverview Transform the raw theoretical data into a more usable format.
 */

import fs from "node:fs/promises"
import { parse } from "@std/csv/parse"

type SpectrumPoint = { wavelength: number; material: string; intensity: number }
type Spectrum = { id: string; name: string; points: SpectrumPoint[] }

const spectrums = new URL("./", import.meta.url)

// NIST
// ============================================================================
const nistRaw = await fs.readFile(new URL("./NIST/Tabla(NIST)_Int_Long_Mat_Ref.csv", spectrums), {
  encoding: "utf-8",
})
const nist = parse(nistRaw, { skipFirstRow: true })
  .map(
    (row): SpectrumPoint => ({
      wavelength: Number.parseFloat(row["Wavelength(Ams)"]),
      material: row.Spectrum,
      intensity: Number.parseInt(row.Intensity.replace(/\D/g, ""), 10) ?? -1,
    }),
  )
  .filter((point) => point.intensity > 0)

const generated = new URL("../app/src/generated/", import.meta.url)
await fs.mkdir(generated, { recursive: true })

// LIBS
// ============================================================================
async function parseLibs(resolution: number) {
  const raw = await fs.readFile(
    new URL(`./LIBS/LIBS_He_Ar_Ne_Resolution=${resolution}.csv`, spectrums),
    { encoding: "utf-8" },
  )
  const parsed = parse(raw, { skipFirstRow: true })
  return parsed.map(
    (row): SpectrumPoint => ({
      wavelength: Number.parseInt(row["Wavelength (Å)"], 10),
      material: "HeArNe",
      intensity: Number.parseFloat(row.Sum),
    }),
  )
}
const libs100 = await parseLibs(100)
const libs260 = await parseLibs(260)

const datasets: Spectrum[] = [
  {
    id: "nist",
    name: "NIST",
    points: nist,
  },
  {
    id: "libs100",
    name: "LIBS (Res=100)",
    points: libs100,
  },
  {
    id: "libs260",
    name: "LIBS (Res=260)",
    points: libs260,
  },
]

const json = {
  date: new Date().toISOString(),
  elements: [
    ...new Set(datasets.map((dataset) => dataset.points.map((point) => point.material)).flat(2)),
  ].sort(),
  datasets,
}
await fs.writeFile(new URL("./spectrums.json", spectrums), JSON.stringify(json))

console.log("Generado el archivo spectrums.json")
