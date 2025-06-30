import { relations } from "drizzle-orm"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { nanoid } from "nanoid"

import { plate } from "./plate"
import { userToProject } from "./userToProject"

export const project = sqliteTable("project", {
  id: text()
    .primaryKey()
    .$default(() => nanoid(10)),
  name: text().notNull(),
})

export const projectRelations = relations(project, ({ many }) => ({
  plates: many(plate),
  projectToUsers: many(userToProject),
}))
