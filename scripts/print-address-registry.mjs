#!/usr/bin/env node
/**
 * Print the Horizon address registry table from checked-in deployment JSON.
 * Usage: node scripts/print-address-registry.mjs [testnet|mainnet]
 */
import { resolve } from "node:path";
import { HORIZON_ROOT } from "./lib/commands.mjs";
import { readJson, requireAddress } from "./lib/config.mjs";

const network = process.argv[2] ?? "testnet";
if (network !== "testnet" && network !== "mainnet") {
  throw new Error("Usage: node scripts/print-address-registry.mjs [testnet|mainnet]");
}

const hubDir = network === "testnet" ? "testnet" : "mainnet";
const spokeDir = network === "testnet" ? "baseSepolia" : "base";
const hubLabel = network === "testnet" ? "Mezo testnet" : "Mezo mainnet";
const spokeLabel = network === "testnet" ? "Base Sepolia" : "Base";
const hubExplorer =
  network === "testnet" ? "https://explorer.test.mezo.org" : "https://explorer.mezo.org";
const spokeExplorer =
  network === "testnet" ? "https://sepolia.basescan.org" : "https://basescan.org";
const nttHub = "Mezo";
const nttSpoke = network === "testnet" ? "BaseSepolia" : "Base";

function addr(path, label) {
  return requireAddress(readJson(path).address, label);
}

function vaultAsset(path, label) {
  const deployment = readJson(path);
  requireAddress(deployment.address, label);
  return requireAddress(deployment.linkedData?.asset, `${label} asset`);
}

function nttChain(vault, chainName) {
  const path = resolve(HORIZON_ROOT, "wormhole/vaults", vault, network, "deployment.json");
  const deployment = readJson(path);
  const chain = deployment.chains?.[chainName];
  if (!chain) throw new Error(`Missing ${chainName} in ${path}`);
  return {
    manager: requireAddress(chain.manager, `${vault} ${chainName} manager`),
    transceiver: requireAddress(
      chain.transceivers?.wormhole?.address,
      `${vault} ${chainName} transceiver`,
    ),
    token: requireAddress(chain.token, `${vault} ${chainName} token`),
    owner: chain.owner ? requireAddress(chain.owner, `${vault} ${chainName} owner`) : undefined,
  };
}

function row(name, address, explorer) {
  console.log(`| ${name} | \`${address}\` | ${explorer}/address/${address} |`);
}

const factory = addr(
  resolve(HORIZON_ROOT, "contracts/deployments", hubDir, "VaultFactory.json"),
  "VaultFactory",
);
const avBtcVault = addr(
  resolve(HORIZON_ROOT, "contracts/deployments", hubDir, "avBTCVault.json"),
  "avBTCVault",
);
const avMezoVault = addr(
  resolve(HORIZON_ROOT, "contracts/deployments", hubDir, "avMEZOVault.json"),
  "avMEZOVault",
);
const avBtcAsset = vaultAsset(
  resolve(HORIZON_ROOT, "contracts/deployments", hubDir, "avBTCVault.json"),
  "avBTCVault",
);
const avMezoAsset = vaultAsset(
  resolve(HORIZON_ROOT, "contracts/deployments", hubDir, "avMEZOVault.json"),
  "avMEZOVault",
);
const avBtcPeer = addr(
  resolve(HORIZON_ROOT, "contracts/deployments", spokeDir, "avBTCvPeer.json"),
  "avBTCvPeer",
);
const avMezoPeer = addr(
  resolve(HORIZON_ROOT, "contracts/deployments", spokeDir, "avMEZOvPeer.json"),
  "avMEZOvPeer",
);

const avBtcNttHub = nttChain("avBTCv", nttHub);
const avBtcNttSpoke = nttChain("avBTCv", nttSpoke);
const avMezoNttHub = nttChain("avMEZOv", nttHub);
const avMezoNttSpoke = nttChain("avMEZOv", nttSpoke);

console.log(`# Horizon ${network} address registry\n`);
console.log(`Generated from deployment JSON under contracts/ and wormhole/.\n`);

console.log(`## ${hubLabel} — vaults\n`);
console.log("| Contract | Address | Explorer |");
console.log("| --- | --- | --- |");
row("VaultFactory", factory, hubExplorer);
row("avBTC Vault (avBTCv)", avBtcVault, hubExplorer);
row("avMEZO Vault (avMEZOv)", avMezoVault, hubExplorer);
row("avBTC Id20", avBtcAsset, hubExplorer);
row("avMEZO Id20", avMezoAsset, hubExplorer);

console.log(`\n## ${spokeLabel} — VaultPeer tokens\n`);
console.log("| Contract | Address | Explorer |");
console.log("| --- | --- | --- |");
row("avBTCv peer", avBtcPeer, spokeExplorer);
row("avMEZOv peer", avMezoPeer, spokeExplorer);

console.log(`\n## Wormhole NTT — avBTCv\n`);
console.log("| Chain | Role | Address | Explorer |");
console.log("| --- | --- | --- | --- |");
console.log(
  `| ${nttHub} | NTT manager | \`${avBtcNttHub.manager}\` | ${hubExplorer}/address/${avBtcNttHub.manager} |`,
);
console.log(
  `| ${nttHub} | Wormhole transceiver | \`${avBtcNttHub.transceiver}\` | ${hubExplorer}/address/${avBtcNttHub.transceiver} |`,
);
console.log(
  `| ${nttHub} | Token (vault) | \`${avBtcNttHub.token}\` | ${hubExplorer}/address/${avBtcNttHub.token} |`,
);
console.log(
  `| ${nttSpoke} | NTT manager | \`${avBtcNttSpoke.manager}\` | ${spokeExplorer}/address/${avBtcNttSpoke.manager} |`,
);
console.log(
  `| ${nttSpoke} | Wormhole transceiver | \`${avBtcNttSpoke.transceiver}\` | ${spokeExplorer}/address/${avBtcNttSpoke.transceiver} |`,
);
console.log(
  `| ${nttSpoke} | Token (peer) | \`${avBtcNttSpoke.token}\` | ${spokeExplorer}/address/${avBtcNttSpoke.token} |`,
);

console.log(`\n## Wormhole NTT — avMEZOv\n`);
console.log("| Chain | Role | Address | Explorer |");
console.log("| --- | --- | --- | --- |");
console.log(
  `| ${nttHub} | NTT manager | \`${avMezoNttHub.manager}\` | ${hubExplorer}/address/${avMezoNttHub.manager} |`,
);
console.log(
  `| ${nttHub} | Wormhole transceiver | \`${avMezoNttHub.transceiver}\` | ${hubExplorer}/address/${avMezoNttHub.transceiver} |`,
);
console.log(
  `| ${nttHub} | Token (vault) | \`${avMezoNttHub.token}\` | ${hubExplorer}/address/${avMezoNttHub.token} |`,
);
console.log(
  `| ${nttSpoke} | NTT manager | \`${avMezoNttSpoke.manager}\` | ${spokeExplorer}/address/${avMezoNttSpoke.manager} |`,
);
console.log(
  `| ${nttSpoke} | Wormhole transceiver | \`${avMezoNttSpoke.transceiver}\` | ${spokeExplorer}/address/${avMezoNttSpoke.transceiver} |`,
);
console.log(
  `| ${nttSpoke} | Token (peer) | \`${avMezoNttSpoke.token}\` | ${spokeExplorer}/address/${avMezoNttSpoke.token} |`,
);

if (avBtcNttHub.owner) {
  console.log(`\nDeployer / NTT owner: \`${avBtcNttHub.owner}\``);
}

console.log(`\nVerify: \`pnpm verify:cross-chain:${network}\``);
console.log(`Docs: docs/address-registry.md`);
