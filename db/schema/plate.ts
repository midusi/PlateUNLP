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
  // metadata, with a flag indicating if the value is known
  metadataCompletion: real().notNull(), // percentage of metadata completed [0, 100]
  OBSERVAT: text("observat")
    .notNull()
    .default("oalp")
    .references(() => observatory.id),
  "PLATE-N": text("plate_n").notNull(),
  OBSERVER: text("observer").notNull().default(""),
  "OBSERVER?": integer("observer_known", { mode: "boolean" }).notNull().default(true),
  DIGITALI: text("digitali").notNull().default(""),
  "DIGITALI?": integer("digitali_known", { mode: "boolean" }).notNull().default(true),
  SCANNER: text("scanner").notNull().default(""),
  "SCANNER?": integer("scanner_known", { mode: "boolean" }).notNull().default(true),
  SOFTWARE: text("software").notNull().default(""),
  "SOFTWARE?": integer("software_known", { mode: "boolean" }).notNull().default(true),
  TELESCOPE: text("telescope").notNull().default(""),
  "TELESCOPE?": integer("telescope_known", { mode: "boolean" }).notNull().default(true),
  DETECTOR: text("detector").notNull().default(""),
  "DETECTOR?": integer("detector_known", { mode: "boolean" }).notNull().default(true),
  INSTRUMENT: text("instrument").notNull().default(""),
  "INSTRUMENT?": integer("instrument_known", { mode: "boolean" }).notNull().default(true),
})

export const plateRelations = relations(plate, ({ one, many }) => ({
  image: one(upload, { fields: [plate.imageId], references: [upload.id] }),
  project: one(project, { fields: [plate.projectId], references: [project.id] }),
  observations: many(observation),
  observatory: one(observatory, { fields: [plate.OBSERVAT], references: [observatory.id] }),
}))
