export interface ProcessInfoForm {
    general: StepGeneralInfoForm[]
    perSpectrum: StepSpecificInfoForm[]
    selectedSpectrum: null | number
}

export interface StepGeneralInfoForm {
    state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
}

export interface StepSpecificInfoForm {
    states: null // Todavia no se dividio la cantidad de espectros
    | ("NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE")[] // Indexado numero de espectro
}

export interface SpectrumData {
    id: number
    name: string
    image: string
    complete: number
}
