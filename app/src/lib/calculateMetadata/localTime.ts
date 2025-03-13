import { getObservatoryCoords } from "../observatories"

export const localTime = (observat: string, dateobs: Date, ut: number): number => {
    const coords = getObservatoryCoords(observat)
    if (coords == null) {
        throw new Error("No se encontraron coordenadas para el observatorio. observat: " + observat)
    }
    const utcOffset = coords.lon / 15 // Aproximación del huso horario en horas

    // 2. Convertir UT a milisegundos
    const utMilisegundos = ut * 3600000 // Convertir UT (horas) a ms

    // 3. Obtener la hora local sumando UT y el UTC Offset
    const horaLocalMs = dateobs.getTime() + utMilisegundos + utcOffset * 3600000

    // 4. Extraer la hora, minutos y segundos en formato decimal
    const fechaLocal = new Date(horaLocalMs)
    const horas = fechaLocal.getHours()
    const minutos = fechaLocal.getMinutes()
    const segundos = fechaLocal.getSeconds()

    // 5. Convertir todo a un número decimal (ej: 14.75 si es 14:45)
    return horas + minutos / 60 + segundos / 3600
}


/*
import { DateTime } from 'luxon';
import { getObservatoryCoords } from "../observatories";
const geoTz = require("geo-tz")
// import geoTz from "geo-tz"

export const localTime = (observat: string, dateobs: Date, ut: number): number => {
    // Obtener la latitud y longitud del observatorio
    const coords = getObservatoryCoords(observat);
    if (coords == null) {
        throw new Error("No se encontraron coordenadas para el observatorio. observat: " + observat);
    }

    // Obtener la zona horaria
    const tz = geoTz.find(coords.lat, coords.lon);

    if (!tz) {
        throw new Error("No se pudo determinar la zona horaria.");
    }

    // Crear la fecha en UTC y convertirla a la hora local del observatorio
    const time = DateTime.fromJSDate(dateobs).set({ hour: ut, minute: 0, second: 0 }).setZone('utc');
    const localTime = time.setZone(tz);

    // Convertir la hora local a fracción de horas (hora + minutos/60 + segundos/3600)
    return localTime.hour + localTime.minute / 60 + localTime.second / 3600;
};
*/