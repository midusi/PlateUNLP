import { and, eq } from "drizzle-orm"
import sharp from "sharp"
import { db } from "~/db"
import * as s from "~/db/schema"
import { auth } from "~/lib/auth"
import { bufferToArrayBuffer } from "~/lib/node"
import { readUploadedFile } from "~/lib/uploads"

async function getAuthorizedObservation(request: Request, observationId: string) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return { response: new Response("Unauthorized", { status: 401 }) }

  const observation = await db.query.observation.findFirst({
    where: (t, { eq }) => eq(t.id, observationId),
    with: { plate: { with: { image: true } } },
  })
  if (!observation) return { response: new Response("Not found", { status: 404 }) }

  if (session.user.role !== "admin") {
    const [membership] = await db
      .select({ userId: s.userToProject.userId })
      .from(s.userToProject)
      .where(
        and(
          eq(s.userToProject.userId, session.user.id),
          eq(s.userToProject.projectId, observation.plate.projectId),
        ),
      )
      .limit(1)

    if (!membership) return { response: new Response("Forbidden", { status: 403 }) }
  }

  return { observation }
}

export async function getObservationPreviewResponse(
  request: Request,
  observationId: string,
): Promise<Response> {
  const result = await getAuthorizedObservation(request, observationId)
  if (result.response) return result.response

  const { observation } = result
  let image = await readUploadedFile(observation.plate.image.id)
  image = await sharp(image)
    .rotate(observation.plate.imageRotation)
    .extract({
      height: observation.imageHeight,
      top: observation.imageTop,
      left: observation.imageLeft,
      width: observation.imageWidth,
    })
    .toColorspace("srgb")
    .png()
    .toBuffer()

  return new Response(bufferToArrayBuffer(image), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  })
}

export async function getObservationImageResponse(
  request: Request,
  observationId: string,
): Promise<Response> {
  const result = await getAuthorizedObservation(request, observationId)
  if (result.response) return result.response

  const { observation } = result
  let image = await readUploadedFile(observation.plate.image.id)
  image = await sharp(image)
    .rotate(observation.plate.imageRotation)
    .extract({
      height: observation.imageHeight,
      top: observation.imageTop,
      left: observation.imageLeft,
      width: observation.imageWidth,
    })
    .toColorspace("b-w")
    .extractChannel(0)
    .raw({ depth: "ushort" })
    .toBuffer()

  return new Response(bufferToArrayBuffer(image), {
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Image-Width": observation.imageWidth.toString(),
      "X-Image-Height": observation.imageHeight.toString(),
    },
  })
}
