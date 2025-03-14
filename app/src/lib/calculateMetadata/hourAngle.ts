

export const hourAngle = (ra: number, st: number): number => {
    // Calcular ángulo horario
    let ha_fh = st - ra
    if (ha_fh < 0) ha_fh += 24

    return ha_fh
}
