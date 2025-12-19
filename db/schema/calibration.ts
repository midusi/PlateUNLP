import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"
import { observation } from "./observation"

export const calibration = sqliteTable(
  "calibration",
  {
    id: idType(),
    observationId: text()
      .notNull()
      .references(() => observation.id, { onDelete: "cascade" }),
    // params for extraction
    minWavelength: integer().notNull().default(0),
    maxWavelength: integer().notNull().default(2000),
    material: text().notNull().default("He-Ne-Ar"),
    onlyOneLine: integer("only_one_line", { mode: "boolean" }).notNull().default(true),
    inferenceFunction: text({
      enum: ["Linear regresion", "Piece wise linear regression", "Legendre"],
    })
      .notNull()
      .default("Linear regresion"),
    deegre: integer().notNull().default(1),
    /** Datos de calibracion ingresados */
    lampPoints: text("lampPoints", { mode: "json" })
      .notNull()
      .$type<{ x: number; y: number }[]>()
      .default(sql`'[]'`),
    materialPoints: text("materialPoints", { mode: "json" })
      .notNull()
      .$type<{ x: number; y: number }[]>()
      .default(sql`'[]'`),
  },
  (t) => [uniqueIndex("calibration_observation_idx").on(t.observationId)],
)

export const calibrationRelations = relations(calibration, ({ one }) => ({
  observation: one(observation, {
    fields: [calibration.observationId],
    references: [observation.id],
  }),
}))
