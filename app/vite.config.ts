import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"

export default defineConfig({
  plugins: [react(), viteStaticCopy({
    targets: [{
      src: "node_modules/onnxruntime-web/dist/*.wasm",
      dest: "./models",
    }],
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
