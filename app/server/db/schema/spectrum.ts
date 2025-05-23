import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"
import { observation } from "./observation"

export const spectrum = sqliteTable("spectrum", {
  id: text()
    .primaryKey()
    .$default(() => nanoid(10)),
  x: integer(),
  y: integer(),
  height: integer(),
  width: integer(),
  observationId: text("observationId").references(() => observation.id),
  type: text().notNull(),
})

export const spectrumRelations = relations(spectrum, ({ one }) => ({
  observation: one(observation, {
    fields: [spectrum.observationId],
    references: [observation.id],
  }),
}))
