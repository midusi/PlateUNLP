import { drizzle } from "drizzle-orm/libsql"
import { env } from "../env"
import { eq } from 'drizzle-orm'
import * as s from "../db/schema"

import * as schema from "./schema"
import { hashPassword } from "server/utils/hash";

export const db = drizzle({
    connection: { url: env.DATABASE_URL, authToken: env.DATABASE_TOKEN },
    schema,
})

export const seedUsers = async () => {
    try {
        const name = "user"
        const email = "user@example.com"

        const u = await db.select().from(s.user).where(u => eq(u.email, email))
        if (u == null || u.length == 0) {
            const hashedPassword = await hashPassword("123456")
            await db.insert(s.user).values({
                name,
                email,
                hashedPassword
            })
        }
    } catch (error) {
        console.log('Error al crear el usuario:', error);
    }
};