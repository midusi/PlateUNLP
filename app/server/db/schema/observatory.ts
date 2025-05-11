import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid"

export const observatory = sqliteTable("observatory", {
    id: text().primaryKey().$default(() => nanoid(10)),
    source: text().notNull(),
    elevation: integer().notNull(),
    name: text().notNull(),
    longitude_unit: text().notNull(),
    latitude_unit: text().notNull(),
    latitude: real().notNull(),
    elevation_unit: text().notNull(),
    longitude: real().notNull(),
    timezone: text().notNull(),
    aliases: text().notNull()
});
