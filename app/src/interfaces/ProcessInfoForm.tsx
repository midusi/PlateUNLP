export interface ProcessInfoForm {
    general: {
        state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
    }[] // Indexado por numero de etapa
    perSpectrum: null | {
        state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
    }[][] // Indexado por numero de etapa y numero de espectro
}
