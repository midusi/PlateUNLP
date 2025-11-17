import { integer, real, sqliteTable } from "drizzle-orm/sqlite-core"

export const iersDeltaT = sqliteTable("iers_delta_t", {
  mdj: integer({ mode: "number" }).unique().notNull(), // Modified julian date (UT)
  deltaT: real().notNull(), // in seconds
})

export const iersBulletinA = sqliteTable("iers_bulletin_a", {
  mdj: integer({ mode: "number" }).unique().notNull(), // Modified julian date (UT)
  pmX: real().notNull(), // Proper motion in X (arcsec)
  pmY: real().notNull(), // Proper motion in Y (arcsec)
  dut1: real().notNull(), // UT1-UTC (seconds)
})
