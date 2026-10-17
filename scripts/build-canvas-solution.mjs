// App-only imports avoid overwriting live flow definitions while iterating Canvas UI.
import { readFile, writeFile, mkdir, cp, copyFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const folder = ".data/canvas-import";
await cp("power-platform/canvas-solution", folder, { recursive: true });
await mkdir(folder + "/Other", { recursive: true });
await mkdir(folder + "/CanvasApps", { recursive: true });
const name = "fo_fieldops360native_c065c";
let solution = await readFile(
  "power-platform/canvas-solution/Other/Solution.xml",
  "utf8",
);
solution = solution
  .replace(
    /<UniqueName>FieldOps360<\/UniqueName>/,
    "<UniqueName>FieldOps360Canvas</UniqueName>",
  )
  .replace(/<Version>[^<]+<\/Version>/, "<Version>1.1.0.0</Version>")
  .replace(
    /<RootComponents>[\s\S]*?<\/RootComponents>/,
    `<RootComponents><RootComponent type="300" schemaName="${name}" behavior="0" /></RootComponents>`,
  )
  .replaceAll('languagecode="1043"', 'languagecode="1033"');
await writeFile(folder + "/Other/Solution.xml", solution);
await writeFile(
  folder + "/Other/Customizations.xml",
  '<?xml version="1.0" encoding="utf-8"?><ImportExportXml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><CanvasApps/><Languages><Language>1033</Language></Languages></ImportExportXml>',
);
const manifest = JSON.parse(
  await readFile("power-platform/canvas-native/CanvasManifest.json", "utf8"),
);
let meta = await readFile(
  `power-platform/canvas-solution/CanvasApps/${name}.meta.xml`,
  "utf8",
);
meta = meta.replace(
  /<DatabaseReferences>[\s\S]*?<\/DatabaseReferences>/,
  `<DatabaseReferences>${manifest.Properties.LocalDatabaseReferences.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</DatabaseReferences>`,
);
await writeFile(`${folder}/CanvasApps/${name}.meta.xml`, meta);
await copyFile(
  "power-platform/FieldOps360Native.msapp",
  `${folder}/CanvasApps/${name}_DocumentUri.msapp`,
);
await copyFile(
  `power-platform/canvas-solution/CanvasApps/${name}_BackgroundImageUri`,
  `${folder}/CanvasApps/${name}_BackgroundImageUri`,
);
execFileSync(
  "pac",
  [
    "solution",
    "pack",
    "--folder",
    folder,
    "--zipfile",
    ".data/FieldOps360Canvas.zip",
    "--packagetype",
    "Unmanaged",
  ],
  { stdio: "inherit" },
);
