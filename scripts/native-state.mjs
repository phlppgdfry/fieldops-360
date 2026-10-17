import { mkdir } from "node:fs/promises";
export async function nativeState(name) {
  const env = process.env.POWER_PLATFORM_ENVIRONMENT_ID;
  if (!env || !/^[A-Za-z0-9-]+$/.test(env))
    throw Error("Geldige POWER_PLATFORM_ENVIRONMENT_ID vereist");
  const dir = `.data/environments/${env}`;
  await mkdir(dir, { recursive: true });
  return `${dir}/${name}.json`;
}
