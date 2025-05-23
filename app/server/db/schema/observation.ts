import { relations } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import { plate } from "./plate"
import { spectrum } from "./spectrum"

export const observation = sqliteTable("observation", {
  id: text().primaryKey().$default(() => nanoid(10)),
  x: integer(),
  y: integer(),
  height: integer(),
  width: integer(),
  plateId: text("plateId").references(() => plate.id),

  OBJECT: text().notNull(),
  DATE_OBS: text().notNull(),
  TIME_OBS: real(),
  MAIN_ID: text().notNull(),
  UT: real().notNull(),
  ST: real(),
  HA: real(),
  RA: real(),
  DEC: real(),
  GAIN: real(),
  RA2000: real(),
  DEC2000: real(),
  RA1950: real(),
  DEC1950: real(),
  EXPTIME: real(),
  DETECTOR: text(),
  IMAGETYP: text(),
  SPTYPE: text(),
  JD: real(),
  EQUINOX: real(),
  AIRMASS: real(),
})

export const observationRelations = relations(observation, ({ one, many }) => ({
  plate: one(plate, {
    fields: [observation.plateId],
    references: [plate.id],
  }),
  spectrum: many(spectrum),
}))
