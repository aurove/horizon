/**
 * Verify minimal Slipstream + stub contracts on Base Sepolia Basescan (Etherscan API V2).
 *
 * Reads addresses from deployments/baseSepolia/addresses.json and constructor args
 * from broadcast/DeployMinimalCL.s.sol/84532/run-latest.json when present.
 *
 * Requires BASESCAN_API_KEY or ETHERSCAN_API_KEY (and forge/cast on PATH).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AERO_ROOT = resolve(__dirname, "..");
const HORIZON_ROOT = resolve(AERO_ROOT, "..");
const ADDRESSES_PATH = join(AERO_ROOT, "deployments", "baseSepolia", "addresses.json");
const BROADCAST_PATH = join(AERO_ROOT, "broadcast", "DeployMinimalCL.s.sol", "84532", "run-latest.json");
const CHAIN_ID = 84532;
const VERIFIER_URL = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}`;

loadEnv({ path: join(HORIZON_ROOT, ".env") });
loadEnv({ path: join(AERO_ROOT, ".env") });

type AddressBook = Record<string, unknown>;

type BroadcastTx = {
  contractName?: string;
  contractAddress?: string;
  arguments?: string[];
};

function apiKey(): string {
  const key = process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY;
  if (!key) throw new Error("Set BASESCAN_API_KEY or ETHERSCAN_API_KEY");
  return key;
}

function rpcUrl(): string {
  return process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
}

function run(cmd: string, args: string[]): void {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, { cwd: AERO_ROOT, env: process.env, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} exited with ${result.status ?? 1}`);
  }
}

function encodeConstructor(types: string, values: string[]): string {
  const result = spawnSync("cast", ["abi-encode", `constructor(${types})`, ...values], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`cast abi-encode failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function verify(address: string, contract: string, constructorTypes?: string, constructorValues?: string[]): void {
  const args = [
    "verify-contract",
    address,
    contract,
    "--chain",
    String(CHAIN_ID),
    "--rpc-url",
    rpcUrl(),
    "--watch",
    "--verifier",
    "etherscan",
    "--verifier-url",
    VERIFIER_URL,
    "--etherscan-api-key",
    apiKey(),
  ];
  if (constructorTypes && constructorValues) {
    args.push("--constructor-args", encodeConstructor(constructorTypes, constructorValues));
  }
  console.log(`\n==== Verifying ${contract} @ ${address} ====`);
  run("forge", args);
}

function main(): void {
  if (!existsSync(ADDRESSES_PATH)) {
    throw new Error(`Missing ${ADDRESSES_PATH}`);
  }
  const book = JSON.parse(readFileSync(ADDRESSES_PATH, "utf8")) as AddressBook;
  const broadcast: BroadcastTx[] = existsSync(BROADCAST_PATH)
    ? (JSON.parse(readFileSync(BROADCAST_PATH, "utf8")).transactions as BroadcastTx[])
    : [];

  const byName = new Map<string, BroadcastTx>();
  for (const tx of broadcast) {
    if (tx.contractName) byName.set(tx.contractName, tx);
  }

  const WETH = String(book.WETH || "0x4200000000000000000000000000000000000006");
  const registry = String(book.MinimalFactoryRegistry);
  const legacy = String(book.MinimalLegacyCLFactory);
  const voter = String(book.MinimalVoter);
  const descriptor = String(book.MinimalPositionDescriptor);
  const poolImpl = String(book.PoolImplementation);
  const factory = String(book.PoolFactory);
  const npm = String(book.NonfungiblePositionManager);
  const router = String(book.SwapRouter);
  const quoter = String(book.QuoterV2);

  verify(registry, "src/stubs/MinimalFactoryRegistry.sol:MinimalFactoryRegistry");
  verify(legacy, "src/stubs/MinimalLegacyCLFactory.sol:MinimalLegacyCLFactory");
  verify(descriptor, "src/stubs/MinimalPositionDescriptor.sol:MinimalPositionDescriptor");
  verify(voter, "src/stubs/MinimalVoter.sol:MinimalVoter", "address", [registry]);
  verify(poolImpl, "slipstream/contracts/core/CLPool.sol:CLPool");
  verify(factory, "slipstream/contracts/core/CLFactory.sol:CLFactory", "address,address,address", [
    voter,
    legacy,
    poolImpl,
  ]);
  verify(
    npm,
    "slipstream/contracts/periphery/NonfungiblePositionManager.sol:NonfungiblePositionManager",
    "address,address,address,string,string",
    [
      factory,
      WETH,
      descriptor,
      ...(byName.get("NonfungiblePositionManager")?.arguments?.slice(3) ?? [
        "Horizon Slipstream Positions",
        "HZN-CL-POS",
      ]),
    ],
  );
  verify(router, "slipstream/contracts/periphery/SwapRouter.sol:SwapRouter", "address,address", [
    factory,
    WETH,
  ]);
  verify(quoter, "slipstream/contracts/periphery/lens/QuoterV2.sol:QuoterV2", "address,address", [
    factory,
    WETH,
  ]);

  console.log("\nAll Aero Slipstream contracts submitted for Basescan verification.");
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
