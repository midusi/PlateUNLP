import { createServerFn } from "@tanstack/react-start"
import { and, eq, like } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { log } from "~/lib/log"
import { uploadFile } from "~/lib/uploads"

export const uploadPlate = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(async ({ data }) => {
    const projectId = data.get("projectId")
    if (typeof projectId !== "string") {
      log().warn("plate upload rejected", { reason: "malformed projectId" })
      return { success: false as const, error: "Malformed input" }
    }

    const rotate = z.coerce.number().int().safeParse(data.get("rotate"))
    if (!rotate.success) {
      log().warn("plate upload rejected", { reason: "malformed rotate", projectId })
      return { success: false as const, error: "Malformed input" }
    }

    const plate = data.get("plate")
    if (!(plate instanceof File)) {
      log().warn("plate upload rejected", { reason: "missing file", projectId })
      return { success: false as const, error: "Missing file" }
    }

    const image = await uploadFile(plate, { rotate: rotate.data })
    if (image.isErr()) {
      log().warn("plate upload failed", {
        reason: "image processing",
        projectId,
        error: image.error.message,
      })
      return { success: false as const, error: image.error.message }
    }

    const plates = await db.$count(
      s.plate,
      and(eq(s.plate.projectId, projectId), like(s.plate["PLATE-N"], "New plate%")),
    )

    const result = await db
      .insert(s.plate)
      .values({
        projectId,
        "PLATE-N": plates === 0 ? "New plate" : `New plate (${plates + 1})`,
        imageId: image.value.id,
        imageWidth: image.value.width,
        imageHeight: image.value.height,
        imageRotation: ((rotate.data % 360) + 360) % 360,
        metadataCompletion: 0,
      })
      .returning({ id: s.plate.id })
    log().set({
      plate: {
        id: result[0].id,
        projectId,
        width: image.value.width,
        height: image.value.height,
      },
    })
    log().info("plate uploaded")
    return { success: true as const, plateId: result[0].id }
  })
