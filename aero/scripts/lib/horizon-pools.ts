/**
 * Shared helpers for Horizon vault-share / MUSD Slipstream pool scripts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Contract, JsonRpcProvider, Wallet, getAddress, ZeroAddress } from "ethers";
import { ICLFactoryAbi, INonfungiblePositionManagerAbi } from "../../abis/minimal.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const AERO_ROOT = resolve(__dirname, "../..");
export const HORIZON_ROOT = resolve(AERO_ROOT, "..");
export const ADDRESSES_PATH = join(AERO_ROOT, "deployments", "baseSepolia", "addresses.json");
export const POOLS_PATH = join(AERO_ROOT, "deployments", "baseSepolia", "pools.json");

loadEnv({ path: join(HORIZON_ROOT, ".env") });
loadEnv({ path: join(AERO_ROOT, ".env") });

/** Base Sepolia VaultPeer tokens (from contracts/deployments/baseSepolia). */
export const AV_MEZOV_PEER = getAddress("0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855");
export const AV_BTCV_PEER = getAddress("0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132");

/** Canonical MUSD on Base / Ethereum / Mezo mainnet (NTT). Not present on Base Sepolia. */
export const CANONICAL_MUSD_MAINNET = getAddress("0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186");

export const TICK_SPACING = 200;
/** TickMath.getSqrtRatioAtTick(0) — 1:1 demo price. */
export const SQRT_PRICE_1_1 = 79228162514264337593543950336n;
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;

export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
] as const;

export type AddressBook = {
  chainId?: number;
  network?: string;
  deployed?: boolean;
  PoolFactory?: string | null;
  NonfungiblePositionManager?: string | null;
  SwapRouter?: string | null;
  QuoterV2?: string | null;
  WETH?: string | null;
  MUSD?: string | null;
  DemoMUSD?: string | null;
  defaultTickSpacing?: number;
  [key: string]: unknown;
};

export type PoolRecord = {
  key: string;
  share: string;
  shareSymbol: string;
  musd: string;
  token0: string;
  token1: string;
  tickSpacing: number;
  pool: string | null;
  sqrtPriceX96Init: string;
};

export type PoolsBook = {
  chainId: number;
  network: string;
  tickSpacing: number;
  musd: string | null;
  musdKind: "canonical-mainnet-ref" | "demo" | "env" | null;
  canonicalMusdMainnet: string;
  pools: PoolRecord[];
  note?: string;
};

export function resolvePrivateKey(): string | undefined {
  const raw = process.env.PRIVATE_KEY || process.env.ETH_PRIVATE_KEY || process.env.PRIVATE_KEY_DEPLOY;
  if (!raw) return undefined;
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

export function resolveRpcUrl(): string | undefined {
  return process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_SEPOLIA_RPC;
}

export function readAddressBook(): AddressBook {
  if (!existsSync(ADDRESSES_PATH)) {
    return {
      chainId: 84532,
      network: "baseSepolia",
      WETH: "0x4200000000000000000000000000000000000006",
      defaultTickSpacing: TICK_SPACING,
      deployed: false,
    };
  }
  return JSON.parse(readFileSync(ADDRESSES_PATH, "utf8")) as AddressBook;
}

export function writeAddressBook(book: AddressBook): void {
  mkdirSync(dirname(ADDRESSES_PATH), { recursive: true });
  writeFileSync(ADDRESSES_PATH, JSON.stringify(book, null, 2) + "\n");
}

export function emptyPoolsBook(): PoolsBook {
  return {
    chainId: 84532,
    network: "baseSepolia",
    tickSpacing: TICK_SPACING,
    musd: null,
    musdKind: null,
    canonicalMusdMainnet: CANONICAL_MUSD_MAINNET,
    pools: [],
    note: "Placeholder. Run create-horizon-pools after Slipstream + DemoMUSD (or set MUSD_ADDRESS).",
  };
}

export function readPoolsBook(): PoolsBook {
  if (!existsSync(POOLS_PATH)) return emptyPoolsBook();
  return JSON.parse(readFileSync(POOLS_PATH, "utf8")) as PoolsBook;
}

export function writePoolsBook(book: PoolsBook): void {
  mkdirSync(dirname(POOLS_PATH), { recursive: true });
  writeFileSync(POOLS_PATH, JSON.stringify(book, null, 2) + "\n");
}

export function isNonZeroAddress(value: string | null | undefined): value is string {
  return Boolean(value && value !== ZeroAddress && /^0x[0-9a-fA-F]{40}$/.test(value));
}

/** Prefer env → address book DemoMUSD/MUSD → pools.json. */
export function resolveMusdAddress(book?: AddressBook, pools?: PoolsBook): {
  address: string | null;
  kind: PoolsBook["musdKind"];
} {
  const env = process.env.MUSD_ADDRESS?.trim();
  if (env && isNonZeroAddress(env)) {
    return { address: getAddress(env), kind: "env" };
  }
  const ab = book ?? readAddressBook();
  if (isNonZeroAddress(ab.DemoMUSD)) return { address: getAddress(ab.DemoMUSD), kind: "demo" };
  if (isNonZeroAddress(ab.MUSD)) return { address: getAddress(ab.MUSD), kind: "demo" };
  const pb = pools ?? readPoolsBook();
  if (isNonZeroAddress(pb.musd)) return { address: getAddress(pb.musd), kind: pb.musdKind ?? "demo" };
  return { address: null, kind: null };
}

export function sortTokens(a: string, b: string): [string, string] {
  const aa = getAddress(a);
  const bb = getAddress(b);
  return aa.toLowerCase() < bb.toLowerCase() ? [aa, bb] : [bb, aa];
}

export function fullRangeTicks(tickSpacing: number = TICK_SPACING): { tickLower: number; tickUpper: number } {
  // Match Solidity: truncate toward zero, then scale (see MinimalSlipstream.t.sol).
  const tickLower = Math.trunc(MIN_TICK / tickSpacing) * tickSpacing;
  const tickUpper = Math.trunc(MAX_TICK / tickSpacing) * tickSpacing;
  return { tickLower, tickUpper };
}

export function horizonPairs(musd: string): Array<{
  key: string;
  share: string;
  shareSymbol: string;
  musd: string;
}> {
  return [
    { key: "avMEZOv-MUSD", share: AV_MEZOV_PEER, shareSymbol: "avMEZOv", musd },
    { key: "avBTCv-MUSD", share: AV_BTCV_PEER, shareSymbol: "avBTCv", musd },
  ];
}

export function requireFactory(book: AddressBook): string {
  if (!isNonZeroAddress(book.PoolFactory)) {
    throw new Error(
      `PoolFactory missing in ${ADDRESSES_PATH}. Deploy Slipstream first (pnpm deploy:slipstream:base-sepolia:broadcast).`,
    );
  }
  return getAddress(book.PoolFactory);
}

export function requireNpm(book: AddressBook): string {
  if (!isNonZeroAddress(book.NonfungiblePositionManager)) {
    throw new Error(`NonfungiblePositionManager missing in ${ADDRESSES_PATH}.`);
  }
  return getAddress(book.NonfungiblePositionManager);
}

export async function connectProvider(): Promise<{
  provider: JsonRpcProvider;
  wallet: Wallet | null;
  rpc: string;
}> {
  const rpc = resolveRpcUrl() || "https://sepolia.base.org";
  const provider = new JsonRpcProvider(rpc, 84532);
  const pk = resolvePrivateKey();
  const wallet = pk ? new Wallet(pk, provider) : null;
  return { provider, wallet, rpc };
}

export function factoryContract(address: string, runner: JsonRpcProvider | Wallet): Contract {
  return new Contract(address, ICLFactoryAbi, runner);
}

export function npmContract(address: string, runner: JsonRpcProvider | Wallet): Contract {
  return new Contract(address, INonfungiblePositionManagerAbi, runner);
}

export function erc20(address: string, runner: JsonRpcProvider | Wallet): Contract {
  return new Contract(address, ERC20_ABI, runner);
}

export function parseFlags(argv: string[]): Set<string> {
  return new Set(argv.slice(2));
}
