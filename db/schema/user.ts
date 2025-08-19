import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"

export const user = sqliteTable("user", {
  id: text()
    .primaryKey()
    .$default(() => nanoid(10)),
  name: text().notNull(),
  email: text().notNull().unique(),
  hashedPassword: text().notNull(),
})
