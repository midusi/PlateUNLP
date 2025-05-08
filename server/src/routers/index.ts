import { router, publicProcedure } from '../trpc';
import { db } from "../db"
import * as s from "../db/schema"
import { nanoid } from 'nanoid';
import { z } from "zod"

export const appRouter = router({
  dummy: publicProcedure.query(() => 'Hello, world!'),
  crearUsuario: publicProcedure
    .input(
      // https://v4.zod.dev/error-customization
      z.object({
        name: z.string(),
        email: z.string().email()
      })
    )
    .mutation(async ({ input: { name, email } }) => {
      const result = await db.insert(s.user).values({
        name,
        email,
        hashedPassword: "dadas"
      })
      console.log(result)
    }),
  consulta: publicProcedure.query(async () => {
    return await db.query.user.findMany({
      columns: {
        id: true, name: true,
      }
    })

  }),
  login: publicProcedure
    .input(
      z.object({
        Email: z.string().nonempty().email(),
        Password: z.string().nonempty().min(6)
      })
    )
    .mutation(async ({ input: { Email, Password } }) => {
      console.log("antes de buscar ", Email, Password)
      const u = await db.select().from(s.user)
      console.log(u)
      return u
    })
})


// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;