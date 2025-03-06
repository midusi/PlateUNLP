import type { AppRouter } from "@plateunlp/server"
//     👆 **type-only** import

import { createTRPCClient, httpBatchLink } from "@trpc/client"

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: new URL("/api/trpc", window.location.origin),
    }),
  ],
})
