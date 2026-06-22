import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { log } from "~/lib/log"
import { deleteUploadedFile } from "~/lib/uploads"

export const deleteProject = createServerFn({ method: "POST" })
  .validator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const plates = await db
      .select({ id: s.plate.id, imageId: s.plate.imageId })
      .from(s.plate)
      .where(eq(s.plate.projectId, data.projectId))

    for (const plate of plates) {
      await db.delete(s.plate).where(eq(s.plate.id, plate.id))
      await deleteUploadedFile(plate.imageId)
    }

    await db.delete(s.userToProject).where(eq(s.userToProject.projectId, data.projectId))
    await db.delete(s.project).where(eq(s.project.id, data.projectId))

    log().set({ project: { id: data.projectId, platesDeleted: plates.length } })
    log().info("project deleted")
  })
