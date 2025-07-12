import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { uploadFile } from "~/lib/uploads"

export const addPlate = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(async ({ data }) => {
    const projectId = data.get("projectId")
    if (typeof projectId !== "string") return { success: false as const, error: "Malformed input" }

    const plate = data.get("plate")
    if (!(plate instanceof File)) return { success: false as const, error: "Missing file" }

    const image = await uploadFile(plate)
    if (image.isErr()) {
      return { success: false as const, error: image.error.message }
    }
    const result = await db
      .insert(s.plate)
      .values({
        projectId,
        imageId: image.value.id,
        imageWidth: image.value.width,
        imageHeight: image.value.height,
      })
      .returning({ id: s.plate.id })
    return { success: true as const, plateId: result[0].id }
  })
