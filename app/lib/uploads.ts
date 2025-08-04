import fs from "node:fs/promises"
import { eq } from "drizzle-orm"
import { err, ok, type Result } from "neverthrow"
import sharp from "sharp"
import { z } from "zod"
import { SUPPORTED_PLATE_MIMETYPES } from "~/consts"
import { db } from "~/db"
import * as s from "~/db/schema"
import { env } from "~/env"

const MimeSchema = z.enum(SUPPORTED_PLATE_MIMETYPES)

type UploadedFile = {
  id: string
  mimeType: z.infer<typeof MimeSchema>
  width: number
  height: number
}

export async function uploadFile(
  file: File,
  { rotate }: { rotate?: number } = {},
): Promise<Result<UploadedFile, Error>> {
  const arrayBuffer = await file.arrayBuffer()
  const mimeType = MimeSchema.safeParse(file.type)
  if (!mimeType.success) {
    return err(new Error("Invalid file type"))
  }
  const image = sharp(arrayBuffer).rotate(rotate ?? 0)

  try {
    const id = await db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(s.upload)
        .values({ name: file.name, mimeType: mimeType.data })
        .returning({ id: s.plate.id })
      await fs.writeFile(`${env.UPLOADS_DIR}/${id}`, await image.toBuffer())
      return id
    })
    const metadata = await image.metadata()
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

export async function deleteUploadedFile(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(s.upload).where(eq(s.upload.id, id))
    await fs.rm(`${env.UPLOADS_DIR}/${id}`)
  })
}
