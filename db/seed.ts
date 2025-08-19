import "dotenv/config"

import { reset } from "drizzle-seed"
import pc from "picocolors"
import { z } from "zod"
import { getJulianDate, getModifiedJulianDate } from "~/lib/astronomical/datetime"
import { hashPassword } from "~/lib/auth/password"
import { db } from "."
import * as schema from "./schema"

async function seedObservatories() {
  const response = await fetch("https://www.astropy.org/astropy-data/coordinates/sites.json")
  if (!response.ok) {
    throw new Error(`Failed to fetch sites.json: ${response.statusText}`)
  }
  const data = await response.json()
  const sites = z
    .record(
      z.string(),
      z.object({
        name: z.string().nonempty(),
        aliases: z.string().array(),
        latitude_unit: z.literal(["degree"]),
        longitude_unit: z.literal(["degree"]),
        elevation_unit: z.literal(["meter"]),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-360).max(360),
        elevation: z.number(),
        timezone: z.string().nonempty(),
        source: z.string().nonempty(),
      }),
    )
    .parse(data)

  const res = await db.insert(schema.observatory).values(
    Object.entries(sites).map(([key, site]): typeof schema.observatory.$inferInsert => ({
      id: key,
      name: site.name,
      latitude: site.latitude,
      longitude: site.longitude,
      elevation: site.elevation,
      timezone: site.timezone,
      aliases: site.aliases,
      source: "astropy-data",
    })),
  )

  console.log(pc.white(`✓ Inserted ${pc.bold(res.rowsAffected)} observatories`))
}

async function seedIERSDeltaT() {
  // Fetch the latest ΔT (TT - UT1) data from IERS (1973-present)
  // More info: https://maia.usno.navy.mil/products/deltaT
  const response = await fetch("https://maia.usno.navy.mil/ser7/deltat.data")
  if (!response.ok) {
    throw new Error(`Failed to fetch deltat.data: ${response.statusText}`)
  }
  const data = await response.text()
  const lines = data.trimEnd().split("\n")

  const res = await db.insert(schema.iersDeltaT).values(
    lines.map((line): typeof schema.iersDeltaT.$inferInsert => {
      const year = line.slice(1, 5).trimStart()
      const month = line.slice(6, 8).trimStart()
      const day = line.slice(9, 11).trimStart()
      const deltaT = parseFloat(line.slice(12).trim())

      const jd = getJulianDate(
        `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        "12:00:00",
      )
      const mdj = getModifiedJulianDate(jd)

      return { mdj, deltaT }
    }),
  )

  console.log(pc.white(`✓ Inserted ${pc.bold(res.rowsAffected)} ΔT (TT - UT1) records`))
}

async function seedIERSHistoricDeltaT() {
  // Fetch historic ΔT (TT - UT1) data from IERS (1665-1984)
  // More info: https://maia.usno.navy.mil/products/deltaT
  const response = await fetch("https://maia.usno.navy.mil/ser7/historic_deltat.data")
  if (!response.ok) {
    throw new Error(`Failed to fetch historic_deltat.data: ${response.statusText}`)
  }
  const data = await response.text()
  const lines = data.trimEnd().split("\n").slice(2) // Skip the first two header lines

  const oldestDeltaT = await db.query.iersDeltaT.findFirst({
    orderBy: (t, { asc }) => [asc(t.mdj)],
  })

  const res = await db.insert(schema.iersDeltaT).values(
    lines.flatMap((line): (typeof schema.iersDeltaT.$inferInsert)[] => {
      const year = line.slice(0, 4)
      const month = line.at(5) === "5" ? "07" : "01" // Use January and July only
      const deltaT = parseFloat(line.slice(10, 20).trim())

      const jd = getJulianDate(`${year.padStart(4, "0")}-${month}-01`, "12:00:00")
      const mdj = getModifiedJulianDate(jd)

      // Skip entries that are older than the oldest entry in the database
      if (oldestDeltaT && mdj >= oldestDeltaT.mdj) return []

      return [{ mdj, deltaT }]
    }),
  )

  console.log(pc.white(`✓ Inserted ${pc.bold(res.rowsAffected)} ΔT (TT - UT1) historic records`))
}

async function seedIERSBulletinA() {
  // Fetch IERS Bulletin A data (polar motion, DUT1) from IERS
  // More info: https://maia.usno.navy.mil/products/bulletin-a
  const response = await fetch("https://maia.usno.navy.mil/ser7/finals2000A.all")
  if (!response.ok) {
    throw new Error(`Failed to fetch finals2000A.all: ${response.statusText}`)
  }
  const data = await response.text()
  const lines = data.trimEnd().split("\n")

  let total = 0
  const batchSize = 500
  for (let i = 0; i < lines.length; i += batchSize) {
    const values = lines
      .slice(i, i + batchSize)
      .flatMap((line): (typeof schema.iersBulletinA.$inferInsert)[] => {
        // https://maia.usno.navy.mil/ser7/readme.finals2000A
        const isIERS = line.at(16) === "I"
        if (!isIERS) return [] // Skip non-bulletin lines (like predictions)
        return [
          {
            mdj: parseFloat(line.slice(7, 15).trim()),
            pmX: parseFloat(line.slice(18, 27).trim()),
            pmY: parseFloat(line.slice(37, 46).trim()),
            dut1: parseFloat(line.slice(58, 68).trim()),
          },
        ]
      })
    if (values.length === 0) continue // Skip empty batches
    const res = await db.insert(schema.iersBulletinA).values(values)
    total += res.rowsAffected
  }

  console.log(pc.white(`✓ Inserted ${pc.bold(total)} Bulletin A records`))
}

async function createUser(name: string, email: string) {
  await db.insert(schema.user).values({
    name,
    email,
  })

  console.log(
    pc.white(
      `✓ Created user ${pc.cyan(name)} (${pc.cyan(email)})}`,
    ),
  )
}

async function createProject(name: string, ownerEmail: string) {
  const [{ id }] = await db
    .insert(schema.project)
    .values({ name })
    .returning({ id: schema.project.id })
  const user = await db.query.user.findFirst({ where: (t, { eq }) => eq(t.email, ownerEmail) })
  await db.insert(schema.userToProject).values({ userId: user!.id, projectId: id, role: "owner" })

  console.log(pc.white(`✓ Created project ${pc.cyan(name)} (${pc.cyan(id)})`))
}

async function main() {
  console.log(pc.bgBlue(" Seeding database... "))
  console.log(pc.gray("❖ Dropping existing tables..."))
  await reset(db, schema)

  console.log(pc.gray("❖ Getting observatories..."))
  await seedObservatories()

  console.log(pc.gray("❖ Getting IERS data..."))
  await seedIERSDeltaT()
  await seedIERSHistoricDeltaT()
  await seedIERSBulletinA()

  console.log(pc.gray("❖ Creating users..."))
  await createUser("Chidi Anagonye", "canagonye@saintjohns.edu.au")
  await createUser("Simone Garnett", "sgarnett@saintjohns.edu.au")

  console.log(pc.gray("❖ Creating projects..."))
  await createProject("Observatorio Astronómico de La Plata", "canagonye@saintjohns.edu.au")
}

main()
  .then(() => console.log(pc.green("Database seeded successfully!")))
  .catch((e) => console.error(e))
