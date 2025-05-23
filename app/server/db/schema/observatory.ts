import { sql } from "drizzle-orm"
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const observatory = sqliteTable("observatory", {
    id: text().primaryKey(),
    name: text().notNull(),
    latitude: real().notNull(), // in degrees
    longitude: real().notNull(), // in degrees
    elevation: real().notNull(), // in meters
    timezone: text().notNull(), // in IANA Time Zone Database format
    aliases: text({ mode: "json" }).notNull().$type<string[]>().default(sql`'[]'`),
    source: text({ enum: ["astropy-data", "plateunlp", "user"] }).notNull(),
})
