import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid"
import { plate } from "./plate";
import { relations } from 'drizzle-orm'
import { spectrum } from "./spectrum";

export const observation = sqliteTable("observation", {
    id: text().primaryKey().$default(() => nanoid(10)),
    x: integer(),
    y: integer(),
    height: integer(),
    width: integer(),
    plateId: text("plateId").references(() => plate.id),

    OBJECT: text().notNull(), // required
    DATE_OBS: text().notNull(), // required CAMBIAR
    TIME_OBS: real(), // time/timestamp
    MAIN_ID: text().notNull(), // required
    UT: real().notNull(), // float required
    ST: real(), // float
    HA: real(), // float
    RA: real(), // float (grados o radianes)
    DEC: real(), // float (grados o radianes)
    GAIN: real(), // float
    RA2000: real(), // float (grados o radianes)
    DEC2000: real(), // float (grados o radianes)
    RA1950: real(), // float (grados o radianes)
    DEC1950: real(), // float (grados o radianes)
    EXPTIME: real(), // float (segundos) / timestamp
    DETECTOR: text(),
    IMAGETYP: text(),
    SPTYPE: text(),
    JD: real(), // float
    EQUINOX: real(), // float
    AIRMASS: real()
});

export const observationRelations = relations(plate, ({ one, many }) => ({
    plate: one(plate, {
        fields: [observation.plateId],
        references: [plate.id],
    }),
    spectrum: many(spectrum),
}));