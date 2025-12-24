import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import react from "@vitejs/plugin-react"
import mdx from "fumadocs-mdx/vite"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import * as MdxConfig from "./source.config"

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "app",
      spa: { enabled: true },
    }),
    nitro(),
    react(),
    mdx(MdxConfig),
  ],
  experimental: { enableNativePlugin: "v1" },
  resolve: { tsconfigPaths: true },
  assetsInclude: ["**/*.onnx"],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
})
