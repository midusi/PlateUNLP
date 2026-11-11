import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const deleteObservatory = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observatoryId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const observatory = await db.query.observatory.findFirst({
      where: (observatory, { eq }) => eq(observatory.id, data.observatoryId),
      columns: { id: true, name: true },
    })
    if (!observatory) throw new Error(`Observatory with id ${data.observatoryId} not found`)

    const plateUsingIt = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.OBSERVAT, data.observatoryId),
      columns: { id: true },
    })

    if (plateUsingIt) {
      throw new Error(
        `Cannot delete observatory "${observatory.id}" because it is used by one or more plates`,
      )
    }

    const [deleted] = await db
      .delete(s.observatory)
      .where(eq(s.observatory.id, data.observatoryId))
      .returning({ id: s.observatory.id })

    return deleted
  })
