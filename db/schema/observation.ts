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
      .references(() => plate.id, { onDelete: "cascade" }),
    name: text().notNull(),
    // image of the observation
    imageLeft: integer().notNull(), // offset from the left of the plate image
    imageTop: integer().notNull(), // offset from the top of the plate image
    imageWidth: integer().notNull(), // width of the observation image
    imageHeight: integer().notNull(), // height of the observation image
    // metadata, with a flag indicating if the value is known
    metadataCompletion: real().notNull(), // percentage of metadata completed [0, 100]
    OBJECT: text("object").notNull().default(""),
    "OBJECT?": integer("object_known", { mode: "boolean" }).notNull().default(true),
    "DATE-OBS": text("date_obs").notNull().default(""),
    "DATE-OBS?": integer("date_obs_known", { mode: "boolean" }).notNull().default(true),
    UT: text("ut").notNull().default(""),
    "UT?": integer("ut_known", { mode: "boolean" }).notNull().default(true),
    EXPTIME: text("exptime").notNull().default(""),
    "EXPTIME?": integer("exptime_known", { mode: "boolean" }).notNull().default(true),
    IMAGETYP: text("imagetyp").notNull().default(""),
    "IMAGETYP?": integer("imagetyp_known", { mode: "boolean" }).notNull().default(true),
    "MAIN-ID": text("main_id").notNull().default(""),
    "MAIN-ID?": integer("main_id_known", { mode: "boolean" }).notNull().default(true),
    SPTYPE: text("sptype").notNull().default(""),
    "SPTYPE?": integer("sptype_known", { mode: "boolean" }).notNull().default(true),
    RA: text("ra").notNull().default(""),
    "RA?": integer("ra_known", { mode: "boolean" }).notNull().default(true),
    DEC: text("dec").notNull().default(""),
    "DEC?": integer("dec_known", { mode: "boolean" }).notNull().default(true),
    EQUINOX: text("equinox").notNull().default(""),
    "EQUINOX?": integer("equinox_known", { mode: "boolean" }).notNull().default(true),
    RA2000: text("ra2000").notNull().default(""),
    "RA2000?": integer("ra2000_known", { mode: "boolean" }).notNull().default(true),
    DEC2000: text("dec2000").notNull().default(""),
    "DEC2000?": integer("dec2000_known", { mode: "boolean" }).notNull().default(true),
    RA1950: text("ra1950").notNull().default(""),
    "RA1950?": integer("ra1950_known", { mode: "boolean" }).notNull().default(true),
    DEC1950: text("dec1950").notNull().default(""),
    "DEC1950?": integer("dec1950_known", { mode: "boolean" }).notNull().default(true),
    "TIME-OBS": text("time_obs").notNull().default(""),
    "TIME-OBS?": integer("time_obs_known", { mode: "boolean" }).notNull().default(true),
    JD: text("jd").notNull().default(""),
    "JD?": integer("jd_known", { mode: "boolean" }).notNull().default(true),
    ST: text("st").notNull().default(""),
    "ST?": integer("st_known", { mode: "boolean" }).notNull().default(true),
    HA: text("ha").notNull().default(""),
    "HA?": integer("ha_known", { mode: "boolean" }).notNull().default(true),
    AIRMASS: text("airmass").notNull().default(""),
    "AIRMASS?": integer("airmass_known", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("observation_name_idx").on(t.plateId, t.name)],
)

export const observationRelations = relations(observation, ({ one, many }) => ({
  plate: one(plate, { fields: [observation.plateId], references: [plate.id] }),
  spectra: many(spectrum),
}))
