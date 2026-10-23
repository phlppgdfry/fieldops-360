// Pack only the current mobile app; never roll back live flow definitions.
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
const source = "power-platform/native-solution";
const folder = ".data/canvas-mobile-import";
const name = "fo_fieldops360mobile_46012";
const appFile =
  process.env.FIELDOPS_MSAPP || ".data/FieldOps360Mobile-final.msapp";
await mkdir(folder + "/Other", { recursive: true });
await mkdir(folder + "/CanvasApps", { recursive: true });
let solution = await readFile(source + "/Other/Solution.xml", "utf8");
solution = solution
  .replace(
    "<UniqueName>FieldOps360</UniqueName>",
    "<UniqueName>FieldOps360Canvas</UniqueName>",
  )
  .replace(/<Version>[^<]+<\/Version>/, "<Version>1.2.0.0</Version>")
  .replace(
    /<RootComponents>[\s\S]*?<\/RootComponents>/,
    `<RootComponents><RootComponent type="300" schemaName="${name}" behavior="0" /></RootComponents>`,
  );
await writeFile(folder + "/Other/Solution.xml", solution);
await writeFile(
  folder + "/Other/Customizations.xml",
  '<?xml version="1.0" encoding="utf-8"?><ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><CanvasApps/><Languages><Language>1033</Language></Languages></ImportExportXml>',
);
for (const file of await readdir(source + "/CanvasApps")) {
  if (!file.startsWith(name)) continue;
  if (file.endsWith("_DocumentUri.msapp"))
    await copyFile(appFile, folder + "/CanvasApps/" + file);
  else if (file.endsWith(".meta.xml")) {
    let xml = await readFile(source + "/CanvasApps/" + file, "utf8");
    xml = xml.replace(
      /<AppVersion>[^<]+<\/AppVersion>/,
      `<AppVersion>${new Date().toISOString()}</AppVersion>`,
    );
    await writeFile(folder + "/CanvasApps/" + file, xml);
  } else
    await copyFile(
      source + "/CanvasApps/" + file,
      folder + "/CanvasApps/" + file,
    );
}
execFileSync(
  "pac",
  [
    "solution",
    "pack",
    "--folder",
    folder,
    "--zipfile",
    ".data/FieldOps360Canvas-mobile.zip",
    "--packagetype",
    "Unmanaged",
  ],
  { stdio: "inherit" },
);
