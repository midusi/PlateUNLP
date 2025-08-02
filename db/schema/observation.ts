import { relations } from "drizzle-orm"
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"

import { plate } from "./plate"
import { spectrum } from "./spectrum"

export const observation = sqliteTable(
  "observation",
  {
    id: idType(),
    plateId: text()
      .notNull()
      .references(() => plate.id),
    name: text().notNull(),
    // image of the observation
    imageLeft: integer().notNull(), // offset from the left of the plate image
    imageTop: integer().notNull(), // offset from the top of the plate image
    imageWidth: integer().notNull(), // width of the observation image
    imageHeight: integer().notNull(), // height of the observation image
    // metadata
    OBJECT: text("object").notNull().default(""),
    "DATE-OBS": text("date_obs").notNull().default(""),
    UT: text("ut").notNull().default(""),
    "MAIN-ID": text("main_id").notNull().default(""),
    SPTYPE: text("sptype").notNull().default(""),
    RA: text("ra").notNull().default(""),
    DEC: text("dec").notNull().default(""),
    EQUINOX: text("equinox").notNull().default(""),
    RA2000: text("ra2000").notNull().default(""),
    DEC2000: text("dec2000").notNull().default(""),
    RA1950: text("ra1950").notNull().default(""),
    DEC1950: text("dec1950").notNull().default(""),
    "TIME-OBS": text("time_obs").notNull().default(""),
    JD: real("jd"),
    ST: text("st").notNull().default(""),
    HA: text("ha").notNull().default(""),
    AIRMASS: real("airmass"),
    GAIN: text("gain").notNull().default(""),
    EXPTIME: text("exptime").notNull().default(""),
    DETECTOR: text("detector").notNull().default(""),
    IMAGETYP: text("imagetyp").notNull().default(""),
  },
  (t) => [uniqueIndex("observation_name_idx").on(t.plateId, t.name)],
)

export const observationRelations = relations(observation, ({ one, many }) => ({
  plate: one(plate, { fields: [observation.plateId], references: [plate.id] }),
  spectra: many(spectrum),
}))
