// import type { RegisteredRouter, ValidateLinkOptions } from "@tanstack/react-router"

// export type Crumb<TOptions = unknown> = ValidateLinkOptions<RegisteredRouter, TOptions> & {
//   title: string
// }

export type Crumb<TOptions = unknown> = {
  title: string
  to: string
  params?: Record<string, string>
}

export function breadcrumb<TOptions = unknown>(obj: Crumb<TOptions>): any {
  return obj
}
