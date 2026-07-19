import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  base: "/hamster-private-room/",
  plugins: [react()],
})
