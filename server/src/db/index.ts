import { drizzle } from 'drizzle-orm/libsql';
import * as schema from "./schema"
import * as s from "../db/schema"
import { eq } from 'drizzle-orm';
import { hashPassword } from '../utils/hash';

const dbfile = new URL("../../db.sqlite", import.meta.url)

export const db = drizzle({
    connection: { url: dbfile.toString() },
    schema
});


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

