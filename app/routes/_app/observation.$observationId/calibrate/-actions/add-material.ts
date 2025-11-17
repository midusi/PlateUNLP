import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addMaterial = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string(),
      arr: z.array(
        z.object({
          wavelength: z.number(),
          material: z.string(),
          intensity: z.number(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const [material] = await db
        .insert(s.material)
        .values({
          name: data.name,
          arr: data.arr,
        })
        .returning({
          id: s.material.id,
          name: s.material.name,
          arr: s.material.arr,
        })
      return material
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        throw new Error(`Material with name "${data.name}" already exists`)
      }
      throw err
    }
  })
