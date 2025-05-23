/** biome-ignore-all lint/suspicious/noConsole: runs on the developers machine */

import { reset } from "drizzle-seed"
import pc from "picocolors"
import { z } from "zod/v4"
import { hashPassword } from "../auth/password"
import { db } from "."
import * as schema from "./schema"

async function seedObservatories() {
  const response = await fetch(
    "https://www.astropy.org/astropy-data/coordinates/sites.json",
  )
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
    Object.entries(sites).map(
      ([key, site]): typeof schema.observatory.$inferInsert => ({
        id: key,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        elevation: site.elevation,
        timezone: site.timezone,
        aliases: site.aliases,
        source: "astropy-data",
      }),
    ),
  )

  console.log(pc.white(`✓ Inserted ${pc.bold(res.rowsAffected)} observatories`))
}

async function createUser(name: string, email: string, password: string) {
  await db.insert(schema.user).values({
    name,
    email,
    hashedPassword: await hashPassword(password),
  })

  console.log(
    pc.white(
      `✓ Created user ${pc.cyan(name)} (${pc.cyan(email)}) with password ${pc.cyan(password)}`,
    ),
  )
}

async function main() {
  console.log(pc.bgBlue(" Seeding database... "))
  console.log(pc.gray("❖ Dropping existing tables..."))
  await reset(db, schema)

  console.log(pc.gray("❖ Getting observatories..."))
  await seedObservatories()

  console.log(pc.gray("❖ Creating users..."))
  await createUser("prueba", "prueba@prueba.com", "12345")
}

main()
  .then(() => console.log(pc.green("Database seeded successfully!")))
  .catch((e) => console.error(e))
