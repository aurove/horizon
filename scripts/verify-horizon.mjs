#!/usr/bin/env node
import { loadRootEnv, run } from "./lib/commands.mjs";
import { CONTRACTS_PACKAGE, WORMHOLE_PACKAGE } from "./lib/commands.mjs";

loadRootEnv();
const network = process.argv[2];
if (network !== "testnet" && network !== "mainnet") {
  throw new Error("Usage: pnpm verify:cross-chain:<testnet|mainnet>");
}
const env = { ...process.env };
const spoke = network === "testnet" ? "base-sepolia" : "base";
run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `verify:${network}`], env);
run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `verify:${spoke}`], env);
run("pnpm", ["--filter", WORMHOLE_PACKAGE, "run", `verify:${network}`], env);
