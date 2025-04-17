import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "./schema"

const dbfile = new URL("../../db.sqlite", import.meta.url)

export const db = drizzle({
    connection: { url: dbfile.toString() },
    schema
});