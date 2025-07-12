import spectrums from "~/dataset/MaterialSpectrum/spectrums.json"

/** List of all available lamp materials IDs */
export const LAMP_MATERIALS = ["He-Ne-Ar", "Fe-Ne-Ar", "Fe-Ne"] as const
export type LampMaterial = (typeof LAMP_MATERIALS)[number]

export type SpectrumPoint = (typeof spectrums.datasets)[number]["points"][number]

export function getMaterialSpectralData(material: LampMaterial): SpectrumPoint[] {
  const dataset = spectrums.datasets.find((i) => i.id === "nist")!
  const materials = new Set(material.split("-").flatMap((m) => [m, `${m} I`, `${m} II`]))

  return dataset.points.filter((i) => materials.has(i.material))
  // .map((d) => { return { x: d.wavelength, y: d.intensity, material: d.material } }) || []
}
