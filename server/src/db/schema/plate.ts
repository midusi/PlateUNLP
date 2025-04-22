import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid"
import { project } from "./project";
import { relations } from 'drizzle-orm'

export const plate = sqliteTable("plate", {
    id: text().primaryKey().$default(() => nanoid(10)),
    projectId: text("projectId").references(() => project.id),
    observat: text(),
    observer: text(),
    digitali: text(),
    scanner: text(),
    software: text(),
    plateN: text(),
    scanImage: text()
});

export const plateRelations = relations(plate, ({ one }) => ({
    project: one(project, {
        fields: [plate.projectId],
        references: [project.id],
    }),
}));