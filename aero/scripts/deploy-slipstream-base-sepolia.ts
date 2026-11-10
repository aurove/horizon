/**
 * Deploy (or dry-run) the minimal Slipstream stack on Base Sepolia.
 *
 * Idempotent: if deployments/baseSepolia/addresses.json already has PoolFactory,
 * exits successfully without rebroadcasting unless --force is passed.
 *
 * Broadcast requires --broadcast plus PRIVATE_KEY (or ETH_PRIVATE_KEY) and
 * BASE_SEPOLIA_RPC_URL. Without --broadcast, runs forge build + script dry-run only.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AERO_ROOT = resolve(__dirname, "..");
const HORIZON_ROOT = resolve(AERO_ROOT, "..");
const ADDRESSES_PATH = join(AERO_ROOT, "deployments", "baseSepolia", "addresses.json");

loadEnv({ path: join(HORIZON_ROOT, ".env") });
loadEnv({ path: join(AERO_ROOT, ".env") });

type AddressBook = {
  chainId?: number;
  network?: string;
  deployed?: boolean;
  PoolFactory?: string | null;
  NonfungiblePositionManager?: string | null;
  SwapRouter?: string | null;
  QuoterV2?: string | null;
  WETH?: string | null;
  defaultTickSpacing?: number;
  [key: string]: unknown;
};

const ZERO = "0x0000000000000000000000000000000000000000";

function isDeployed(book: AddressBook): boolean {
  const factory = book.PoolFactory;
  return Boolean(factory && factory !== ZERO && book.deployed !== false);
}

function readAddressBook(): AddressBook {
  if (!existsSync(ADDRESSES_PATH)) {
    return {
      chainId: 84532,
      network: "baseSepolia",
      WETH: "0x4200000000000000000000000000000000000006",
      defaultTickSpacing: 200,
      deployed: false,
    };
  }
  return JSON.parse(readFileSync(ADDRESSES_PATH, "utf8")) as AddressBook;
}

function resolvePrivateKey(): string | undefined {
  const raw = process.env.PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || process.env.PRIVATE_KEY_DEPLOY;
  if (!raw) return undefined;
  return raw.startsWith("0x") ? raw.slice(2) : raw;
}

function resolveRpcUrl(): string | undefined {
  return process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_SEPOLIA_RPC;
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv): void {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: AERO_ROOT,
    env,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function printForgeCreateRunbook(): void {
  console.log(`
Manual forge create runbook (if script broadcast is unavailable)
----------------------------------------------------------------
cd aero
# 1) stubs
forge create src/stubs/MinimalFactoryRegistry.sol:MinimalFactoryRegistry --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
forge create src/stubs/MinimalLegacyCLFactory.sol:MinimalLegacyCLFactory --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
forge create src/stubs/MinimalVoter.sol:MinimalVoter --constructor-args <REGISTRY> --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
forge create src/stubs/MinimalPositionDescriptor.sol:MinimalPositionDescriptor --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

# 2) core (via slipstream remappings)
forge create slipstream/contracts/core/CLPool.sol:CLPool --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
forge create slipstream/contracts/core/CLFactory.sol:CLFactory --constructor-args <VOTER> <LEGACY_FACTORY> <POOL_IMPL> --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

# 3) periphery
forge create slipstream/contracts/periphery/NonfungiblePositionManager.sol:NonfungiblePositionManager \\
  --constructor-args <FACTORY> 0x4200000000000000000000000000000000000006 <DESCRIPTOR> "Horizon Slipstream Positions" "HZN-CL-POS" \\
  --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
forge create slipstream/contracts/periphery/SwapRouter.sol:SwapRouter \\
  --constructor-args <FACTORY> 0x4200000000000000000000000000000000000006 \\
  --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
forge create slipstream/contracts/periphery/lens/QuoterV2.sol:QuoterV2 \\
  --constructor-args <FACTORY> 0x4200000000000000000000000000000000000006 \\
  --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

# 4) write addresses into deployments/baseSepolia/addresses.json (set deployed: true)
# Tick spacing 200 is enabled in CLFactory constructor (fee 3000).
`);
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const broadcast = args.has("--broadcast");
  const force = args.has("--force");
  const help = args.has("--help") || args.has("-h");

  if (help) {
    console.log(`Usage: tsx scripts/deploy-slipstream-base-sepolia.ts [--broadcast] [--force]

  (default)     forge build + forge script dry-run (no broadcast)
  --broadcast   broadcast DeployMinimalCL to Base Sepolia
  --force       re-deploy even if addresses.json already has PoolFactory
`);
    printForgeCreateRunbook();
    process.exit(0);
  }

  mkdirSync(dirname(ADDRESSES_PATH), { recursive: true });
  const book = readAddressBook();

  if (isDeployed(book) && !force) {
    console.log("Slipstream already recorded in address book; skipping broadcast.");
    console.log(`  PoolFactory: ${book.PoolFactory}`);
    console.log(`  NPM:         ${book.NonfungiblePositionManager}`);
    console.log(`  SwapRouter:  ${book.SwapRouter}`);
    console.log("Pass --force to redeploy.");
    process.exit(0);
  }

  const pk = resolvePrivateKey();
  const rpc = resolveRpcUrl();

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    AERO_ADDRESSES_OUT: ADDRESSES_PATH,
  };

  console.log("Compiling @aurove/horizon-aero (solc 0.7.6)…");
  run("forge", ["build"], env);

  if (!broadcast) {
    console.log("Dry-run only (no --broadcast). Scripts are ready.");
    if (!pk || !rpc) {
      console.log("Missing PRIVATE_KEY/ETH_PRIVATE_KEY and/or BASE_SEPOLIA_RPC_URL — broadcast skipped.");
    } else {
      console.log("Keys/RPC detected. Re-run with --broadcast to deploy on Base Sepolia.");
    }
    printForgeCreateRunbook();
    // Keep placeholder book stable for PR5 pool scripts.
    if (!existsSync(ADDRESSES_PATH)) {
      writeFileSync(ADDRESSES_PATH, JSON.stringify(book, null, 2) + "\n");
    }
    process.exit(0);
  }

  if (!pk || !rpc) {
    console.error("Broadcast requested but PRIVATE_KEY (or ETH_PRIVATE_KEY) and BASE_SEPOLIA_RPC_URL are required.");
    printForgeCreateRunbook();
    process.exit(1);
  }

  env.PRIVATE_KEY = pk;
  env.BASE_SEPOLIA_RPC_URL = rpc;

  run(
    "forge",
    [
      "script",
      "script/DeployMinimalCL.s.sol:DeployMinimalCL",
      "--rpc-url",
      rpc,
      "--broadcast",
      "--slow",
      "-vvv",
    ],
    env,
  );

  const updated = readAddressBook();
  if (!isDeployed({ ...updated, deployed: true })) {
    // forge writeJson may omit deployed flag depending on serialization order
    updated.deployed = Boolean(updated.PoolFactory);
    updated.network = updated.network ?? "baseSepolia";
    writeFileSync(ADDRESSES_PATH, JSON.stringify(updated, null, 2) + "\n");
  }

  console.log("Deployed minimal Slipstream stack. Address book:");
  console.log(`  ${ADDRESSES_PATH}`);
}

main();
