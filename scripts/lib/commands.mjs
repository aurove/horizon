import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

export const HORIZON_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const NTT_PROJECT_ROOT = resolve(homedir(), ".ntt-cli/.checkout");
export const CONTRACTS_PACKAGE = "@aurove/horizon-contracts";
export const WORMHOLE_PACKAGE = "@aurove/horizon-wormhole";

export function loadRootEnv() {
  const envPath = resolve(HORIZON_ROOT, ".env");
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

export function run(command, args, env = process.env, capture = false, cwd = HORIZON_ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture) {
      if (result.stdout) process.stderr.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);
    }
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
  return capture ? result.stdout.trim() : "";
}

export function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export function normalizeLimit(name) {
  const value = requiredEnv(name);
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,18}))?$/.exec(value);
  if (!match) throw new Error(`${name} must be a decimal amount with at most 18 fractional digits`);
  const fraction = (match[2] ?? "").padEnd(18, "0");
  if (BigInt(match[1]) === 0n && BigInt(fraction || "0") === 0n) {
    throw new Error(`${name} must be greater than zero; NTT defaults to zero transfer limits`);
  }
  return `${match[1]}.${fraction}`;
}
