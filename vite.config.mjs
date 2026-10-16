import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/fieldops-360/" : "/",
  define: {
    "import.meta.env.VITE_DEMO_MODE": JSON.stringify(
      mode === "pages" ? "browser" : "server",
    ),
  },
  plugins: [react()],
  server: {
    port: 3601,
    proxy: {
      "/api": "http://127.0.0.1:3600",
      "/uploads": "http://127.0.0.1:3600",
    },
  },
  build: { outDir: mode === "pages" ? "dist-pages" : "dist" },
}));
