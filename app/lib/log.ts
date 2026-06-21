import type { RequestLogger } from "evlog"
// Aliased: `useRequest` is Nitro's async-context accessor, not a React hook —
// the alias keeps Biome's rules-of-hooks lint from flagging the call below.
import { useRequest as getNitroRequest } from "nitro/context"

/**
 * The request-scoped evlog logger for the current request.
 *
 * Follows evlog's wide-event model: enrich the single per-request event with
 * `log().set({ ... })` (grouped, meaningful keys) as context becomes available;
 * it auto-emits when the request finishes. Use `log().info/warn/error(...)` only
 * for distinct, notable events. For thrown failures prefer `createError(...)`
 * from `evlog` — the root error middleware attaches it to the event for you.
 *
 * Server-only (reads the Nitro async context); never import from a client component.
 */
export function log(): RequestLogger {
  return (getNitroRequest().context as { log: RequestLogger }).log
}
