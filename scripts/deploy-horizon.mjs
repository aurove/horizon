#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  CONTRACTS_PACKAGE,
  HORIZON_ROOT,
  WORMHOLE_PACKAGE,
  loadRootEnv,
  normalizeLimit,
  requiredEnv,
  run,
} from "./lib/commands.mjs";
import { configureVaultPair, deployContracts, VAULTS } from "./lib/deployment.mjs";
import { initializeNtt } from "./lib/ntt.mjs";

const AERO_PACKAGE = "@aurove/horizon-aero";

/**
 * Optional post-step for Base Sepolia Slipstream + share/MUSD pools.
 * Gated by HORIZON_RUN_AERO=YES. Never fails the main cross-chain deploy.
 */
function maybeRunAeroPools(testnet, env) {
  if (!testnet) {
    console.log("Skipping aero pool hook on mainnet (use aero scripts explicitly).");
    return;
  }
  if (process.env.HORIZON_RUN_AERO !== "YES") {
    console.log(
      "Optional aero hook skipped (set HORIZON_RUN_AERO=YES to run Slipstream deploy + create-horizon-pools after NTT).",
    );
    return;
  }
  console.log("HORIZON_RUN_AERO=YES — attempting Slipstream deploy + Horizon pool create (non-fatal)…");
  try {
    run("pnpm", ["--filter", AERO_PACKAGE, "run", "deploy:slipstream:base-sepolia:broadcast"], env);
  } catch (error) {
    console.warn("Aero Slipstream deploy skipped/failed (continuing):", error instanceof Error ? error.message : error);
    return;
  }
  // Prefer a real Base Sepolia MUSD (MUSD_ADDRESS / address book) over DemoMUSD.
  const hasMusd =
    Boolean(process.env.MUSD_ADDRESS?.trim()) ||
    (() => {
      try {
        const bookPath = `${HORIZON_ROOT}/aero/deployments/baseSepolia/addresses.json`;
        const book = JSON.parse(readFileSync(bookPath, "utf8"));
        return Boolean(book.MUSD && book.MUSD !== "0x0000000000000000000000000000000000000000");
      } catch {
        return false;
      }
    })();
  if (hasMusd) {
    console.log("Skipping DemoMUSD — MUSD_ADDRESS or address-book MUSD is set.");
  } else {
    try {
      run("pnpm", ["--filter", AERO_PACKAGE, "run", "deploy:demo-musd:broadcast"], env);
    } catch (error) {
      console.warn("DemoMUSD deploy skipped/failed (continuing):", error instanceof Error ? error.message : error);
    }
  }
  try {
    run("pnpm", ["--filter", AERO_PACKAGE, "run", "create:horizon-pools:broadcast"], env);
  } catch (error) {
    console.warn("Horizon pool create skipped/failed (continuing):", error instanceof Error ? error.message : error);
  }
  console.log(`Aero address books under ${HORIZON_ROOT}/aero/deployments/baseSepolia/`);
}

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

function runDeployment(network, reset) {
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error("Usage: pnpm deploy:cross-chain:<testnet|mainnet>");
  }
  if (process.env.CONFIRM_HORIZON_DEPLOYMENT !== "YES") {
    throw new Error("Set CONFIRM_HORIZON_DEPLOYMENT=YES after reviewing the deployment plan");
  }
  if (network === "mainnet" && process.env.CONFIRM_HORIZON_MAINNET_DEPLOYMENT !== "YES") {
    throw new Error("Mainnet also requires CONFIRM_HORIZON_MAINNET_DEPLOYMENT=YES");
  }
  if (reset && process.env.CONFIRM_HORIZON_REDEPLOYMENT !== "YES") {
    throw new Error("Set CONFIRM_HORIZON_REDEPLOYMENT=YES to replace deployment records/configs and deploy fresh contracts and NTT managers");
  }

  const testnet = network === "testnet";
  const env = buildDeploymentEnvironment(testnet);
  const nttNetwork = testnet ? "Testnet" : "Mainnet";
  const nttEnv = {
    ...env,
    HORIZON_NTT_NETWORK: nttNetwork,
    MEZO_VERIFIER: "blockscout",
    MEZO_VERIFIER_URL: testnet ? "https://api.explorer.test.mezo.org/api" : "https://api.explorer.mezo.org/api",
    [testnet ? "BASESEPOLIA_VERIFIER" : "BASE_VERIFIER"]: "etherscan",
    [testnet ? "BASESEPOLIA_SCAN_API_KEY" : "BASE_SCAN_API_KEY"]: process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "",
    ...(reset ? { CONFIRM_NTT_REDEPLOYMENT: "YES" } : {}),
    // Mezo vault bytecode targets Cancun; match the fork runtime during NTT simulation.
    FOUNDRY_HARDFORK: process.env.FOUNDRY_HARDFORK || "cancun",
  };
  const nttVersion = run("ntt", ["--version"], process.env, true);
  if (!/^ntt v1\.7\.0 \(/.test(nttVersion)) {
    throw new Error(`Expected NTT CLI package v1.7.0 from the pinned v1.10.0+cli release; found: ${nttVersion}`);
  }
  if (!testnet) requiredEnv("MEZO_MAINNET_RPC_URL");
  if (process.env.HORIZON_SKIP_NTT_VERIFY !== "YES" && !nttEnv[testnet ? "BASESEPOLIA_SCAN_API_KEY" : "BASE_SCAN_API_KEY"]) {
    throw new Error("Set BASESCAN_API_KEY or ETHERSCAN_API_KEY to verify NTT contracts on BaseScan");
  }

  const hubChain = "Mezo";
  const spokeChain = testnet ? "BaseSepolia" : "Base";
  const suffix = testnet ? "testnet" : "mainnet";
  const limits = Object.fromEntries(VAULTS.map((vault) => [vault.symbol, normalizeLimit(vault.limitEnv)]));

  if (reset && process.env.HORIZON_SKIP_CONTRACT_DEPLOYMENT === "YES") {
    throw new Error("A fresh redeployment cannot use HORIZON_SKIP_CONTRACT_DEPLOYMENT=YES");
  }
  console.log(`Preparing Horizon ${network}${reset ? " fresh redeployment" : " deployment"}: Mezo vaults, ${spokeChain} peers, NTT managers, peer links, limits, and spoke minters.`);
  console.log(`Signer: shared deployer key; spoke network: ${testnet ? "baseSepolia" : "base"}`);
  if (reset) {
    run("pnpm", ["--filter", CONTRACTS_PACKAGE, "run", `redeploy:${network}`], {
      ...env,
      CONFIRM_CONTRACTS_REDEPLOYMENT: "YES",
    });
    run("pnpm", ["--filter", WORMHOLE_PACKAGE, "run", `ntt:redeploy:${network}`], nttEnv);
  } else {
    deployContracts(testnet, env);
  }
  initializeNtt(nttEnv);

  for (const vault of VAULTS) {
    configureVaultPair({
      testnet,
      nttNetwork,
      hubChain,
      spokeChain,
      nttPath: `vaults/${vault.symbol}/${suffix}/deployment.json`,
      vaultSpec: vault,
      limit: limits[vault.symbol],
      env: nttEnv,
    });
  }
  console.log(`\nHorizon ${network} deployment and NTT configuration completed.`);
  maybeRunAeroPools(testnet, env);
}

try {
  loadRootEnv();
  const reset = process.argv[3] === "--reset";
  if (process.argv.length > 4 || (process.argv[3] && !reset)) {
    throw new Error("Usage: node scripts/deploy-horizon.mjs <testnet|mainnet> [--reset]");
  }
  runDeployment(process.argv[2], reset);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
