import { and, eq } from "drizzle-orm"
import sharp, { type Sharp } from "sharp"
import { db } from "~/db"
import * as s from "~/db/schema"
import { auth } from "~/lib/auth"
import { bufferToArrayBuffer } from "~/lib/node"
import { buildGeometryMask, isAxisAligned } from "~/lib/oriented-box"
import { readEditedFile } from "~/lib/uploads"

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

type ObservationGeometry = Parameters<typeof buildGeometryMask>[0]

/** Recorta la imagen de la placa al rectangulo de la observacion. */
function cropObservation(plateImage: Buffer, observation: ObservationGeometry): Sharp {
  return sharp(plateImage).extract({
    height: observation.imageHeight,
    top: observation.imageTop,
    left: observation.imageLeft,
    width: observation.imageWidth,
  })
}

/**
 * Pone en 0 los pixeles que caen fuera de la caja orientada de la observacion
 * (las esquinas del rectangulo, que traen fondo y fragmentos de las observaciones
 * vecinas). `pixels` es el recorte tal como sale de sharp: `canales` valores por
 * pixel, y si el ultimo canal es alfa se conserva.
 */
function blackOutsideBox(
  pixels: Uint8Array,
  channels: number,
  observation: ObservationGeometry,
): void {
  const mask = buildGeometryMask(observation)
  if (!mask) return
  const colorChannels = channels % 2 === 0 ? channels - 1 : channels
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) continue
    for (let c = 0; c < colorChannels; c++) pixels[i * channels + c] = 0
  }
}

/**
 * Recorte de la observacion como PNG sRGB, con lo que cae fuera de su caja en
 * negro (salvo con `raw`). Una observacion sin inclinacion se devuelve tal cual.
 */
export async function observationPreviewPng(
  plateImage: Buffer,
  observation: ObservationGeometry,
  { raw = false }: { raw?: boolean } = {},
): Promise<Buffer> {
  const cropped = cropObservation(plateImage, observation).toColorspace("srgb")
  if (raw || isAxisAligned(observation)) return cropped.png().toBuffer()
  const { data, info } = await cropped.raw().toBuffer({ resolveWithObject: true })
  blackOutsideBox(data, info.channels, observation)
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toBuffer()
}

export async function getObservationPreviewResponse(
  request: Request,
  observationId: string,
): Promise<Response> {
  const result = await getAuthorizedObservation(request, observationId)
  if (result.response) return result.response

  const { observation } = result
  // let image = await readUploadedFile(observation.plate.image.id)
  let image = await readEditedFile(observation.plate)
  // `?raw=1`: el recorte tal cual, sin el negro fuera de la caja de la observacion. Es solo
  // para mostrar (la vista "sin nivelar" de la extraccion); la extraccion lee `/image`.
  const raw = new URL(request.url).searchParams.get("raw") === "1"
  image = await observationPreviewPng(image, observation, { raw })

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
  // let image = await readUploadedFile(observation.plate.image.id)
  let image = await readEditedFile(observation.plate)
  // Es la imagen con la que se hacen las cuentas de la extraccion: el recorte tal cual
  // esta en la placa, sin tapar nada. El negro fuera de la caja es solo para mostrar.
  image = await cropObservation(image, observation)
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
