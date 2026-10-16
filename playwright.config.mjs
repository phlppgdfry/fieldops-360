import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "ui.spec.mjs",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3600",
    viewport: { width: 1440, height: 1000 },
    video: "on",
    headless: true,
  },
  reporter: "list",
});
