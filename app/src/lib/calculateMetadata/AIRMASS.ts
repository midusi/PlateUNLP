import { getObservatoryCoords } from "../observatories";


// Cuando tenga informacion de como se calcula lo modifico
export const calculateAirmass = (observat: string, ha: number, ra: number, dec: number): number => {
    return 10
    // Obtener latitud del observatorio
    const coords = getObservatoryCoords(observat);
    if (!coords) return "";

    // Latitud del observatorio en grados
    const lat_deg = coords.lat;

    // Convertir HA a grados
    const ha_deg = ha * (24 / 360);

    // RA ya está en fracción de hora, no requiere conversión adicional

    // Dec ya está en grados, no requiere conversión adicional

    // Calcular airmass usando la fórmula
    const zz = Math.sin(lat_deg * (Math.PI / 180)) * Math.sin(dec * (Math.PI / 180)) -
        Math.cos(lat_deg * (Math.PI / 180)) * Math.cos(dec * (Math.PI / 180)) * Math.cos(ha_deg * (Math.PI / 180));

    const secz = 1 / zz;

    return secz.toFixed(5);
};