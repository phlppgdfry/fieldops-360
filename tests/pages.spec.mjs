import { test, expect } from "@playwright/test";

test("casepagina speelt de echte native opname en laadt Nederlandse ondertitels", async ({
  page,
}) => {
  await page.goto("case/");
  const video = page.getByLabel("Native Power Apps-demonstratie", {
    exact: true,
  });
  await video.scrollIntoViewIfNeeded();
  await video.evaluate((v) => v.load());
  await expect
    .poll(() =>
      video.evaluate((v) => ({
        width: v.videoWidth,
        height: v.videoHeight,
        durationValid: v.duration > 20 && v.duration < 40,
      })),
    )
    .toEqual({ width: 390, height: 796, durationValid: true });
  await video.evaluate(async (v) => {
    v.muted = true;
    await v.play();
  });
  await expect
    .poll(() => video.evaluate((v) => v.currentTime))
    .toBeGreaterThan(0.1);
  await video.evaluate((v) => v.pause());
  const track = await video.locator("track").getAttribute("src");
  const captions = await page.request.get(new URL(track, page.url()).href);
  expect(captions.ok()).toBe(true);
  expect(await captions.text()).toContain("WEBVTT");
  expect(await captions.text()).toContain("Menselijke bevestiging");
});
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
  await expect(
    page.getByLabel("Lokale webdemo", { exact: true }),
  ).toBeVisible();
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
test("werffilter, paginering, CSV en toegankelijke rondleiding werken op desktop en mobiel", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Beheerder Bekijk" }).click();
  await expect(
    page
      .getByRole("region", { name: "Leveringenoverzicht" })
      .locator("tbody tr"),
  ).toHaveCount(6);
  await page.getByRole("button", { name: "Volgende pagina" }).click();
  await expect(
    page
      .getByRole("region", { name: "Leveringenoverzicht" })
      .locator("tbody tr"),
  ).toHaveCount(2);
  await page.getByLabel("Filter op werf").selectOption("s1");
  const rows = page
    .getByRole("region", { name: "Leveringenoverzicht" })
    .locator("tbody tr");
  await expect(rows).toHaveCount(4);
  for (const row of await rows.all())
    await expect(row).toContainText("Kanaalzone Brugge");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporteer CSV" }).click();
  const file = await download;
  const stream = await file.createReadStream();
  const parts = [];
  for await (const part of stream) parts.push(part);
  const csv = Buffer.concat(parts).toString("utf8");
  expect(csv).toContain("Kanaalzone Brugge");
  expect(csv).not.toContain("N34 Herinrichting");
  expect(csv.split("\r\n")).toHaveLength(5);
  await page.getByLabel("Filter op werf").selectOption("");
  await page.getByRole("button", { name: "Rondleiding", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Een levering registreren",
  );
  await page.getByRole("button", { name: "Volgende stap" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Van bon naar gecontroleerde data",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-v2-desktop.png"),
    fullPage: true,
  });
  await page
    .locator("aside .brand span")
    .screenshot({ path: ".data/canvas-brand.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Nieuwe levering", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Rondleiding", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("tour-v2-mobile.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Rondleiding sluiten" }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Leveringen", exact: true }).click();
  await expect(page.getByLabel("Filter op werf")).toBeVisible();
  expect(errors).toEqual([]);
});
