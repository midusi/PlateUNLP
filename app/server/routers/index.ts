import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { verifyPassword } from "../auth/password"
import { db } from "../db"
import * as s from "../db/schema"
import { publicProcedure, router } from "../trpc"

export const appRouter = router({
  dummy: publicProcedure.query(() => "Hello, world!"),
  crearUsuario: publicProcedure
    .input(
      // https://v4.zod.dev/error-customization
      z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input: { name, email } }) => {
      const result = await db.insert(s.user).values({
        name,
        email,
        hashedPassword: "dadas",
      })
      console.log(result)
    }),
  consulta: publicProcedure.query(async () => {
    return await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
      },
    })
  }),
  login: publicProcedure
    .input(
      z.object({
        Email: z.string().nonempty().email(),
        Password: z.string().nonempty().min(6),
      }),
    )
    .mutation(async ({ input: { Email, Password } }) => {
      const user = await db
        .select()
        .from(s.user)
        .where(eq(s.user.email, Email))
        .then((rows) => rows[0])

      if (!user) {
        // Usuario no encontrado
        return false
      }

      const passwordMatch = await verifyPassword(user.hashedPassword, Password)

      if (!passwordMatch) {
        // Contraseña incorrecta
        return false
      }

      // Autenticado correctamente
      return true
    }),
})

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
