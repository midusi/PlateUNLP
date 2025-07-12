import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { eventHandler, getWebRequest } from "vinxi/http"

import { appRouter } from "./routers"

export default eventHandler(async (event) => {
  const request = getWebRequest(event)
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext() {
      return {}
    },
  })
})
