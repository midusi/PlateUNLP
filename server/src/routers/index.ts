import { router, publicProcedure } from '../trpc';
import { db } from "../db"
import * as s from "../db/schema"
import { nanoid } from 'nanoid';

export const appRouter = router({
  dummy: publicProcedure.query(() => 'Hello, world!'),
  crearUsuario: publicProcedure.mutation(async () => {
    const result = await db.insert(s.user).values({
      name: "dsadas" + nanoid(),
      email: "dasdadas" + nanoid(),
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
  })
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;