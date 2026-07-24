import evlog from "evlog/nitro/v3"
import { defineConfig } from "nitro"

export default defineConfig({
  experimental: {
    asyncContext: true,
  },
  handlers: [
    {
      route: "/api/plate/:plateId/preview",
      method: "GET",
      handler: "./app/api/plate/[plateId]/preview.ts",
    },
    {
      route: "/api/observation/:observationId/preview",
      method: "GET",
      handler: "./app/api/observation/[observationId]/preview.ts",
    },
    {
      route: "/api/observation/:observationId/image",
      method: "GET",
      handler: "./app/api/observation/[observationId]/image.ts",
    },
  ],
  modules: [
    evlog({
      env: { service: "plateunlp" },
      pretty: true, // dev and prod
    }),
  ],
})
