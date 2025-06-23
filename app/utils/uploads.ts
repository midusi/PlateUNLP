import fs from "node:fs/promises"
import { err, ok, type Result } from "neverthrow"
import { z } from "zod/v4"
import { db } from "~/db"
import * as s from "~/db/schema"
import { env } from "~/env"

const MimeSchema = z.union([
  z.literal("image/jpeg"),
  z.literal("image/png"),
  z.literal("image/tiff"),
])

export async function uploadFile(file: File): Promise<Result<string, Error>> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = MimeSchema.safeParse(file.type)
  if (!mimeType.success) {
    return err(new Error("Invalid file type"))
  }

  try {
    const id = await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(s.upload)
        .values({ name: file.name, mimeType: mimeType.data })
        .returning({ id: s.plate.id })
      await fs.writeFile(`${env.UPLOADS_DIR}/${id}`, buffer)
      return id
    })
    return ok(id)
  } catch (error) {
    return err(
      new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`),
    )
  }
}

export async function readUploadedFile(id: string): Promise<Buffer> {
  return await fs.readFile(`${env.UPLOADS_DIR}/${id}`)
}
