import { chromium } from "@playwright/test";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
await mkdir("docs/evidence/recording", { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: "docs/evidence/recording",
    size: { width: 1440, height: 1000 },
  },
});
const page = await context.newPage();
const cues = [];
const started = Date.now();
async function hold(text, seconds) {
  cues.push({ start: (Date.now() - started) / 1000, text });
  console.log(text);
  await page.waitForTimeout(seconds * 1000);
}
await page.goto("http://127.0.0.1:3600");
await page.getByRole("button", { name: "Beheerder Bekijk" }).click();
await hold(
  "FieldOps 360: een fictieve bouwgroep digitaliseert leveringen, goedkeuringen en ERP-overdracht.",
  12,
);
await page.getByLabel("Demonstratierol").selectOption("driver");
await page.setViewportSize({ width: 390, height: 844 });
await page
  .getByRole("button", { name: "Nieuwe levering", exact: true })
  .click();
await page
  .getByLabel("Leveringsbon uploaden")
  .setInputFiles("samples/leveringsbon.png");
await page.getByLabel("Bonnummer", { exact: true }).waitFor();
await page.waitForFunction(
  () => document.querySelector('input[type="text"]')?.value === "OCR-2026-001",
);
await hold(
  "Echte Apple Vision OCR leest de bonfoto. De chauffeur controleert het voorstel.",
  14,
);
const reference = "DEMO-" + Date.now();
await page.getByLabel("Bonnummer", { exact: true }).fill(reference);
await page
  .getByRole("textbox", { name: "Afwijking of opmerking" })
  .fill("6 ton minder geleverd; leverancier plant nalevering.");
await hold(
  "18 ton geleverd, 24 besteld: meer dan 5% afwijking vereist een toelichting.",
  10,
);
await page.getByRole("button", { name: "Dossier aanmaken" }).click();
await page
  .getByRole("button", { name: "Ik heb de gegevens gecontroleerd" })
  .click();
await page.getByRole("button", { name: "Leveringen", exact: true }).count();
await page.getByRole("button", { name: reference, exact: true }).click();
await hold(
  "Menselijke bevestiging is verplicht voordat de bon ter goedkeuring gaat.",
  10,
);
await page.getByRole("button", { name: "Indienen ter goedkeuring" }).click();
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByLabel("Demonstratierol").selectOption("manager");
await page.getByRole("button", { name: /Goedkeuringen/ }).click();
await page.getByRole("button", { name: reference, exact: true }).click();
await hold(
  "Een onafhankelijke werfleider beoordeelt de afwijking en het auditspoor.",
  14,
);
await page.getByRole("button", { name: "Goedkeuren", exact: true }).click();
await page.waitForTimeout(2200);
await page.getByRole("button", { name: "Leveringen", exact: true }).click();
await page.getByRole("button", { name: reference, exact: true }).click();
await hold(
  "De ERP-test-API bevestigt ontvangst. Idempotentie voorkomt dubbele verwerking.",
  12,
);
await page.getByRole("button", { name: "Sluiten", exact: true }).click();
await page.getByLabel("Demonstratierol").selectOption("admin");
await page.getByRole("button", { name: "Automatisering", exact: true }).click();
await hold(
  "Drie lokale workflows: goedkeuring, ERP-synchronisatie en foutmelding met herstel.",
  14,
);
await page.getByRole("button", { name: "Businesscase", exact: true }).click();
await hold(
  "De businesscase rekent met zichtbare aannames. Dit zijn geen gerealiseerde besparingen.",
  12,
);
await page
  .getByRole("spinbutton", { name: "Minuten bespaard per levering" })
  .fill("3");
await hold(
  "Native Power Platform-installatie wordt afzonderlijk gevalideerd. Broncode, tests en documentatie staan in de repository.",
  12,
);
const duration = (Date.now() - started) / 1000;
const video = page.video();
await context.close();
const path = await video.path();
await copyFile(path, "docs/evidence/demo.webm");
await browser.close();
const ts = (n) => {
  const h = Math.floor(n / 3600),
    m = Math.floor((n % 3600) / 60),
    s = Math.floor(n % 60),
    ms = Math.floor((n % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
};
await writeFile(
  "docs/evidence/demo.nl.vtt",
  "WEBVTT\n\n" +
    cues
      .map(
        (c, i) =>
          `${i + 1}\n${ts(c.start)} --> ${ts(cues[i + 1]?.start ?? duration)}\n${c.text}\n`,
      )
      .join("\n"),
);
console.log("Video ready", duration);
