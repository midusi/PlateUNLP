import { getDayOfYear, getDaysInYear } from 'date-fns'


export const epoca = (dateobs: Date): number => {
    const days = getDaysInYear(dateobs) // 365 o 366
    const year = dateobs.getFullYear() + (getDayOfYear(dateobs) - 1) / days
    return parseFloat(year.toFixed(1)) // Devuelve el año con una decimal
}