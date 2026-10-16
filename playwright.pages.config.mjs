import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "pages.spec.mjs",
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL:
      process.env.PAGES_BASE_URL || "http://127.0.0.1:3604/fieldops-360/",
    viewport: { width: 1440, height: 1000 },
    headless: true,
  },
  webServer: process.env.PAGES_BASE_URL
    ? undefined
    : {
        command: "node scripts/serve-pages.mjs",
        url: "http://127.0.0.1:3604/fieldops-360/",
        reuseExistingServer: !process.env.CI,
      },
  reporter: "list",
});
