import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid"
import { relations } from 'drizzle-orm'
import { userProject } from "./userProject";
import { plate } from "./plate";


export const project = sqliteTable("project", {
    id: text().primaryKey().$default(() => nanoid(10)),
    name: text().notNull()
});

export const projectRelations = relations(project, ({ many }) => ({
    userProject: many(userProject),
    plate: many(plate),
}));