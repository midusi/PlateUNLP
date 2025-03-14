import { getObservatoryCoords } from "../observatories"

export const sidereoTime = (observat: string, dateobs: Date, ut: number): number => {
    const coords = getObservatoryCoords(observat)
    if (coords === null)
        return 0
    // Convierte la fecha en UTC Julian Date
    const JD = dateobs.getTime() / 86400000 + 2440587.5

    // Días desde J2000.0
    const D = JD - 2451545.0

    // Tiempo Sidéreo Medio en Greenwich (GMST) en horas
    let GMST = 18.697374558 + 24.06570982441908 * D
    GMST = GMST % 24 // Ajustar dentro del rango 0-24 horas

    // Agregar la hora UTC (convertida a fracción de día)
    GMST += (ut / 3600) * 1.002737909

    // Convertir GMST a LST sumando la longitud en horas
    let LST = GMST + coords.lon / 15

    // Ajustar LST dentro del rango 0-24 horas
    if (LST < 0) LST += 24
    if (LST >= 24) LST -= 24

    return LST
}

