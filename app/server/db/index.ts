import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { hashPassword } from "../auth/password"
import * as s from "../db/schema"

import { env } from "../env"
import * as schema from "./schema"

export const db = drizzle({
    connection: { url: env.DATABASE_URL, authToken: env.DATABASE_TOKEN },
    schema,
})

export async function seedUsers() {
    try {
        const name = "user"
        const email = "user@example.com"

        const u = await db.select().from(s.user).where(u => eq(u.email, email))
        if (u == null || u.length === 0) {
            const hashedPassword = await hashPassword("123456")
            await db.insert(s.user).values({
                name,
                email,
                hashedPassword,
            })
        }
    }
    catch (error) {
        console.log("Error al crear el usuario:", error)
    }
};
