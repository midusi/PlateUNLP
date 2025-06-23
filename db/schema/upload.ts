import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { idType } from "../utils"

export const upload = sqliteTable("upload", {
  id: idType(32),
  name: text().notNull(), // name of the upload
  mimeType: text({ enum: ["image/jpeg", "image/png", "image/tiff"] }).notNull(), // MIME type of the upload
  uploadedAt: integer({ mode: "timestamp" }).$default(() => new Date()),
})
