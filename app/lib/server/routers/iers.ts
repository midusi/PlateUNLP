import { z } from "zod"
import { db } from "../db"
import { publicProcedure, router } from "../trpc"

export const iersRouter = router({
  getDeltaT: publicProcedure.input(z.number()).query(async ({ input: mdj }) => {
    const [left, right] = await Promise.all([
      db.query.iersDeltaT.findFirst({
        where: (t, { lte }) => lte(t.mdj, mdj),
        orderBy: (t, { desc }) => [desc(t.mdj)],
      }),
      db.query.iersDeltaT.findFirst({
        where: (t, { gt }) => gt(t.mdj, mdj),
        orderBy: (t, { asc }) => [asc(t.mdj)],
      }),
    ])

    if (!left || !right) return null
    // Linear interpolation between left and right
    return left.deltaT + ((right.deltaT - left.deltaT) * (mdj - left.mdj)) / (right.mdj - left.mdj)
  }),
  getPolarMotion: publicProcedure
    .input(z.number())
    .output(
      z.object({
        status: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
        x: z.number(),
        y: z.number(),
      }),
    )
    .query(async ({ input: mdj }) => {
      const [left, right] = await Promise.all([
        db.query.iersBulletinA.findFirst({
          where: (t, { lte }) => lte(t.mdj, mdj),
          orderBy: (t, { desc }) => [desc(t.mdj)],
        }),
        db.query.iersBulletinA.findFirst({
          where: (t, { gt }) => gt(t.mdj, mdj),
          orderBy: (t, { asc }) => [asc(t.mdj)],
        }),
      ])

      if (!left || !right) {
        // Use the mean of the 1962-2014 IERS B data
        return {
          status: !left ? -1 : +1,
          x: 0.035,
          y: 0.29,
        }
      }

      // Linear interpolation between left and right
      const t = (mdj - left.mdj) / (right.mdj - left.mdj)
      return {
        status: 0,
        x: left.pmX + (right.pmX - left.pmX) * t,
        y: left.pmY + (right.pmY - left.pmY) * t,
      }
    }),
})
