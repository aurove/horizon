#!/usr/bin/env node
import { normalizeLimit, requiredEnv, run } from "./lib/commands.mjs";
import { configureVaultPair, deployContracts, VAULTS } from "./lib/deployment.mjs";
import { initializeNtt } from "./lib/ntt.mjs";

function buildDeploymentEnvironment(testnet) {
  const privateKey = requiredEnv("ETH_PRIVATE_KEY");
  return {
    ...process.env,
    ETH_PRIVATE_KEY: privateKey,
    ...(testnet
      ? { TESTNET_PRIVATE_KEY: privateKey, BASE_SEPOLIA_PRIVATE_KEY: privateKey }
      : { MAINNET_PRIVATE_KEY: privateKey, BASE_PRIVATE_KEY: privateKey }),
  };
}

function runDeployment(network) {
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error("Usage: pnpm deploy:cross-chain:<testnet|mainnet>");
  }
  if (process.env.CONFIRM_HORIZON_DEPLOYMENT !== "YES") {
    throw new Error("Set CONFIRM_HORIZON_DEPLOYMENT=YES after reviewing the deployment plan");
  }
  if (network === "mainnet" && process.env.CONFIRM_HORIZON_MAINNET_DEPLOYMENT !== "YES") {
    throw new Error("Mainnet also requires CONFIRM_HORIZON_MAINNET_DEPLOYMENT=YES");
  }

  const testnet = network === "testnet";
  const env = buildDeploymentEnvironment(testnet);
  const nttVersion = run("ntt", ["--version"], process.env, true);
  if (!/1\.10\.0/.test(nttVersion)) {
    throw new Error(`Expected pinned NTT CLI v1.10.0+cli; found: ${nttVersion}`);
  }
  if (!testnet) requiredEnv("MAINNET_RPC_URL");

  const hubChain = "Mezo";
  const spokeChain = testnet ? "BaseSepolia" : "Base";
  const nttNetwork = testnet ? "Testnet" : "Mainnet";
  const suffix = testnet ? "testnet" : "mainnet";
  const limits = Object.fromEntries(VAULTS.map((vault) => [vault.symbol, normalizeLimit(vault.limitEnv)]));

  console.log(`Preparing Horizon ${network}: deploy Mezo vaults, ${spokeChain} peers, NTT managers, peer links, limits, and spoke minters.`);
  console.log(`Signer: shared deployer key; spoke network: ${testnet ? "baseSepolia" : "base"}`);
  deployContracts(testnet, env);
  initializeNtt(env);

  for (const vault of VAULTS) {
    configureVaultPair({
      testnet,
      nttNetwork,
      hubChain,
      spokeChain,
      nttPath: `vaults/${vault.symbol}/${suffix}/deployment.json`,
      vaultSpec: vault,
      limit: limits[vault.symbol],
      env,
    });
  }
  console.log(`\nHorizon ${network} deployment and NTT configuration completed.`);
}

try {
  runDeployment(process.argv[2]);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
