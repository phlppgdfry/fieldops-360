import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3601,
    proxy: {
      "/api": "http://127.0.0.1:3600",
      "/uploads": "http://127.0.0.1:3600",
    },
  },
  build: { outDir: "dist" },
});
