import { and, eq } from "drizzle-orm"
import sharp from "sharp"
import { db } from "~/db"
import * as s from "~/db/schema"
import { auth } from "~/lib/auth"
import { bufferToArrayBuffer } from "~/lib/node"
import { readUploadedFile } from "~/lib/uploads"

export async function getPlatePreviewResponse(
  request: Request,
  plateId: string,
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response("Unauthorized", { status: 401 })

  const plate = await db.query.plate.findFirst({
    where: (t, { eq }) => eq(t.id, plateId),
    with: { image: true },
  })
  if (!plate) return new Response("Not found", { status: 404 })

  if (session.user.role !== "admin") {
    const [membership] = await db
      .select({ userId: s.userToProject.userId })
      .from(s.userToProject)
      .where(
        and(
          eq(s.userToProject.userId, session.user.id),
          eq(s.userToProject.projectId, plate.projectId),
        ),
      )
      .limit(1)

    if (!membership) return new Response("Forbidden", { status: 403 })
  }

  let image = await readUploadedFile(plate.image.id)
  image = await sharp(image).rotate(plate.imageRotation).toColorspace("srgb").png().toBuffer()

  return new Response(bufferToArrayBuffer(image), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=31536000",
    },
  })
}
