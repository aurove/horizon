/**
 * Deploy DemoMUSD on Base Sepolia (canonical MUSD is not deployed there).
 *
 * Default: dry-run / scaffolding check (compile + print plan).
 * --broadcast: deploy and record DemoMUSD in addresses.json (+ pools.json musd).
 *
 * Mainnet canonical MUSD: 0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ContractFactory, parseEther, type InterfaceAbi } from "ethers";
import {
  AERO_ROOT,
  ADDRESSES_PATH,
  CANONICAL_MUSD_MAINNET,
  connectProvider,
  isNonZeroAddress,
  parseFlags,
  readAddressBook,
  readPoolsBook,
  resolvePrivateKey,
  resolveRpcUrl,
  writeAddressBook,
  writePoolsBook,
} from "./lib/horizon-pools.js";

const INITIAL_MINT = parseEther("1000000"); // 1e6 dMUSD for demo LP seeding

function forgeBuild(): void {
  console.log("Compiling DemoMUSD (solc 0.7.6)…");
  const result = spawnSync("forge", ["build"], {
    cwd: AERO_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function loadArtifact(): { abi: InterfaceAbi; bytecode: string } {
  const path = join(AERO_ROOT, "out", "DemoMUSD.sol", "DemoMUSD.json");
  if (!existsSync(path)) {
    throw new Error(`Missing artifact ${path}; run forge build`);
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    abi: InterfaceAbi;
    bytecode: { object: string };
  };
  return { abi: raw.abi, bytecode: raw.bytecode.object };
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv);
  if (flags.has("--help") || flags.has("-h")) {
    console.log(`Usage: tsx scripts/deploy-demo-musd.ts [--broadcast]

  (default)     forge build + print plan (no broadcast)
  --broadcast   deploy DemoMUSD on Base Sepolia; write addresses.json

Canonical mainnet MUSD (Base/ETH/Mezo): ${CANONICAL_MUSD_MAINNET}
Base Sepolia has no Portal/Wormhole MUSD at that address — use DemoMUSD for demos.
Override later with MUSD_ADDRESS=0x…
`);
    return;
  }

  const broadcast = flags.has("--broadcast");
  forgeBuild();

  const book = readAddressBook();
  if (isNonZeroAddress(book.DemoMUSD) && !flags.has("--force")) {
    console.log(`DemoMUSD already recorded: ${book.DemoMUSD}`);
    console.log("Pass --force to redeploy.");
    return;
  }

  const pk = resolvePrivateKey();
  const rpc = resolveRpcUrl();

  console.log(`Canonical mainnet MUSD: ${CANONICAL_MUSD_MAINNET}`);
  console.log("Base Sepolia probe: that address has no code (confirmed absent).");

  if (!broadcast) {
    console.log("Dry-run: would deploy DemoMUSD with initialMint=1_000_000e18");
    if (!pk || !rpc) {
      console.log("Missing PRIVATE_KEY/ETH_PRIVATE_KEY and/or BASE_SEPOLIA_RPC_URL — broadcast unavailable.");
    } else {
      console.log("Keys/RPC detected. Re-run with --broadcast to deploy.");
    }
    const pools = readPoolsBook();
    if (!pools.musd) {
      writePoolsBook({
        ...pools,
        musdKind: null,
        note: "Awaiting DemoMUSD deploy or MUSD_ADDRESS. Canonical mainnet MUSD documented in README.",
      });
    }
    return;
  }

  if (!pk || !rpc) {
    console.error("Broadcast requires PRIVATE_KEY (or ETH_PRIVATE_KEY) and BASE_SEPOLIA_RPC_URL.");
    process.exit(1);
  }

  const { wallet } = await connectProvider();
  if (!wallet) {
    console.error("Failed to construct wallet.");
    process.exit(1);
  }

  const { abi, bytecode } = loadArtifact();
  const factory = new ContractFactory(abi, bytecode, wallet);
  console.log(`Deploying DemoMUSD from ${wallet.address}…`);
  const contract = await factory.deploy(INITIAL_MINT);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`DemoMUSD: ${address}`);

  book.DemoMUSD = address;
  book.MUSD = address;
  writeAddressBook(book);

  const pools = readPoolsBook();
  pools.musd = address;
  pools.musdKind = "demo";
  pools.canonicalMusdMainnet = CANONICAL_MUSD_MAINNET;
  pools.note = "DemoMUSD for Base Sepolia. Mainnet uses canonical MUSD.";
  writePoolsBook(pools);

  console.log(`Updated ${ADDRESSES_PATH} and pools.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
