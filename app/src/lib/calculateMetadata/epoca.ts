import { DateTime } from 'luxon'

export const epoca = (dateobs: Date): number => {
    const t = DateTime.fromJSDate(dateobs) // Convierte el objeto Date a un DateTime de Luxon
    const year = t.year + (t.ordinal - 1) / 365
    return parseFloat(year.toFixed(1)) // Devuelve el año con una decimal
}