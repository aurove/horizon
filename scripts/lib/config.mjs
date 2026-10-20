import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeJsonAtomically(path, value) {
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  renameSync(temporaryPath, path);
}

export function requireAddress(value, label) {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`Missing or invalid ${label} address: ${String(value)}`);
  }
  return value;
}

export function deployedAddress(path, label) {
  if (!existsSync(path)) throw new Error(`Missing deployment file for ${label}: ${path}`);
  return requireAddress(readJson(path).address, label);
}
