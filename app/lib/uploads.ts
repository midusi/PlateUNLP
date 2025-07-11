import fs from "node:fs/promises"
import { err, ok, type Result } from "neverthrow"
import sharp from "sharp"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { env } from "~/env"

const MimeSchema = z.union([
  z.literal("image/jpeg"),
  z.literal("image/png"),
  z.literal("image/tiff"),
])

type UploadedFile = {
  id: string
  mimeType: z.infer<typeof MimeSchema>
  width: number
  height: number
}

export async function uploadFile(file: File): Promise<Result<UploadedFile, Error>> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeType = MimeSchema.safeParse(file.type)
  if (!mimeType.success) {
    return err(new Error("Invalid file type"))
  }
  const metadata = await sharp(buffer).metadata()

  try {
    const id = await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(s.upload)
        .values({ name: file.name, mimeType: mimeType.data })
        .returning({ id: s.plate.id })
      await fs.writeFile(`${env.UPLOADS_DIR}/${id}`, buffer)
      return id
    })
    return ok({ id, mimeType: mimeType.data, width: metadata.width, height: metadata.height })
  } catch (error) {
    return err(
      new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`),
    )
  }
}

export async function readUploadedFile(id: string): Promise<Buffer> {
  return await fs.readFile(`${env.UPLOADS_DIR}/${id}`)
}
