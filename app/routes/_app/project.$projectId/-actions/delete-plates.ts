import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { deleteUploadedFile } from "~/lib/uploads"

export const deletePlates = createServerFn({ method: "POST" })
  .inputValidator(z.object({ plateIds: z.string().array() }))
  .handler(async ({ data }) => {
    for (const plateId of data.plateIds) {
      const result = await db
        .delete(s.plate)
        .where(eq(s.plate.id, plateId))
        .returning({ uploadId: s.plate.imageId })
      if (result.length === 0) continue
      await deleteUploadedFile(result[0].uploadId)
    }
  })
