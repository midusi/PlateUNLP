import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
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
  // metadata
  OBSERVAT: text("observat")
    .notNull()
    .default("oalp")
    .references(() => observatory.id),
  "PLATE-N": text("plate_n").notNull().default("New plate"),
  OBSERVER: text("observer").notNull().default(""),
  DIGITALI: text("digitali").notNull().default(""),
  SCANNER: text("scanner").notNull().default(""),
  SOFTWARE: text("software").notNull().default(""),
  TELESCOPE: text("telescope").notNull().default(""),
  DETECTOR: text("detector").notNull().default(""),
  INSTRUMENT: text("instrument").notNull().default(""),
})

export const plateRelations = relations(plate, ({ one, many }) => ({
  image: one(upload, { fields: [plate.imageId], references: [upload.id] }),
  project: one(project, { fields: [plate.projectId], references: [project.id] }),
  observations: many(observation),
  observatory: one(observatory, { fields: [plate.OBSERVAT], references: [observatory.id] }),
}))
