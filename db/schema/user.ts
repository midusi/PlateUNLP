import { relations } from "drizzle-orm"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"

import { userToProject } from "./userToProject"

export const user = sqliteTable("user", {
  id: text()
    .primaryKey()
    .$default(() => nanoid(10)),
  name: text().notNull(),
  email: text().notNull().unique(),
  hashedPassword: text().notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  userToProjects: many(userToProject),
}))
