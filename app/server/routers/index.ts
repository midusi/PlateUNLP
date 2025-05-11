import { nanoid } from "nanoid"
import { z } from "zod"
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
})

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
