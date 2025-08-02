import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"

import { observation } from "./observation"

export const spectrum = sqliteTable("spectrum", {
  id: idType(),
  observationId: text()
    .notNull()
    .references(() => observation.id),
  type: text({ enum: ["lamp", "science"] }).notNull(),
  // image of the spectrum
  imageLeft: integer().notNull(), // offset from the left of the observation image
  imageTop: integer().notNull(), // offset from the top of the observation image
  imageWidth: integer().notNull(), // width of the spectrum image
  imageHeight: integer().notNull(), // height of the spectrum image
})

export const spectrumRelations = relations(spectrum, ({ one }) => ({
  observation: one(observation, { fields: [spectrum.observationId], references: [observation.id] }),
}))
