export const toJulianDate = (dateobs: Date, timeObs: number) => {
    let year = dateobs.getUTCFullYear()
    let month = dateobs.getUTCMonth() + 1 // Enero = 0 en JS, sumamos 1
    let day = dateobs.getUTCDate()

    // Extraer hora, minutos y segundos de timeObs (formato hhmmss)
    let hour = Math.floor(timeObs / 10000)
    let minute = Math.floor((timeObs % 10000) / 100)
    let second = timeObs % 100

    // Si el mes es enero o febrero, lo tratamos como mes 13 o 14 del año anterior
    if (month <= 2) {
        year -= 1
        month += 12
    }

    // Cálculo del término de corrección para el calendario gregoriano
    let A = Math.floor(year / 100)
    let B = 2 - A + Math.floor(A / 4)

    // Cálculo del JD
    let JD = Math.floor(365.25 * (year + 4716)) +
        Math.floor(30.6001 * (month + 1)) +
        day + B - 1524.5

    // Sumar la fracción del día por la hora, minutos y segundos
    JD += (hour + (minute / 60) + (second / 3600)) / 24

    return JD
}