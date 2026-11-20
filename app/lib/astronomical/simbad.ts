/**
 * @fileoverview
 * This file contains functions to query the SIMBAD database.
 * It uses the SIMBAD script service to query the database and get the metadata for a given object.
 */

import dedent from "dedent"
import { err, ok, type Result } from "neverthrow"
import { z } from "zod"
import { log } from "~/lib/log"

/**
 * SIMBAD service hosted by the Strasbourg Astronomical Data Center (CDS)
 * (https://simbad.cds.unistra.fr/guide/sim-url.htx)
 *
 * URL to SIMBAD script mode.
 * - They suggest not submitting more than 10 queries per second (may blacklist your IP),
 *   see https://cds.unistra.fr/help/faq/simbad/#d3349066167
 * - It's recommended to use the TAP service instead, but we're using the script service
 *   because it does coordinate transformations and other things that TAP doesn't do.
 */
const SIMBAD_URLS = [
  "https://simbad.cds.unistra.fr/simbad/sim-script",
  "https://simbad.cfa.harvard.edu/simbad/sim-script",
] as const
const SIMBAD_TIMEOUT_MS = 5_000

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? `: ${error.cause.message}` : ""
    return `${error.name}: ${error.message}${cause}`
  }
  return String(error)
}

export class SimbadUnavailableError extends Error {
  readonly serverErrors: { url: string; reason: string }[]

  constructor(serverErrors: { url: string; reason: string }[]) {
    super("SIMBAD service unavailable")
    this.name = "SimbadUnavailableError"
    this.serverErrors = serverErrors
  }
}

/**
 * Queries SIMBAD script service.
 *
 * This function adds `output script=off` at the beginning of the script string, so don't include it in the script.
 * Then, it checks if the output threw an error and returns it.
 * Otherwise, it splits the lines of the output and returns it as a `string[]`.
 *
 * @see https://simbad.cds.unistra.fr/guide/sim-fscript.htx
 */
async function querySimbad(script: string): Promise<Result<string[], Error>> {
  script = `output script=off\n${script}`
  const body = new URLSearchParams()
  body.set("script", script)

  const serverErrors: { url: string; reason: string }[] = []

  for (const [index, url] of SIMBAD_URLS.entries()) {
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(SIMBAD_TIMEOUT_MS),
      })
    } catch (error) {
      const reason = getErrorMessage(error)
      serverErrors.push({ url, reason })
      if (index < SIMBAD_URLS.length - 1) {
        log().warn("SIMBAD: server failed, trying the next one", { failedServer: url, reason })
      }
      continue
    }

    if (!response.ok) {
      const reason = `${response.status} ${response.statusText}`
      serverErrors.push({ url, reason })
      if (index < SIMBAD_URLS.length - 1) {
        log().warn("SIMBAD: server failed, trying the next one", { failedServer: url, reason })
      }
      continue
    }

    const text = await response.text()
    const lines = text.split("\n")
    let result: "data" | "error" | null = null
    let i = 0
    while (i < lines.length && result === null) {
      if (lines[i].startsWith("::data::")) result = "data"
      if (lines[i].startsWith("::error::")) result = "error"
      i++
    }

    if (result === "data") {
      i++
      return ok(lines.slice(i, -2))
    } else if (result === "error") {
      i++
      return err(new Error(lines.slice(i, -2).join("\n")))
    } else {
      const reason = "Couldn't parse SIMBAD response"
      log().warn("SIMBAD: unexpected response", { url, preview: text.slice(0, 200) })
      serverErrors.push({ url, reason })
      if (index < SIMBAD_URLS.length - 1) {
        log().warn("SIMBAD: server failed, trying the next one", { failedServer: url, reason })
      }
    }
  }
  return err(new SimbadUnavailableError(serverErrors))
}

const queryObjectByIdResultSchema = z.object({
  "MAIN-ID": z.string(),
  RA: z.coerce.number(),
  DEC: z.coerce.number(),
  RA2000: z.coerce.number(),
  DEC2000: z.coerce.number(),
  RA1950: z.coerce.number(),
  DEC1950: z.coerce.number(),
  SPTYPE: z.string().transform((s) => s || null),
})

/**
 * Queries SIMBAD and gets the metadata for a given object by its identifier.
 * @param object The identifier of the object to be queried.
 * @param epoch The epoch of the coordinates to be returned (like "J2000.0" or "B1950.0").
 * @param equinox The equinox of the coordinates to be returned (like "2000.0" or "1950.0").
 */
export async function queryObjectById(
  object: string,
  epoch: string,
  equinox: string,
): Promise<Result<z.output<typeof queryObjectByIdResultSchema>, Error>> {
  const script = dedent.withOptions({ escapeSpecialCharacters: false })`
    format object "%MAIN_ID\n"+
    "%COO(d;A;FK4;${epoch};${equinox})\n"+
    "%COO(d;D;FK4;${epoch};${equinox})\n"+
    "%COO(d;A;ICRS;J2000;2000)\n"+
    "%COO(d;D;ICRS;J2000;2000)\n"+
    "%COO(d;A;FK4;B1950;1950)\n"+
    "%COO(d;D;FK4;B1950;1950)\n"+
    "%SP(S)"
    query id ${object}
  `
  const res = await querySimbad(script)
  if (res.isErr()) return err(res.error)

  const parsed = queryObjectByIdResultSchema.safeParse({
    "MAIN-ID": res.value[0],
    RA: res.value[1],
    DEC: res.value[2],
    RA2000: res.value[3],
    DEC2000: res.value[4],
    RA1950: res.value[5],
    DEC1950: res.value[6],
    SPTYPE: res.value[7],
  })
  if (!parsed.success) return err(new Error(z.prettifyError(parsed.error)))

  return ok(parsed.data)
}
