import { relations, sql } from "drizzle-orm"
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"
import { observation } from "./observation"

export const spectrum = sqliteTable("spectrum", {
  id: idType(),
  observationId: text()
    .notNull()
    .references(() => observation.id, { onDelete: "cascade" }),
  type: text({ enum: ["lamp", "science"] }).notNull(),
  // image of the spectrum
  imageLeft: integer().notNull(), // offset from the left of the observation image
  imageTop: integer().notNull(), // offset from the top of the observation image
  imageWidth: integer().notNull(), // width of the spectrum image
  imageHeight: integer().notNull(), // height of the spectrum image
  // params for spectrums extraction
  countMediasPoints: integer().notNull().default(5), // cantidad de puntos intermedios
  apertureCoefficient: real().notNull().default(0.95), // coeficiente de tamaño de apertura
  fitDegree: integer().notNull().default(1),
  // extracted
  intensityArr: text("intensityArr", { mode: "json" })
    .notNull()
    .$type<number[]>()
    .default(sql`'[]'`),
})

export const spectrumRelations = relations(spectrum, ({ one }) => ({
  observation: one(observation, { fields: [spectrum.observationId], references: [observation.id] }),
}))
