import { relations } from "drizzle-orm"
import { primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { project } from "./project"
import { user } from "./user"

export const userToProject = sqliteTable(
  "user_to_project",
  {
    userId: text()
      .notNull()
      .references(() => user.id),
    projectId: text()
      .notNull()
      .references(() => project.id),
    role: text({ enum: ["owner", "editor", "viewer"] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.projectId] })],
)

export const userProjectRelations = relations(userToProject, ({ one }) => ({
  project: one(project, { fields: [userToProject.projectId], references: [project.id] }),
  user: one(user, { fields: [userToProject.userId], references: [user.id] }),
}))
