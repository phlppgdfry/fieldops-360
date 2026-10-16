import { test, expect } from "@playwright/test";
test("dashboard, zoeken, mobiele registratie, goedkeuring en ERP", async ({
  page,
}) => {
  const reference = "UI-" + Date.now();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/FieldOps 360/);
  await page.getByRole("button", { name: "Beheerder Bekijk" }).click();
  await expect(
    page.getByRole("heading", { name: "Overzicht", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidence/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Zoek leveringen").fill("LB-2026-1041");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Zoek leveringen").fill("ONBESTAAND");
  await expect(page.getByText("Geen leveringen gevonden")).toBeVisible();
  await page.getByLabel("Zoek leveringen").fill("");
  await page.getByLabel("Demonstratierol").selectOption("driver");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Nieuwe levering", exact: true })
    .click();
  await page.getByLabel("Bonnummer", { exact: true }).fill(reference);
  await page.getByLabel("Leverancier", { exact: true }).fill("Demo Beton");
  await page.getByLabel("Geleverde hoeveelheid").fill("24");
  await page.screenshot({
    path: "docs/evidence/mobile-registration.png",
    fullPage: false,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Dossier aanmaken" }).click();
  await expect(page.getByRole("dialog")).toContainText("Concept");
  await page.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByLabel("Demonstratierol").selectOption("manager");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /Goedkeuringen/ }).click();
  await page.getByRole("button", { name: reference, exact: true }).click();
  await page.getByRole("button", { name: "Goedkeuren", exact: true }).click();
  await page.getByRole("button", { name: "Leveringen", exact: true }).click();
  await expect(page.locator("tr").filter({ hasText: reference })).toContainText(
    "Gesynchroniseerd",
    { timeout: 10000 },
  );
  await page.screenshot({
    path: "docs/evidence/approved-synced.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Businesscase", exact: true }).click();
  await expect(page.getByText("Netto potentieel per jaar")).toBeVisible();
  expect(errors).toEqual([]);
});
