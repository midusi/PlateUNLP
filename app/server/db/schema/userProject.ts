import { relations } from "drizzle-orm"
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { project } from "./project"
import { user } from "./user"

export const userProject = sqliteTable("userProject", {
  userId: text("userId").references(() => user.id),
  projectId: text("projectId").references(() => project.id),
  role: text().notNull(),
}, userProject => [
  primaryKey({ columns: [userProject.userId, userProject.projectId] }),
])

export const userProjectRelations = relations(userProject, ({ one }) => ({
  project: one(project, {
    fields: [userProject.projectId],
    references: [project.id],
  }),
  user: one(user, {
    fields: [userProject.userId],
    references: [user.id],
  }),
}))
