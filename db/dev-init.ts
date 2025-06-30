import fs from "node:fs/promises"

async function initDatabase() {
  await fs.rm("./.local/", { recursive: true, force: true })
  await fs.mkdir("./.local/uploads", { recursive: true })
}

initDatabase()
  .then(() => console.log(".local directory initialized"))
  .catch((error) => {
    console.error("Error initializing .local directory:", error)
  })
