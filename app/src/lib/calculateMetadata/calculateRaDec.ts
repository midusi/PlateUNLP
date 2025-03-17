
export const raDec = (raInput: number, decInput: number, toYear: number = new Date().getFullYear(), fromYear: number = 2000): [number, number] => {
    // Convertir de grados a radianes
    const degToRad = (deg: number) => deg * (Math.PI / 180)
    const radToDeg = (rad: number) => rad * (180 / Math.PI)

    let ra = degToRad(raInput)
    let dec = degToRad(decInput)

    // Convertir a coordenadas cartesianas
    let x = Math.cos(dec) * Math.cos(ra)
    let y = Math.cos(dec) * Math.sin(ra)
    let z = Math.sin(dec)

    // Calcular T (siglos desde la época inicial)
    let T = (toYear - fromYear) / 100

    // Coeficientes de la matriz de precesión
    let A = degToRad(3.075 * 10 ** -2) // en radianes
    let B = degToRad(1.336 * 10 ** -3)
    let C = degToRad(2.497 * 10 ** -2)

    // Aplicar matriz de precesión
    let x_p = x + (-A * T * y) + (-B * T * z)
    let y_p = (A * T * x) + y + (-C * T * z)
    let z_p = (B * T * x) + (C * T * y) + z

    // Convertir de nuevo a RA y DEC
    let ra_new = Math.atan2(y_p, x_p)
    let dec_new = Math.asin(z_p)

    // Convertir de radianes a grados
    return [radToDeg(ra_new), radToDeg(dec_new)]
}

