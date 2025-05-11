import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { user } from "./user"
import { relations } from 'drizzle-orm'
import { project } from "./project"

export const userProject = sqliteTable("userProject", {
    userId: text("userId").references(() => user.id),
    projectId: text("projectId").references(() => project.id),
    role: text().notNull(),
}, (userProject) => ({
    pk: primaryKey(userProject.userId, userProject.projectId),
}));

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