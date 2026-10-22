import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readJson, requireAddress, writeJsonAtomically } from "./config.mjs";
import { run, NTT_PROJECT_ROOT } from "./commands.mjs";

function configureNttRpcOverrides(env) {
  const mainnet = env.HORIZON_NTT_NETWORK === "Mainnet";
  const chains = {
    ...(env[mainnet ? "MEZO_MAINNET_RPC_URL" : "MEZO_TESTNET_RPC_URL"]
      ? { Mezo: { rpc: env[mainnet ? "MEZO_MAINNET_RPC_URL" : "MEZO_TESTNET_RPC_URL"] } }
      : {}),
    ...(env[mainnet ? "BASE_RPC_URL" : "BASE_SEPOLIA_RPC_URL"]
      ? { [mainnet ? "Base" : "BaseSepolia"]: { rpc: env[mainnet ? "BASE_RPC_URL" : "BASE_SEPOLIA_RPC_URL"] } }
      : {}),
  };
  if (Object.keys(chains).length === 0) return;

  const path = resolve(NTT_PROJECT_ROOT, "overrides.json");
  const existing = existsSync(path) ? readJson(path) : {};
  writeFileSync(path, JSON.stringify({ ...existing, chains: { ...existing.chains, ...chains } }, null, 2));
}

export function initializeNtt(env) {
  run("pnpm", ["run", "ntt:init"], env);
}

export function ensureNttChain(path, network, chain, mode, tokenAddress, expectedOwner, env = process.env) {
  configureNttRpcOverrides(env);
  let config = readJson(path);
  if (config.network !== network) {
    throw new Error(`${path} is for ${config.network}; expected ${network}`);
  }
  const existing = config.chains?.[chain];
  if (existing) {
    const manager = requireAddress(existing.manager, `${chain} NTT Manager`);
    const token = requireAddress(existing.token, `${chain} NTT token`);
    const owner = requireAddress(existing.owner, `${chain} NTT owner`);
    if (token.toLowerCase() !== tokenAddress.toLowerCase()) {
      throw new Error(`${path} already has ${chain} token ${token}, but contracts deploy ${tokenAddress}; refusing to replace an existing NTT deployment`);
    }
    if (existing.mode !== mode) throw new Error(`${path} has ${chain} in ${existing.mode} mode; expected ${mode}`);
    if (owner.toLowerCase() !== expectedOwner.toLowerCase()) {
      throw new Error(`${path} has ${chain} NTT owner ${owner}, but the current deployment signer is ${expectedOwner}`);
    }
    console.log(`${chain} already deployed: ${manager}`);
    return manager;
  }

  const args = ["add-chain", chain, "--latest", "--mode", mode, "--token", tokenAddress, "--yes", "-p", path];
  if (env.HORIZON_SKIP_NTT_VERIFY === "YES") args.push("--skip-verify");
  run("ntt", args, env, false, NTT_PROJECT_ROOT);
  config = readJson(path);
  const added = config.chains?.[chain];
  const manager = requireAddress(added?.manager, `${chain} NTT Manager`);
  const token = requireAddress(added?.token, `${chain} NTT token`);
  const owner = requireAddress(added?.owner, `${chain} NTT owner`);
  if (token.toLowerCase() !== tokenAddress.toLowerCase() || added.mode !== mode || owner.toLowerCase() !== expectedOwner.toLowerCase()) {
    throw new Error(`NTT CLI wrote unexpected ${chain} configuration to ${path}`);
  }
  return manager;
}

export function configureLimits(path, hubChain, spokeChain, limit) {
  const config = readJson(path);
  for (const [localChain, remoteChain] of [[hubChain, spokeChain], [spokeChain, hubChain]]) {
    const chain = config.chains?.[localChain];
    if (!chain) throw new Error(`Missing ${localChain} config in ${path}`);
    chain.limits ??= {};
    chain.limits.outbound = limit;
    chain.limits.inbound ??= {};
    chain.limits.inbound[remoteChain] = limit;
  }
  writeJsonAtomically(path, config);
}

export function pushAndVerifyNtt(path, env = process.env) {
  configureNttRpcOverrides(env);
  const args = ["push", "--yes", "-p", path];
  if (env.HORIZON_SKIP_NTT_VERIFY === "YES") args.push("--skip-verify");
  run("ntt", args, env, false, NTT_PROJECT_ROOT);
  run("ntt", ["status", "-p", path], env, false, NTT_PROJECT_ROOT);
}
