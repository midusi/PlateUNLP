import fs from "node:fs"
import { parse } from "csv/sync"

/**
 * @fileoverview Transform the raw theoretical data into a more usable format.
 *
 * @typedef {{wavelength: number; material: string; intensity: number}} SpectrumPoint
 * @typedef {{id: string; name: string; points: SpectrumPoint[]}} Spectrum
 */

const spectrums = new URL("../db/MaterialSpectrum/", import.meta.url)

// NIST
// ============================================================================
const nistRaw = fs.readFileSync(
  new URL("NIST/Tabla(NIST)_Int_Long_Mat_Ref.csv", spectrums),
)
const nist = parse(nistRaw, { from: 2 })
  .map(
    /** @returns {SpectrumPoint} one point */
    row => ({
      wavelength: Number.parseFloat(row[1]),
      material: row[2],
      intensity: Number.parseInt(row[0].replace(/\D/g, "")) ?? -1,
    }),
  )
  .filter(point => point.intensity > 0)

const generated = new URL("../app/src/generated/", import.meta.url)
fs.mkdirSync(generated, { recursive: true })

// LIBS
// ============================================================================
function parseLibs(resolution) {
  const raw = fs.readFileSync(
    new URL(`LIBS/LIBS_He_Ar_Ne_Resolution=${resolution}.csv`, spectrums),
  )
  const parsed = parse(raw, { from: 2 })
  return parsed.map(
    /** @returns {SpectrumPoint} one point */
    row => ({
      wavelength: Number.parseInt(row[0]),
      material: "HeArNe",
      intensity: Number.parseFloat(row[1]),
    }),
  )
}
const libs100 = parseLibs(100)
const libs260 = parseLibs(260)

/** @type {Spectrum[]} */
const datasets = [
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
    ...new Set(
      datasets
        .map(dataset => dataset.points.map(point => point.material))
        .flat(2),
    ),
  ].sort(),
  datasets,
}
fs.writeFileSync(new URL("spectrums.json", generated), JSON.stringify(json))

console.log("Generado el archivo spectrums.json")
