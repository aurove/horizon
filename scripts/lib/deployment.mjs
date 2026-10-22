import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { deployedAddress, readJson, requireAddress } from "./config.mjs";
import { CONTRACTS_PACKAGE, HORIZON_ROOT, run } from "./commands.mjs";
import { configureLimits, ensureNttChain, pushAndVerifyNtt } from "./ntt.mjs";

export const VAULTS = [
  { symbol: "avBTCv", vaultDeployment: "avBTCVault", peerDeployment: "avBTCvPeer", limitEnv: "HORIZON_AVBTCV_NTT_LIMIT" },
  { symbol: "avMEZOv", vaultDeployment: "avMEZOVault", peerDeployment: "avMEZOvPeer", limitEnv: "HORIZON_AVMEZOV_NTT_LIMIT" },
];

export function deployContracts(testnet, env) {
  const network = testnet ? "testnet" : "mainnet";
  const peerNetwork = testnet ? "baseSepolia" : "base";
  if (env.HORIZON_SKIP_CONTRACT_DEPLOYMENT === "YES") {
    const deployments = [
      resolve(HORIZON_ROOT, "contracts", "deployments", network, "VaultFactory.json"),
      ...VAULTS.map(({ vaultDeployment }) =>
        resolve(HORIZON_ROOT, "contracts", "deployments", network, `${vaultDeployment}.json`),
      ),
      ...VAULTS.map(({ peerDeployment }) =>
        resolve(HORIZON_ROOT, "contracts", "deployments", peerNetwork, `${peerDeployment}.json`),
      ),
    ];
    for (const path of deployments) {
      if (!existsSync(path)) throw new Error(`Cannot skip contract deployment; missing ${path}`);
      requireAddress(readJson(path).address, `existing contract in ${path}`);
    }
    console.log("Skipping contract deployment; existing deployment records were validated.");
    run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `verify:${network}`], env);
    run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `verify:${testnet ? "base-sepolia" : "base"}`], env);
    return;
  }
  run("pnpm", ["--filter", CONTRACTS_PACKAGE, "exec", "hardhat", "deploy", "--tags", "VaultFactory,Vaults", "--network", network], env);
  run("pnpm", ["--filter", CONTRACTS_PACKAGE, "exec", "hardhat", "deploy", "--tags", "VaultPeers", "--network", peerNetwork], env);
  run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `verify:${network}`], env);
  run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `verify:${testnet ? "base-sepolia" : "base"}`], env);
}

export function configureVaultPair({ testnet, nttNetwork, hubChain, spokeChain, nttPath, vaultSpec, limit, env }) {
  const contractNetwork = testnet ? "testnet" : "mainnet";
  const peerNetwork = testnet ? "baseSepolia" : "base";
  const suffix = testnet ? "baseSepolia" : "base";
  const vaultPath = resolve(HORIZON_ROOT, "contracts", "deployments", contractNetwork, `${vaultSpec.vaultDeployment}.json`);
  const peerPath = resolve(HORIZON_ROOT, "contracts", "deployments", suffix, `${vaultSpec.peerDeployment}.json`);
  const deploymentPath = resolve(HORIZON_ROOT, "wormhole", nttPath);
  const hubToken = deployedAddress(vaultPath, `${vaultSpec.symbol} Mezo vault`);
  const peerDeployment = readJson(peerPath);
  const spokeToken = requireAddress(peerDeployment.address, `${vaultSpec.symbol} Base peer`);
  const setupOwner = requireAddress(peerDeployment.args?.[2], `${vaultSpec.symbol} peer owner`);

  console.log(`\n=== Configure ${vaultSpec.symbol}: ${hubChain} ↔ ${spokeChain} ===`);
  const hubManager = ensureNttChain(deploymentPath, nttNetwork, hubChain, "locking", hubToken, setupOwner, env);
  const spokeManager = ensureNttChain(deploymentPath, nttNetwork, spokeChain, "burning", spokeToken, setupOwner, env);
  configureLimits(deploymentPath, hubChain, spokeChain, limit);
  pushAndVerifyNtt(deploymentPath, env);

  run("pnpm", ["--filter", CONTRACTS_PACKAGE, "exec", "hardhat", "vault-peer:set-minter", "--network", peerNetwork, "--peer", spokeToken, "--manager", spokeManager], env);
  console.log(`${vaultSpec.symbol}: hub manager ${hubManager}; spoke manager ${spokeManager}; peer minter sealed`);
}
