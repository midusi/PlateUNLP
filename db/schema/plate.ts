import { relations } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"
import { observation } from "./observation"
import { observatory } from "./observatory"
import { project } from "./project"
import { upload } from "./upload"

export const plate = sqliteTable("plate", {
  id: idType(),
  projectId: text()
    .notNull()
    .references(() => project.id, { onDelete: "no action" }),
  imageId: text()
    .notNull()
    .references(() => upload.id),
  imageWidth: integer().notNull(),
  imageHeight: integer().notNull(),
  imageRotation: integer().notNull().default(0),
  // metadata, with a flag indicating if the value is known
  metadataCompletion: real().notNull(), // percentage of metadata completed [0, 100]
  OBSERVAT: text("observat")
    .notNull()
    .default("oalp")
    .references(() => observatory.id),
  "PLATE-N": text("plate_n").notNull(),
  TELESCOPE: text("telescope").notNull().default(""),
  "TELESCOPE?": integer("telescope_known", { mode: "boolean" }).notNull().default(true),
  INSTRUME: text("instrument").notNull().default(""),
  "INSTRUME?": integer("instrument_known", { mode: "boolean" }).notNull().default(true),
  OBSERVER: text("observer").notNull().default(""),
  "OBSERVER?": integer("observer_known", { mode: "boolean" }).notNull().default(true),
  OBSNOTES: text("obsnotes").notNull().default(""),
  "OBSNOTES?": integer("obsnotes_known", { mode: "boolean" }).notNull().default(true),
  NOTES: text("notes").notNull().default(""),
  "NOTES?": integer("notes_known", { mode: "boolean" }).notNull().default(true),
  SCANNER: text("scanner").notNull().default(""),
  "SCANNER?": integer("scanner_known", { mode: "boolean" }).notNull().default(true),
  SCANRES: text("scanres").notNull().default(""),
  "SCANRES?": integer("scanres_known", { mode: "boolean" }).notNull().default(true),
  SCANGAIN: text("scangain").notNull().default(""),
  "SCANGAIN?": integer("scangain_known", { mode: "boolean" }).notNull().default(true),
  SCANSOFT: text("scansoft").notNull().default(""),
  "SCANSOFT?": integer("scansoft_known", { mode: "boolean" }).notNull().default(true),
  DATESCAN: text("datescan").notNull().default(""),
  "DATESCAN?": integer("datescan_known", { mode: "boolean" }).notNull().default(true),
  SCANAUTH: text("scanauth").notNull().default(""),
  "SCANAUTH?": integer("scanauth_known", { mode: "boolean" }).notNull().default(true),
})

export const plateRelations = relations(plate, ({ one, many }) => ({
  image: one(upload, { fields: [plate.imageId], references: [upload.id] }),
  project: one(project, { fields: [plate.projectId], references: [project.id] }),
  observations: many(observation),
  observatory: one(observatory, { fields: [plate.OBSERVAT], references: [observatory.id] }),
}))
