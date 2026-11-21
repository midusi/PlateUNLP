/** Indica si un error de Drizzle/SQLite es una violación de UNIQUE (incluye claves primarias). */
export function isUniqueConstraintError(err: unknown): boolean {
  const cause = err instanceof Error ? err.cause : undefined
  return cause instanceof Error && cause.message.includes("UNIQUE constraint failed")
}
