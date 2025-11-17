export interface BBClassesProps {
  id: number
  name: string
  color: string
}

export const BBClasses = {
  Spectrum: { id: 0, name: "Spectrum", color: "red" },
  Lamp: { id: 0, name: "Lamp spectrum", color: "red" },
  Science: { id: 1, name: "Science spectrum", color: "green" },
}

export const classesSpectrumDetection: BBClassesProps[] = [BBClasses.Spectrum]

export const classesSpectrumPartSegmentation: BBClassesProps[] = [BBClasses.Lamp, BBClasses.Science]
