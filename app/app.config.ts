import react from "@vitejs/plugin-react"
import { createApp } from "vinxi"
import { viteStaticCopy } from "vite-plugin-static-copy"
import tsconfigPaths from "vite-tsconfig-paths"

export default createApp({
  server: {
    preset: "node-server", // change to 'netlify' or 'bun' or anyof the supported presets for nitro (nitro.unjs.io)
  },
  routers: [
    {
      type: "static",
      name: "public",
      dir: "./public",
    },
    {
      type: "http",
      name: "trpc",
      base: "/api/trpc",
      handler: "./trpc-server.handler.ts",
      target: "server",
      plugins: () => [],
    },
    {
      type: "spa",
      name: "client",
      handler: "./index.html",
      target: "browser",
      plugins: () => [
        tsconfigPaths(),
        react(),
        viteStaticCopy({
          targets: [{
            src: "node_modules/onnxruntime-web/dist/*.wasm",
            dest: "./models",
          }],
        }),
      ],
    },
  ],
})
