import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"

export const material = sqliteTable(
  "material",
  {
    id: idType(),
    name: text().notNull(),
    arr: text("material", { mode: "json" })
      .notNull()
      .$type<{ wavelength: number; material: string; intensity: number }[]>(),
  },
  (t) => [uniqueIndex("material_name").on(t.name)],
)
