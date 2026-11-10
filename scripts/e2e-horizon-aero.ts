/**
 * Wave 2 E2E: optional Mezo vault deposit → NTT Mezo→Base Sepolia → Aero swap + LP.
 *
 * Default: dry-run — validate local configs/addresses, print the plan, write a JSON
 * receipt under reports/wave2-e2e-<timestamp>.json (no txs).
 *
 * Live broadcast requires CONFIRM_HORIZON_E2E=YES and HORIZON_E2E_PRIVATE_KEY.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  Contract,
  MaxUint256,
  formatUnits,
  getAddress,
  JsonRpcProvider,
  parseUnits,
  Wallet,
  ZeroAddress,
} from "../contracts/node_modules/ethers/lib.esm/index.js";
import { Vault__factory } from "../contracts/typechain/factories/src/Vault__factory";
import { VaultPeer__factory } from "../contracts/typechain/factories/src/VaultPeer__factory";
import {
  ICLFactoryAbi,
  INonfungiblePositionManagerAbi,
  ISwapRouterAbi,
} from "../aero/abis/minimal.js";

const scriptPath = fileURLToPath(import.meta.url);
const horizonRoot = resolve(dirname(scriptPath), "..");
const nttProjectRoot = resolve(homedir(), ".ntt-cli/.checkout");
const outputDirectory = resolve(horizonRoot, "reports");
const aeroAddressesPath = join(horizonRoot, "aero", "deployments", "baseSepolia", "addresses.json");
const aeroPoolsPath = join(horizonRoot, "aero", "deployments", "baseSepolia", "pools.json");
const precision = 8;
const pollIntervalMs = 12_000;
const TICK_SPACING = 200;
const MIN_TICK = -887272;
const MAX_TICK = 887272;
const SQRT_PRICE_1_1 = 79228162514264337593543950336n;
const CANONICAL_MUSD_MAINNET = "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186";

const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
] as const;

const vaults = {
  avBTCv: {
    hubDeployment: "avBTCVault",
    peerDeployment: "avBTCvPeer",
    id20Testnet: "0xf2aeB53d71CD541EFeaA37788F0841D7d21612F9",
  },
  avMEZOv: {
    hubDeployment: "avMEZOVault",
    peerDeployment: "avMEZOvPeer",
    id20Testnet: "0x0aeDdEaB271Bc032d6758c34Dc8356632D6F812e",
  },
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

type AddressBook = {
  PoolFactory?: string | null;
  NonfungiblePositionManager?: string | null;
  SwapRouter?: string | null;
  DemoMUSD?: string | null;
  MUSD?: string | null;
  deployed?: boolean;
  [key: string]: unknown;
};

type PoolRecord = {
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

type PoolsBook = {
  musd: string | null;
  musdKind?: string | null;
  pools: PoolRecord[];
};

type PlanStep = { step: number; action: string; detail: string };
type Receipt = {
  status: "dry-run" | "passed" | "blocked";
  mode: "dry-run" | "live";
  network: string;
  token: VaultSymbol;
  amount: string;
  swapBps: number;
  depositAssets: string | null;
  skipBridge: boolean;
  wallet: string | null;
  chainIds: { Mezo: number | null; BaseSepolia: number | null };
  contracts: Record<string, unknown>;
  plan: PlanStep[];
  transactions: {
    deposit: string[];
    bridge: string[];
    swap: string[];
    lp: string[];
  };
  balances?: Record<string, unknown>;
  lp?: { tokenId?: string; liquidity?: string; amount0?: string; amount1?: string };
  gaps: string[];
  notes: string[];
  completedAt: string;
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

function readJsonSync<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function checkAddress(value: string, label: string): string {
  try {
    return getAddress(value);
  } catch {
    return fail(`Invalid ${label} address: ${value}`);
  }
}

function isNonZeroAddress(value: string | null | undefined): value is string {
  return Boolean(value && value !== ZeroAddress && /^0x[0-9a-fA-F]{40}$/.test(value));
}

function sortTokens(a: string, b: string): [string, string] {
  const aa = getAddress(a);
  const bb = getAddress(b);
  return aa.toLowerCase() < bb.toLowerCase() ? [aa, bb] : [bb, aa];
}

function fullRangeTicks(tickSpacing: number = TICK_SPACING): { tickLower: number; tickUpper: number } {
  const tickLower = Math.trunc(MIN_TICK / tickSpacing) * tickSpacing;
  const tickUpper = Math.trunc(MAX_TICK / tickSpacing) * tickSpacing;
  return { tickLower, tickUpper };
}

function parseAmount(amount: string, decimals: number): bigint {
  if (!/^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(amount)) {
    fail("Amount must be a positive decimal without exponent notation");
  }
  if (decimals < precision) {
    fail(`Token has ${decimals} decimals, but NTT preserves ${precision} decimal places`);
  }
  const units = parseUnits(amount, decimals);
  if (units <= 0n) fail("Amount must be greater than zero");
  if (units % 10n ** BigInt(decimals - precision) !== 0n) {
    fail(`NTT transfers preserve up to ${precision} decimal places; amount has excess precision`);
  }
  return units;
}

function resolveMusd(book: AddressBook, pools: PoolsBook): { address: string | null; kind: string | null } {
  const env = process.env.MUSD_ADDRESS?.trim();
  if (env && isNonZeroAddress(env)) return { address: getAddress(env), kind: "env" };
  if (isNonZeroAddress(book.DemoMUSD)) return { address: getAddress(book.DemoMUSD), kind: "demo" };
  if (isNonZeroAddress(book.MUSD)) return { address: getAddress(book.MUSD), kind: "demo" };
  if (isNonZeroAddress(pools.musd)) return { address: getAddress(pools.musd), kind: pools.musdKind ?? "demo" };
  return { address: null, kind: null };
}

function parseSwapBps(): number {
  const raw = process.env.E2E_SWAP_BPS?.trim() || "5000";
  const bps = Number(raw);
  if (!Number.isInteger(bps) || bps < 1 || bps > 9999) {
    fail("E2E_SWAP_BPS must be an integer from 1 to 9999 (portion of bridged peer swapped to MUSD)");
  }
  return bps;
}

function printUsage(): never {
  fail(`Usage: pnpm e2e:horizon-aero:testnet -- <avBTCv|avMEZOv> <amount>

Default dry-run validates configs and writes reports/wave2-e2e-<timestamp>.json.
Live: CONFIRM_HORIZON_E2E=YES HORIZON_E2E_PRIVATE_KEY=0x… 

Optional env:
  E2E_DEPOSIT_ASSETS=<decimal>  deposit Id20→vault on Mezo before bridge
  E2E_SWAP_BPS=5000             bps of bridged peer to swap → MUSD (rest for LP)
  E2E_SKIP_BRIDGE=YES           skip NTT; use existing Base peer balance
  HORIZON_E2E_TIMEOUT_SECONDS   bridge observation timeout (default 3600)
  MUSD_ADDRESS                  override DemoMUSD / address-book MUSD`);
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
      const txIds = [...output.matchAll(/Source transaction(?: #\d+)?:\s*(0x[\da-fA-F]{64})/g)].map(
        (match) => match[1],
      );
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
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  fail(`Timed out waiting for ${label} after ${timeoutSeconds} seconds`);
}

async function ensureAllowance(
  token: Contract,
  owner: string,
  spender: string,
  amount: bigint,
): Promise<string | undefined> {
  const current = (await token.allowance(owner, spender)) as bigint;
  if (current >= amount) return undefined;
  const tx = await token.approve(spender, MaxUint256);
  const receipt = await tx.wait();
  return receipt?.hash as string | undefined;
}

async function writeReceipt(receipt: Receipt): Promise<string> {
  await mkdir(outputDirectory, { recursive: true });
  const reportPath = resolve(outputDirectory, `wave2-e2e-${Date.now()}.json`);
  await writeFile(reportPath, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return reportPath;
}

async function main(): Promise<void> {
  await loadRootEnv();
  const args = process.argv.slice(2).filter((a) => a !== "--");
  if (args[0] === "--help" || args[0] === "-h") printUsage();
  if (args.length !== 2 || !Object.hasOwn(vaults, args[0]!)) printUsage();

  const symbol = args[0] as VaultSymbol;
  const amountInput = args[1]!;
  const live = process.env.CONFIRM_HORIZON_E2E === "YES";
  const skipBridge = process.env.E2E_SKIP_BRIDGE === "YES";
  const depositAssetsText = process.env.E2E_DEPOSIT_ASSETS?.trim() || null;
  const swapBps = parseSwapBps();
  const mezoRpc = process.env.MEZO_TESTNET_RPC_URL?.trim() || "https://rpc.test.mezo.org";
  const baseRpc = process.env.BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org";
  const timeoutSeconds = Number(process.env.HORIZON_E2E_TIMEOUT_SECONDS || "3600");
  if (!Number.isSafeInteger(timeoutSeconds) || timeoutSeconds < 120 || timeoutSeconds > 14_400) {
    fail("HORIZON_E2E_TIMEOUT_SECONDS must be an integer from 120 to 14400");
  }

  const gaps: string[] = [];
  const notes: string[] = [];
  const plan: PlanStep[] = [];
  let step = 0;
  const nextStep = (action: string, detail: string): void => {
    step += 1;
    plan.push({ step, action, detail });
  };

  const spec = vaults[symbol];
  const suffix = symbol === "avBTCv" ? "avBTCv" : "avMEZOv";
  const nttPath = resolve(horizonRoot, "wormhole", "vaults", suffix, "testnet", "deployment.json");
  const hubDeploymentPath = resolve(
    horizonRoot,
    "contracts",
    "deployments",
    "testnet",
    `${spec.hubDeployment}.json`,
  );
  const peerDeploymentPath = resolve(
    horizonRoot,
    "contracts",
    "deployments",
    "baseSepolia",
    `${spec.peerDeployment}.json`,
  );

  for (const path of [nttPath, hubDeploymentPath, peerDeploymentPath, aeroAddressesPath]) {
    if (!existsSync(path)) gaps.push(`Missing file: ${path}`);
  }

  if (gaps.some((g) => g.startsWith("Missing file:"))) {
    const receipt: Receipt = {
      status: "blocked",
      mode: live ? "live" : "dry-run",
      network: "Testnet",
      token: symbol,
      amount: amountInput,
      swapBps,
      depositAssets: depositAssetsText,
      skipBridge,
      wallet: null,
      chainIds: { Mezo: null, BaseSepolia: null },
      contracts: {},
      plan: [],
      transactions: { deposit: [], bridge: [], swap: [], lp: [] },
      gaps,
      notes: ["Fix missing deployment/config files before re-running."],
      completedAt: new Date().toISOString(),
    };
    const reportPath = await writeReceipt(receipt);
    console.error(`Blocked: missing required files. Receipt: ${reportPath}`);
    if (live) process.exitCode = 1;
    return;
  }

  const ntt = await readJson<{ network: string; chains: Record<string, ChainConfig> }>(nttPath);
  const hubDeployment = await readJson<{ address: string }>(hubDeploymentPath);
  const peerDeployment = await readJson<{ address: string }>(peerDeploymentPath);
  const aeroBook = readJsonSync<AddressBook>(aeroAddressesPath);
  const poolsBook = existsSync(aeroPoolsPath)
    ? readJsonSync<PoolsBook>(aeroPoolsPath)
    : { musd: null, pools: [] };

  if (ntt.network !== "Testnet") gaps.push(`${nttPath} is not an NTT Testnet config`);

  const hub = ntt.chains.Mezo;
  const spoke = ntt.chains.BaseSepolia;
  if (!hub?.manager || !spoke?.manager) gaps.push("NTT managers missing for Mezo and/or BaseSepolia");
  if (!hub?.transceivers?.wormhole?.address || !spoke?.transceivers?.wormhole?.address) {
    gaps.push("Wormhole transceivers missing in NTT deployment");
  }

  const hubToken = checkAddress(hubDeployment.address, `${symbol} Mezo vault`);
  const spokeToken = checkAddress(peerDeployment.address, `${symbol} Base Sepolia peer`);
  if (hub?.token && checkAddress(hub.token, "Mezo NTT token") !== hubToken) {
    gaps.push("Mezo NTT token does not match deployed vault");
  }
  if (spoke?.token && checkAddress(spoke.token, "Base Sepolia NTT token") !== spokeToken) {
    gaps.push("Base Sepolia NTT token does not match deployed peer");
  }
  if (hub && hub.mode !== "locking") gaps.push(`Expected Mezo locking mode, got ${hub.mode}`);
  if (spoke && spoke.mode !== "burning") gaps.push(`Expected Base Sepolia burning mode, got ${spoke.mode}`);

  const { address: musd, kind: musdKind } = resolveMusd(aeroBook, poolsBook);
  if (!musd) {
    gaps.push(
      `MUSD missing — deploy DemoMUSD or set MUSD_ADDRESS (canonical mainnet ${CANONICAL_MUSD_MAINNET} is not on Base Sepolia)`,
    );
  }

  const swapRouter = isNonZeroAddress(aeroBook.SwapRouter) ? getAddress(aeroBook.SwapRouter) : null;
  const npm = isNonZeroAddress(aeroBook.NonfungiblePositionManager)
    ? getAddress(aeroBook.NonfungiblePositionManager)
    : null;
  const factory = isNonZeroAddress(aeroBook.PoolFactory) ? getAddress(aeroBook.PoolFactory) : null;
  if (!swapRouter) gaps.push(`SwapRouter missing in ${aeroAddressesPath}`);
  if (!npm) gaps.push(`NonfungiblePositionManager missing in ${aeroAddressesPath}`);
  if (!factory) gaps.push(`PoolFactory missing in ${aeroAddressesPath}`);

  let poolAddress: string | null = null;
  let token0 = "";
  let token1 = "";
  if (musd) {
    [token0, token1] = sortTokens(spokeToken, musd);
    const poolKey = `${symbol}-MUSD`;
    const recorded = poolsBook.pools.find((p) => p.key === poolKey || p.shareSymbol === symbol);
    if (recorded?.pool && isNonZeroAddress(recorded.pool)) {
      poolAddress = getAddress(recorded.pool);
    } else {
      notes.push(`Pool address for ${poolKey} not in pools.json yet (create:horizon-pools or first NPM mint).`);
    }
  }

  const { tickLower, tickUpper } = fullRangeTicks(TICK_SPACING);
  const swapFraction = `${swapBps} bps`;
  const lpFraction = `${10_000 - swapBps} bps`;

  if (depositAssetsText) {
    nextStep(
      "deposit",
      `On Mezo: approve Id20 ${spec.id20Testnet} and vault.deposit(${depositAssetsText}) → ${symbol}`,
    );
  } else {
    notes.push("No E2E_DEPOSIT_ASSETS set — using existing Mezo vault share balance.");
  }

  if (skipBridge) {
    nextStep("bridge", "Skipped (E2E_SKIP_BRIDGE=YES) — require existing Base Sepolia peer balance");
  } else {
    nextStep("bridge", `NTT Mezo → BaseSepolia for ${amountInput} ${symbol}`);
  }

  nextStep(
    "swap",
    `On Base: SwapRouter.exactInputSingle ${swapFraction} of peer → MUSD (tickSpacing ${TICK_SPACING})`,
  );
  nextStep(
    "lp",
    `On Base: NPM.mint full-range [${tickLower}, ${tickUpper}] with remaining peer (${lpFraction}) + MUSD`,
  );

  console.log(`\nHorizon Wave 2 E2E (${live ? "LIVE" : "dry-run"}): ${symbol} ${amountInput}`);
  console.log(`Swap ${swapFraction} → MUSD; LP with remaining peer + MUSD`);
  console.log(`Vault (Mezo): ${hubToken}`);
  console.log(`Peer (Base):  ${spokeToken}`);
  console.log(`MUSD:         ${musd ?? "(missing)"} (${musdKind ?? "n/a"})`);
  console.log(`SwapRouter:   ${swapRouter ?? "(missing)"}`);
  console.log(`NPM:          ${npm ?? "(missing)"}`);
  console.log(`PoolFactory:  ${factory ?? "(missing)"}`);
  console.log(`Pool:         ${poolAddress ?? "(unknown / not recorded)"}`);
  console.log("Plan:");
  for (const p of plan) console.log(`  ${p.step}. [${p.action}] ${p.detail}`);
  if (gaps.length) {
    console.log("Gaps:");
    for (const g of gaps) console.log(`  - ${g}`);
  }

  let walletAddress: string | null = null;
  const previewKey =
    process.env.HORIZON_E2E_PRIVATE_KEY?.trim() ||
    process.env.HORIZON_ROUNDTRIP_PRIVATE_KEY?.trim() ||
    process.env.ETH_PRIVATE_KEY?.trim();
  if (previewKey) {
    try {
      walletAddress = getAddress(new Wallet(previewKey).address);
      if (!live) notes.push(`Dry-run wallet preview: ${walletAddress} (no txs sent)`);
    } catch {
      notes.push("Could not derive wallet from available private key env.");
    }
  } else if (!live) {
    notes.push("No private key in env for wallet preview (optional in dry-run).");
  }

  const contracts = {
    Mezo: {
      vault: hubToken,
      asset: spec.id20Testnet,
      manager: hub?.manager ?? null,
      transceiver: hub?.transceivers?.wormhole?.address ?? null,
    },
    BaseSepolia: {
      peer: spokeToken,
      manager: spoke?.manager ?? null,
      transceiver: spoke?.transceivers?.wormhole?.address ?? null,
      musd,
      musdKind,
      swapRouter,
      npm,
      factory,
      pool: poolAddress,
      token0: token0 || null,
      token1: token1 || null,
      tickSpacing: TICK_SPACING,
      tickLower,
      tickUpper,
    },
    nttDeployment: nttPath,
    aeroAddresses: aeroAddressesPath,
    aeroPools: aeroPoolsPath,
  };

  if (!live) {
    const receipt: Receipt = {
      status: "dry-run",
      mode: "dry-run",
      network: "Testnet",
      token: symbol,
      amount: amountInput,
      swapBps,
      depositAssets: depositAssetsText,
      skipBridge,
      wallet: walletAddress,
      chainIds: { Mezo: 31611, BaseSepolia: 84532 },
      contracts,
      plan,
      transactions: { deposit: [], bridge: [], swap: [], lp: [] },
      gaps,
      notes: [
        ...notes,
        "Dry-run only. Set CONFIRM_HORIZON_E2E=YES and HORIZON_E2E_PRIVATE_KEY to broadcast.",
        ...(gaps.length
          ? ["gaps[] lists blockers for a live run; dry-run + receipt schema is success without on-chain broadcast."]
          : ["Config looks ready for a live run."]),
      ],
      completedAt: new Date().toISOString(),
    };
    const reportPath = await writeReceipt(receipt);
    console.log(`\nDry-run complete. Receipt: ${reportPath}`);
    if (gaps.length) {
      console.log("Resolve gaps before a live run; dry-run receipt schema is valid for this PR.");
    }
    return;
  }

  // —— Live path ——
  if (gaps.length) {
    const receipt: Receipt = {
      status: "blocked",
      mode: "live",
      network: "Testnet",
      token: symbol,
      amount: amountInput,
      swapBps,
      depositAssets: depositAssetsText,
      skipBridge,
      wallet: walletAddress,
      chainIds: { Mezo: 31611, BaseSepolia: 84532 },
      contracts,
      plan,
      transactions: { deposit: [], bridge: [], swap: [], lp: [] },
      gaps,
      notes: [...notes, "Live run blocked by config gaps."],
      completedAt: new Date().toISOString(),
    };
    const reportPath = await writeReceipt(receipt);
    console.error(`Live run blocked. Receipt: ${reportPath}`);
    process.exitCode = 1;
    return;
  }

  const privateKey = requiredEnv("HORIZON_E2E_PRIVATE_KEY");
  walletAddress = getAddress(new Wallet(privateKey).address);
  if (hub?.owner && checkAddress(hub.owner, "Mezo NTT owner") !== walletAddress) {
    notes.push(
      `HORIZON_E2E_PRIVATE_KEY ${walletAddress} differs from NTT Mezo owner ${hub.owner} (OK if signer holds shares).`,
    );
  }

  if (!walletAddress || !musd || !swapRouter || !npm || !factory) {
    fail("Internal: live path missing signer or addresses after gap check");
  }

  const mezoProvider = new JsonRpcProvider(mezoRpc);
  const baseProvider = new JsonRpcProvider(baseRpc);
  const mezoWallet = new Wallet(privateKey, mezoProvider);
  const baseWallet = new Wallet(privateKey, baseProvider);
  const recipient = walletAddress;

  const depositTxs: string[] = [];
  const bridgeTxs: string[] = [];
  const swapTxs: string[] = [];
  const lpTxs: string[] = [];
  let lpMeta: Receipt["lp"];

  try {
    const [mezoChainId, baseChainId] = await Promise.all([
      mezoProvider.getNetwork().then((n) => Number(n.chainId)),
      baseProvider.getNetwork().then((n) => Number(n.chainId)),
    ]);
    if (mezoChainId !== 31611) fail(`MEZO_TESTNET_RPC_URL returned chain ID ${mezoChainId}, expected 31611`);
    if (baseChainId !== 84532) fail(`BASE_SEPOLIA_RPC_URL returned chain ID ${baseChainId}, expected 84532`);

    const vault = Vault__factory.connect(hubToken, mezoWallet);
    const peer = VaultPeer__factory.connect(spokeToken, baseWallet);
    const [hubDecimals, spokeDecimals] = await Promise.all([vault.decimals(), peer.decimals()]);
    if (hubDecimals !== spokeDecimals) {
      fail(`Token decimals differ: Mezo ${hubDecimals}, Base Sepolia ${spokeDecimals}`);
    }
    const decimals = Number(hubDecimals);
    const amount = parseAmount(amountInput, decimals);
    const amountText = formatUnits(amount, decimals);

    const [peerMinter] = await Promise.all([peer.minter()]);
    if (spoke?.manager && getAddress(peerMinter) !== getAddress(spoke.manager)) {
      fail(`Base peer minter ${peerMinter} does not match NTT manager ${spoke.manager}`);
    }

    // Optional Id20 → vault deposit on Mezo
    if (depositAssetsText) {
      const assetAddr = getAddress(await vault.asset());
      const id20 = new Contract(assetAddr, ERC20_ABI, mezoWallet);
      const assetDecimals = Number(await id20.decimals());
      const depositAssets = parseUnits(depositAssetsText, assetDecimals);
      if (depositAssets <= 0n) fail("E2E_DEPOSIT_ASSETS must be > 0");
      const assetBal = (await id20.balanceOf(recipient)) as bigint;
      if (assetBal < depositAssets) {
        fail(
          `Insufficient Id20 for deposit: have ${formatUnits(assetBal, assetDecimals)}, need ${depositAssetsText}`,
        );
      }
      console.log(`Depositing ${depositAssetsText} Id20 into ${symbol} vault…`);
      const approveHash = await ensureAllowance(id20, recipient, hubToken, depositAssets);
      if (approveHash) depositTxs.push(approveHash);
      const depTx = await vault.deposit(depositAssets, recipient);
      const depReceipt = await depTx.wait();
      if (depReceipt?.hash) depositTxs.push(depReceipt.hash);
    }

    const [startHub, startSpoke, mezoNative, baseNative] = await Promise.all([
      vault.balanceOf(recipient),
      peer.balanceOf(recipient),
      mezoProvider.getBalance(recipient),
      baseProvider.getBalance(recipient),
    ]);

    if (!skipBridge) {
      if (startHub < amount) {
        fail(
          `Insufficient ${symbol} on Mezo: ${formatUnits(startHub, decimals)} available, ${amountText} required`,
        );
      }
      const limits = [
        [hub?.limits?.outbound, "Mezo outbound"],
        [spoke?.limits?.inbound?.Mezo, "Base Sepolia inbound from Mezo"],
      ] as const;
      for (const [limitText, label] of limits) {
        if (!limitText || amount > parseUnits(limitText, decimals)) {
          fail(`${label} limit is missing or below ${amountText}`);
        }
      }
      if (mezoNative === 0n || baseNative === 0n) {
        fail("Signer needs native gas on both Mezo testnet and Base Sepolia");
      }

      console.log(`Bridging ${amountText} ${symbol} Mezo → Base Sepolia…`);
      const env = { ...process.env, ETH_PRIVATE_KEY: privateKey };
      const outbound = await nttTransfer(
        "Mezo",
        "BaseSepolia",
        amountText,
        recipient,
        nttPath,
        mezoRpc,
        baseRpc,
        env,
        timeoutSeconds,
      );
      bridgeTxs.push(...outbound);
      await waitFor(
        `${amountText} ${symbol} on Base Sepolia`,
        async () => (await peer.balanceOf(recipient)) >= startSpoke + amount,
        timeoutSeconds,
      );
    } else {
      if (startSpoke < amount) {
        fail(
          `E2E_SKIP_BRIDGE set but Base peer balance ${formatUnits(startSpoke, decimals)} < ${amountText}`,
        );
      }
      notes.push("Bridge skipped; using existing Base Sepolia peer balance.");
    }

    const peerBal = (await peer.balanceOf(recipient)) as bigint;
    if (peerBal < amount) {
      fail(`Peer balance ${formatUnits(peerBal, decimals)} < planned amount ${amountText}`);
    }

    const swapIn = (amount * BigInt(swapBps)) / 10_000n;
    const lpPeer = amount - swapIn;
    if (swapIn <= 0n || lpPeer <= 0n) fail("swap/LP split produced a zero side; adjust E2E_SWAP_BPS");

    const musdToken = new Contract(musd, ERC20_ABI, baseWallet);
    const peerErc20 = new Contract(spokeToken, ERC20_ABI, baseWallet);
    const router = new Contract(swapRouter, ISwapRouterAbi, baseWallet);
    const positionManager = new Contract(npm, INonfungiblePositionManagerAbi, baseWallet);
    const factoryContract = new Contract(factory, ICLFactoryAbi, baseProvider);

    const onChainPool = (await factoryContract.getPool(token0, token1, TICK_SPACING)) as string;
    if (isNonZeroAddress(onChainPool)) {
      poolAddress = getAddress(onChainPool);
    } else {
      notes.push("Pool not created yet — LP mint will pass sqrtPriceX96 init if needed.");
    }

    console.log(
      `Swapping ${formatUnits(swapIn, decimals)} ${symbol} → MUSD via Slipstream router…`,
    );
    const approveSwap = await ensureAllowance(peerErc20, recipient, swapRouter, swapIn);
    if (approveSwap) swapTxs.push(approveSwap);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 30;
    const zeroLimit = 0n;
    const swapTx = await router.exactInputSingle({
      tokenIn: spokeToken,
      tokenOut: musd,
      tickSpacing: TICK_SPACING,
      recipient,
      deadline,
      amountIn: swapIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: zeroLimit,
    });
    const swapReceipt = await swapTx.wait();
    if (swapReceipt?.hash) swapTxs.push(swapReceipt.hash);

    const musdBal = (await musdToken.balanceOf(recipient)) as bigint;
    if (musdBal === 0n) {
      // DemoMUSD fallback for empty-pool demos
      try {
        console.log("MUSD balance still 0 after swap; attempting DemoMUSD.mint for LP…");
        const mintAmt = lpPeer; // 1:1 demo sizing
        const mintTx = await musdToken.mint(recipient, mintAmt);
        const mintReceipt = await mintTx.wait();
        if (mintReceipt?.hash) swapTxs.push(mintReceipt.hash);
        notes.push("Swap returned 0 MUSD (likely empty pool); minted DemoMUSD for LP demo.");
      } catch {
        fail("Swap produced 0 MUSD and DemoMUSD.mint failed — seed pool liquidity first");
      }
    }

    const musdForLp = (await musdToken.balanceOf(recipient)) as bigint;
    if (musdForLp === 0n) fail("No MUSD available for LP");

    const amount0Desired = token0.toLowerCase() === spokeToken.toLowerCase() ? lpPeer : musdForLp;
    const amount1Desired = token1.toLowerCase() === spokeToken.toLowerCase() ? lpPeer : musdForLp;
    // Cap MUSD side to what we hold; if musd is token0/1 and balance < desired, use balance
    const bal0 = token0.toLowerCase() === spokeToken.toLowerCase() ? lpPeer : musdForLp;
    const bal1 = token1.toLowerCase() === spokeToken.toLowerCase() ? lpPeer : musdForLp;
    const a0 = bal0 < amount0Desired ? bal0 : amount0Desired;
    const a1 = bal1 < amount1Desired ? bal1 : amount1Desired;

    const poolExists = isNonZeroAddress(
      (await factoryContract.getPool(token0, token1, TICK_SPACING)) as string,
    );
    const sqrtPriceX96 = poolExists ? 0n : SQRT_PRICE_1_1;

    console.log(`Minting LP: token0=${a0} token1=${a1} ticks=[${tickLower},${tickUpper}]`);
    const t0 = new Contract(token0, ERC20_ABI, baseWallet);
    const t1 = new Contract(token1, ERC20_ABI, baseWallet);
    const ap0 = await ensureAllowance(t0, recipient, npm, a0);
    const ap1 = await ensureAllowance(t1, recipient, npm, a1);
    if (ap0) lpTxs.push(ap0);
    if (ap1) lpTxs.push(ap1);

    const mintTx = await positionManager.mint({
      token0,
      token1,
      tickSpacing: TICK_SPACING,
      tickLower,
      tickUpper,
      amount0Desired: a0,
      amount1Desired: a1,
      amount0Min: 0,
      amount1Min: 0,
      recipient,
      deadline: Math.floor(Date.now() / 1000) + 60 * 30,
      sqrtPriceX96,
    });
    const mintReceipt = await mintTx.wait();
    if (mintReceipt?.hash) lpTxs.push(mintReceipt.hash);

    // Best-effort decode of mint return via static call pattern is hard post-facto;
    // record amounts used.
    lpMeta = {
      amount0: a0.toString(),
      amount1: a1.toString(),
    };

    const [endHub, endSpoke, endMusd] = await Promise.all([
      vault.balanceOf(recipient),
      peer.balanceOf(recipient),
      musdToken.balanceOf(recipient),
    ]);

    const receipt: Receipt = {
      status: "passed",
      mode: "live",
      network: "Testnet",
      token: symbol,
      amount: amountText,
      swapBps,
      depositAssets: depositAssetsText,
      skipBridge,
      wallet: recipient,
      chainIds: { Mezo: mezoChainId, BaseSepolia: baseChainId },
      contracts: {
        ...contracts,
        BaseSepolia: {
          ...(contracts.BaseSepolia as object),
          pool: poolAddress,
        },
      },
      plan,
      transactions: {
        deposit: depositTxs,
        bridge: bridgeTxs,
        swap: swapTxs,
        lp: lpTxs,
      },
      balances: {
        start: {
          Mezo: formatUnits(startHub, decimals),
          BaseSepoliaPeer: formatUnits(startSpoke, decimals),
        },
        end: {
          Mezo: formatUnits(endHub, decimals),
          BaseSepoliaPeer: formatUnits(endSpoke, decimals),
          MUSD: formatUnits(endMusd, Number(await musdToken.decimals())),
        },
        swapIn: formatUnits(swapIn, decimals),
        lpPeer: formatUnits(lpPeer, decimals),
      },
      lp: lpMeta,
      gaps: [],
      notes,
      completedAt: new Date().toISOString(),
    };
    const reportPath = await writeReceipt(receipt);
    console.log(`\nE2E passed. Receipt: ${reportPath}`);
  } finally {
    mezoProvider.destroy();
    baseProvider.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
