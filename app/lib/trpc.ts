import type { AppRouter } from "../../server/routers"
//     👆 **type-only** import

import { createTRPCClient, httpBatchLink } from "@trpc/client"

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: new URL("/api/trpc", window.location.origin),
    }),
  ],
})
