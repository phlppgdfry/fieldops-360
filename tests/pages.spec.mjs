import { test, expect } from "@playwright/test";
test("GitHub Pages: echte browser-OCR, verplichte menscontrole en gesimuleerde ERP-keten", async ({
  page,
  context,
}, testInfo) => {
  const errors = [],
    unexpected = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = new URL(testInfo.project.use.baseURL);
  context.on("request", (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== base.origin)
      unexpected.push(r.url());
  });
  await page.goto("./");
  await expect(page).toHaveTitle(/FieldOps 360/);
  await expect(page.getByText("Deze publieke oefenomgeving")).toBeVisible();
  await page.getByRole("button", { name: "Chauffeur Registreer" }).click();
  await expect(page.getByText("geen Microsoft-verbinding")).toBeVisible();
  await page
    .getByRole("button", { name: "Nieuwe levering", exact: true })
    .click();
  await page
    .getByLabel("Leveringsbon uploaden")
    .setInputFiles("samples/leveringsbon.png");
  await expect(page.getByLabel("Bonnummer", { exact: true })).toHaveValue(
    "OCR-2026-001",
    { timeout: 90000 },
  );
  await expect(page.getByLabel("Geleverde hoeveelheid")).toHaveValue("18");
  await expect(
    page.getByText("Tesseract.js · echte OCR op dit toestel"),
  ).toBeVisible();
  const reference = "PAGES-" + Date.now();
  await page.getByLabel("Bonnummer", { exact: true }).fill(reference);
  await page
    .getByRole("textbox", { name: "Afwijking of opmerking" })
    .fill("6 ton ontbreekt; nalevering afgesproken.");
  await page.getByRole("button", { name: "Dossier aanmaken" }).click();
  await expect(
    page.getByRole("button", { name: "Ik heb de gegevens gecontroleerd" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Indienen ter goedkeuring" }),
  ).toHaveCount(0);
  const fileTab = page.waitForEvent("popup");
  await page
    .getByRole("button", { name: "Origineel document bekijken" })
    .click();
  const image = await fileTab;
  await expect(image).toHaveURL(/^blob:/);
  await image.close();
  await page
    .getByRole("button", { name: "Ik heb de gegevens gecontroleerd" })
    .click();
  await page.getByRole("button", { name: reference, exact: true }).click();
  await page.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
  await page.getByLabel("Demonstratierol").selectOption("admin");
  await page
    .getByRole("button", { name: "Automatisering", exact: true })
    .click();
  await page.getByRole("button", { name: "ERP-storing simuleren" }).click();
  await page.getByLabel("Demonstratierol").selectOption("manager");
  await page.getByRole("button", { name: /Goedkeuringen/ }).click();
  await page.getByRole("button", { name: reference, exact: true }).click();
  await page.getByRole("button", { name: "Goedkeuren", exact: true }).click();
  await page.getByLabel("Demonstratierol").selectOption("admin");
  await page
    .getByRole("button", { name: "Automatisering", exact: true })
    .click();
  const job = page.locator("tbody tr").filter({ hasText: reference });
  await expect(job).toContainText("dead", { timeout: 20000 });
  await expect(page.getByText("Simulatie: ERP poging 3 mislukt")).toBeVisible();
  await page.getByRole("button", { name: "ERP herstellen" }).click();
  await job.getByRole("button", { name: "Herstarten" }).click();
  await expect(job).toContainText("done");
  await page.getByRole("button", { name: "Leveringen", exact: true }).click();
  await expect(
    page.locator("tbody tr").filter({ hasText: reference }),
  ).toContainText("Gesynchroniseerd");
  await page.reload();
  await expect(
    page.locator("tbody tr").filter({ hasText: reference }),
  ).toContainText("Gesynchroniseerd");
  await page.getByRole("button", { name: reference, exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("DEMO-ERP-");
  await page.getByRole("button", { name: "Sluiten", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("pages-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Nieuwe levering", exact: true })
    .click();
  await page.screenshot({
    path: testInfo.outputPath("pages-mobile.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Sluiten", exact: true }).click();
  expect(errors).toEqual([]);
  expect(unexpected).toEqual([]);
  await page.goto("case/");
  await expect(
    page.getByRole("heading", { name: /Grip op elke levering/ }),
  ).toBeVisible();
  await expect(page.locator("video")).toBeVisible();
});
test("bezoekers hebben eigen opslag en tekst wordt niet als AI voorgesteld", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Chauffeur Registreer" }).click();
  await page
    .getByRole("button", { name: "Nieuwe levering", exact: true })
    .click();
  await page.getByLabel("Leveringsbon uploaden").setInputFiles({
    name: "bon.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Bonnummer: TXT-100\nLeverancier: Test Beton\nHoeveelheid: 24\nEenheid: ton",
    ),
  });
  await expect(page.getByText("text-parser (geen AI)")).toBeVisible();
  await page.getByRole("button", { name: "Sluiten", exact: true }).click();
  await page.getByRole("button", { name: "Nieuwe oefensessie" }).click();
  await expect(page.getByText("Deze publieke oefenomgeving")).toBeVisible();
});
