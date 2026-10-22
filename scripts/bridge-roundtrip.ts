import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatUnits,
  getAddress,
  JsonRpcProvider,
  parseUnits,
  Wallet,
} from "../contracts/node_modules/ethers/lib.esm/index.js";
import { Vault__factory } from "../contracts/typechain/factories/src/Vault__factory";
import { VaultPeer__factory } from "../contracts/typechain/factories/src/VaultPeer__factory";

const scriptPath = fileURLToPath(import.meta.url);
const horizonRoot = resolve(dirname(scriptPath), "..");
const nttProjectRoot = resolve(homedir(), ".ntt-cli/.checkout");
const outputDirectory = resolve(horizonRoot, "reports");
const precision = 8;
const pollIntervalMs = 12_000;

const vaults = {
  avBTCv: { hubDeployment: "avBTCVault", peerDeployment: "avBTCvPeer" },
  avMEZOv: { hubDeployment: "avMEZOVault", peerDeployment: "avMEZOvPeer" },
} as const;

type VaultSymbol = keyof typeof vaults;
type ChainConfig = {
  token: string;
  manager: string;
  owner: string;
  mode: string;
  limits?: { outbound?: string; inbound?: Record<string, string> };
  transceivers?: { wormhole?: { address?: string } };
};

function fail(message: string): never {
  throw new Error(message);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) fail(`Missing required environment variable ${name}`);
  return value;
}

async function loadRootEnv(): Promise<void> {
  try {
    process.loadEnvFile(resolve(horizonRoot, ".env"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function checkAddress(value: string, label: string): string {
  try {
    return getAddress(value);
  } catch {
    return fail(`Invalid ${label} address: ${value}`);
  }
}

function parseAmount(amount: string, decimals: number): bigint {
  if (!/^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(amount)) {
    fail("Amount must be a positive decimal without exponent notation");
  }
  if (decimals < precision) {
    fail("Token has " + decimals + " decimals, but this NTT CLI preserves " + precision + " decimal places");
  }
  const units = parseUnits(amount, decimals);
  if (units <= 0n) fail("Amount must be greater than zero");
  if (units % 10n ** BigInt(decimals - precision) !== 0n) {
    fail(`NTT transfers preserve up to ${precision} decimal places; amount has excess precision`);
  }
  return units;
}

function nttTransfer(
  source: "Mezo" | "BaseSepolia",
  destination: "Mezo" | "BaseSepolia",
  amount: string,
  destinationAddress: string,
  deploymentPath: string,
  mezoRpc: string,
  baseRpc: string,
  env: NodeJS.ProcessEnv,
  timeoutSeconds: number,
): Promise<string[]> {
  const args = [
    "token-transfer",
    "--network",
    "Testnet",
    "--source-chain",
    source,
    "--destination-chain",
    destination,
    "--destination-address",
    destinationAddress,
    "--amount",
    amount,
    "--deployment-path",
    deploymentPath,
    "--rpc",
    `Mezo=${mezoRpc}`,
    "--rpc",
    `BaseSepolia=${baseRpc}`,
    "--timeout",
    String(timeoutSeconds),
  ];

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("ntt", args, {
      cwd: nttProjectRoot,
      env,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk: Buffer) => process.stderr.write(chunk));
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`ntt token-transfer exited with status ${code}`));
        return;
      }
      const txIds = [...output.matchAll(/Source transaction(?: #\d+)?:\s*(0x[\da-fA-F]{64})/g)]
        .map((match) => match[1]);
      resolvePromise(txIds);
    });
  });
}

async function waitFor(
  label: string,
  check: () => Promise<boolean>,
  timeoutSeconds: number,
): Promise<void> {
  const deadline = Date.now() + timeoutSeconds * 1000;
  let nextLog = 0;
  while (Date.now() < deadline) {
    if (await check()) return;
    if (Date.now() >= nextLog) {
      console.log(`Waiting for ${label}...`);
      nextLog = Date.now() + 60_000;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, pollIntervalMs));
  }
  fail(`Timed out waiting for ${label} after ${timeoutSeconds} seconds`);
}

async function main(): Promise<void> {
  await loadRootEnv();
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  const [symbolInput, amountInput] = args;
  if (!symbolInput || !amountInput || !Object.hasOwn(vaults, symbolInput) || args.length !== 2) {
    fail("Usage: pnpm bridge:roundtrip:testnet -- <avBTCv|avMEZOv> <amount>");
  }
  const symbol = symbolInput as VaultSymbol;
  if (process.env.CONFIRM_HORIZON_TESTNET_ROUNDTRIP !== "YES") {
    fail("Set CONFIRM_HORIZON_TESTNET_ROUNDTRIP=YES after reviewing the testnet transfer amount");
  }
  const privateKey = requiredEnv("HORIZON_ROUNDTRIP_PRIVATE_KEY");
  const mezoRpc = process.env.MEZO_TESTNET_RPC_URL?.trim() || "https://rpc.test.mezo.org";
  const baseRpc = process.env.BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org";
  const timeoutSeconds = Number(process.env.HORIZON_ROUNDTRIP_TIMEOUT_SECONDS || "3600");
  if (!Number.isSafeInteger(timeoutSeconds) || timeoutSeconds < 120 || timeoutSeconds > 14_400) {
    fail("HORIZON_ROUNDTRIP_TIMEOUT_SECONDS must be an integer from 120 to 14400");
  }

  const wallet = new Wallet(privateKey);
  const recipient = getAddress(wallet.address);
  const spec = vaults[symbol];
  const suffix = symbol === "avBTCv" ? "avBTCv" : "avMEZOv";
  const nttPath = resolve(horizonRoot, "wormhole", "vaults", suffix, "testnet", "deployment.json");
  const hubDeploymentPath = resolve(horizonRoot, "contracts", "deployments", "testnet", `${spec.hubDeployment}.json`);
  const peerDeploymentPath = resolve(horizonRoot, "contracts", "deployments", "baseSepolia", `${spec.peerDeployment}.json`);
  const ntt = await readJson<{ network: string; chains: Record<string, ChainConfig> }>(nttPath);
  const hubDeployment = await readJson<{ address: string }>(hubDeploymentPath);
  const peerDeployment = await readJson<{ address: string }>(peerDeploymentPath);
  if (ntt.network !== "Testnet") fail(`${nttPath} is not an NTT Testnet config`);

  const hub = ntt.chains.Mezo;
  const spoke = ntt.chains.BaseSepolia;
  if (!hub?.manager || !spoke?.manager || !hub.transceivers?.wormhole?.address || !spoke.transceivers?.wormhole?.address) {
    fail(`Both NTT managers and Wormhole transceivers must be configured in ${nttPath}`);
  }
  const hubToken = checkAddress(hubDeployment.address, `${symbol} Mezo vault`);
  const spokeToken = checkAddress(peerDeployment.address, `${symbol} Base Sepolia peer`);
  if (checkAddress(hub.token, "Mezo NTT token") !== hubToken) fail("Mezo NTT token does not match the deployed vault");
  if (checkAddress(spoke.token, "Base Sepolia NTT token") !== spokeToken) fail("Base Sepolia NTT token does not match the deployed peer");
  if (checkAddress(hub.owner, "Mezo NTT owner") !== recipient || checkAddress(spoke.owner, "Base Sepolia NTT owner") !== recipient) {
    fail(`HORIZON_ROUNDTRIP_PRIVATE_KEY address ${recipient} must own both NTT managers`);
  }
  if (hub.mode !== "locking" || spoke.mode !== "burning") fail("Expected Mezo locking mode and Base Sepolia burning mode");

  const mezoProvider = new JsonRpcProvider(mezoRpc);
  const baseProvider = new JsonRpcProvider(baseRpc);
  try {
    const [mezoChainId, baseChainId] = await Promise.all([
      mezoProvider.getNetwork().then((network) => Number(network.chainId)),
      baseProvider.getNetwork().then((network) => Number(network.chainId)),
    ]);
    if (mezoChainId !== 31611) fail(`MEZO_TESTNET_RPC_URL returned chain ID ${mezoChainId}, expected 31611`);
    if (baseChainId !== 84532) fail(`BASE_SEPOLIA_RPC_URL returned chain ID ${baseChainId}, expected 84532`);

    const vault = Vault__factory.connect(hubToken, mezoProvider);
    const peer = VaultPeer__factory.connect(spokeToken, baseProvider);
    const [hubDecimals, spokeDecimals] = await Promise.all([vault.decimals(), peer.decimals()]);
    if (hubDecimals !== spokeDecimals) fail(`Token decimals differ: Mezo ${hubDecimals}, Base Sepolia ${spokeDecimals}`);
    const decimals = Number(hubDecimals);
    const amount = parseAmount(amountInput, decimals);
    const amountText = formatUnits(amount, decimals);

    const [peerMinter, peerOwner] = await Promise.all([peer.minter(), peer.owner()]);
    if (getAddress(peerMinter) !== getAddress(spoke.manager)) {
      fail("Base Sepolia VaultPeer minter " + peerMinter + " does not match configured NTT manager " + spoke.manager);
    }
    if (getAddress(peerOwner) !== "0x0000000000000000000000000000000000000000") {
      fail("Base Sepolia VaultPeer ownership is not sealed (current owner: " + peerOwner + ")");
    }

    const limits = [
      [hub.limits?.outbound, "Mezo outbound"],
      [hub.limits?.inbound?.BaseSepolia, "Mezo inbound from Base Sepolia"],
      [spoke.limits?.outbound, "Base Sepolia outbound"],
      [spoke.limits?.inbound?.Mezo, "Base Sepolia inbound from Mezo"],
    ] as const;
    for (const [limitText, label] of limits) {
      if (!limitText || amount > parseUnits(limitText, decimals)) fail(`${label} limit is missing or below ${amountText}`);
    }

    const [startHub, startSpoke, mezoNative, baseNative] = await Promise.all([
      vault.balanceOf(recipient),
      peer.balanceOf(recipient),
      mezoProvider.getBalance(recipient),
      baseProvider.getBalance(recipient),
    ]);
    if (startHub < amount) fail(`Insufficient ${symbol} on Mezo: ${formatUnits(startHub, decimals)} available, ${amountText} required`);
    if (mezoNative === 0n || baseNative === 0n) fail("The signer needs native gas tokens on both Mezo testnet and Base Sepolia");

    console.log(`Testnet round trip: ${symbol} ${amountText}, Mezo → Base Sepolia → Mezo`);
    console.log(`Wallet: ${recipient}`);
    console.log(`Starting balances — Mezo: ${formatUnits(startHub, decimals)}; Base Sepolia: ${formatUnits(startSpoke, decimals)}`);

    const env = { ...process.env, ETH_PRIVATE_KEY: privateKey };
    const outboundTxs = await nttTransfer("Mezo", "BaseSepolia", amountText, recipient, nttPath, mezoRpc, baseRpc, env, timeoutSeconds);
    await waitFor(`${amountText} ${symbol} on Base Sepolia`, async () =>
      (await peer.balanceOf(recipient)) >= startSpoke + amount,
    timeoutSeconds);
    const afterOutbound = {
      hub: await vault.balanceOf(recipient),
      spoke: await peer.balanceOf(recipient),
    };
    if (afterOutbound.hub !== startHub - amount || afterOutbound.spoke !== startSpoke + amount) {
      fail(`Outbound leg balance mismatch: Mezo ${formatUnits(afterOutbound.hub, decimals)}, Base Sepolia ${formatUnits(afterOutbound.spoke, decimals)}. The transfer may have completed partially; inspect both balances before retrying.`);
    }

    const returnTxs = await nttTransfer("BaseSepolia", "Mezo", amountText, recipient, nttPath, mezoRpc, baseRpc, env, timeoutSeconds);
    await waitFor(`${amountText} ${symbol} back on Mezo`, async () =>
      (await vault.balanceOf(recipient)) >= startHub,
    timeoutSeconds);
    await waitFor(`${symbol} balance restored on Base Sepolia`, async () =>
      (await peer.balanceOf(recipient)) <= startSpoke,
    timeoutSeconds);

    const [endHub, endSpoke] = await Promise.all([vault.balanceOf(recipient), peer.balanceOf(recipient)]);
    if (endHub !== startHub || endSpoke !== startSpoke) {
      fail(`Round trip did not conserve balances: Mezo ${formatUnits(endHub, decimals)} (start ${formatUnits(startHub, decimals)}); Base Sepolia ${formatUnits(endSpoke, decimals)} (start ${formatUnits(startSpoke, decimals)})`);
    }

    const report = {
      status: "passed",
      network: "Testnet",
      token: symbol,
      amount: amountText,
      wallet: recipient,
      chainIds: { Mezo: mezoChainId, BaseSepolia: baseChainId },
      contracts: { Mezo: { token: hubToken, manager: hub.manager }, BaseSepolia: { token: spokeToken, manager: spoke.manager } },
      balances: {
        start: { Mezo: formatUnits(startHub, decimals), BaseSepolia: formatUnits(startSpoke, decimals) },
        afterOutbound: { Mezo: formatUnits(afterOutbound.hub, decimals), BaseSepolia: formatUnits(afterOutbound.spoke, decimals) },
        end: { Mezo: formatUnits(endHub, decimals), BaseSepolia: formatUnits(endSpoke, decimals) },
      },
      transactions: { MezoToBaseSepolia: outboundTxs, BaseSepoliaToMezo: returnTxs },
      completedAt: new Date().toISOString(),
    };
    await mkdir(outputDirectory, { recursive: true });
    const reportPath = resolve(outputDirectory, `bridge-roundtrip-${symbol}-${Date.now()}.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
    console.log(`\nRound trip passed. Balances were restored on both chains.`);
    console.log(`Report: ${reportPath}`);
  } finally {
    mezoProvider.destroy();
    baseProvider.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
