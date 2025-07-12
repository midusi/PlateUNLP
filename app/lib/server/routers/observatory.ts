import { z } from "zod"
import { db } from "../db"
import { publicProcedure, router } from "../trpc"

export const observatoryRouter = router({
  list: publicProcedure.query(async () => {
    return await db.query.observatory.findMany({
      orderBy: (o, { asc }) => [asc(o.id)],
    })
  }),
  get: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await db.query.observatory.findFirst({
      where: (o, { eq }) => eq(o.id, input),
    })
  }),
})
