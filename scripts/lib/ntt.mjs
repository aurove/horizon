import { readJson, requireAddress, writeJsonAtomically } from "./config.mjs";
import { run, WORMHOLE_PACKAGE } from "./commands.mjs";

export function initializeNtt(env) {
  run("pnpm", ["run", "ntt:init"], env);
}

export function ensureNttChain(path, network, chain, mode, tokenAddress, expectedOwner) {
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

  run("ntt", ["add-chain", chain, "--latest", "--mode", mode, "--token", tokenAddress, "-p", path], process.env, false, WORMHOLE_PACKAGE);
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

export function pushAndVerifyNtt(path) {
  run("ntt", ["push", "-p", path], process.env, false, WORMHOLE_PACKAGE);
  run("ntt", ["status", "-p", path], process.env, false, WORMHOLE_PACKAGE);
}
