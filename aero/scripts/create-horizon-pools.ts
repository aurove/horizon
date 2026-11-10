/**
 * Create CL200 Slipstream pools: avMEZOvPeer/MUSD and avBTCvPeer/MUSD on Base Sepolia.
 *
 * Default: dry-run (validate address book + print createPool calldata plan).
 * --broadcast: call CLFactory.createPool and write deployments/baseSepolia/pools.json.
 *
 * Token ordering: token0 < token1 (address sort) — required by Slipstream NPM/factory.
 */
import {
  ADDRESSES_PATH,
  AV_BTCV_PEER,
  AV_MEZOV_PEER,
  CANONICAL_MUSD_MAINNET,
  POOLS_PATH,
  SQRT_PRICE_1_1,
  TICK_SPACING,
  connectProvider,
  factoryContract,
  horizonPairs,
  isNonZeroAddress,
  parseFlags,
  readAddressBook,
  requireFactory,
  resolveMusdAddress,
  sortTokens,
  writePoolsBook,
  type PoolRecord,
  type PoolsBook,
} from "./lib/horizon-pools.js";

async function main(): Promise<void> {
  const flags = parseFlags(process.argv);
  if (flags.has("--help") || flags.has("-h")) {
    console.log(`Usage: tsx scripts/create-horizon-pools.ts [--broadcast]

  (default)     plan pool creation (no txs)
  --broadcast   createPool on Base Sepolia; write pools.json

Pairs (tickSpacing ${TICK_SPACING}):
  avMEZOvPeer ${AV_MEZOV_PEER} / MUSD
  avBTCvPeer  ${AV_BTCV_PEER} / MUSD

MUSD: MUSD_ADDRESS env, or DemoMUSD/MUSD in ${ADDRESSES_PATH}
Canonical mainnet MUSD: ${CANONICAL_MUSD_MAINNET}
`);
    return;
  }

  const broadcast = flags.has("--broadcast");
  const book = readAddressBook();
  const { address: musd, kind } = resolveMusdAddress(book);

  const planned: PoolRecord[] = [];
  if (!musd) {
    console.log("MUSD address not set (no DemoMUSD / MUSD_ADDRESS).");
    console.log("Dry-run continues with placeholder plan; broadcast will fail until MUSD exists.");
    for (const p of [
      { key: "avMEZOv-MUSD", share: AV_MEZOV_PEER, shareSymbol: "avMEZOv" },
      { key: "avBTCv-MUSD", share: AV_BTCV_PEER, shareSymbol: "avBTCv" },
    ]) {
      planned.push({
        key: p.key,
        share: p.share,
        shareSymbol: p.shareSymbol,
        musd: "",
        token0: "",
        token1: "",
        tickSpacing: TICK_SPACING,
        pool: null,
        sqrtPriceX96Init: SQRT_PRICE_1_1.toString(),
      });
    }
  } else {
    for (const p of horizonPairs(musd)) {
      const [token0, token1] = sortTokens(p.share, p.musd);
      planned.push({
        key: p.key,
        share: p.share,
        shareSymbol: p.shareSymbol,
        musd: p.musd,
        token0,
        token1,
        tickSpacing: TICK_SPACING,
        pool: null,
        sqrtPriceX96Init: SQRT_PRICE_1_1.toString(),
      });
    }
  }

  console.log(`Address book: ${ADDRESSES_PATH}`);
  console.log(`  PoolFactory: ${book.PoolFactory ?? "(missing)"}`);
  console.log(`  MUSD:        ${musd ?? "(missing)"} (${kind ?? "n/a"})`);
  console.log(`  tickSpacing: ${TICK_SPACING}`);
  console.log("Planned pools:");
  for (const p of planned) {
    console.log(`  ${p.key}: token0=${p.token0 || "?"} token1=${p.token1 || "?"} initSqrt=${p.sqrtPriceX96Init}`);
  }

  if (!broadcast) {
    const out: PoolsBook = {
      chainId: 84532,
      network: "baseSepolia",
      tickSpacing: TICK_SPACING,
      musd: musd,
      musdKind: kind,
      canonicalMusdMainnet: CANONICAL_MUSD_MAINNET,
      pools: planned.map((p) => ({
        ...p,
        musd: musd ?? "",
      })),
      note: isNonZeroAddress(book.PoolFactory)
        ? "Dry-run plan. Re-run with --broadcast after Slipstream + MUSD are ready."
        : "PoolFactory not deployed yet. Deploy Slipstream, then DemoMUSD, then --broadcast.",
    };
    writePoolsBook(out);
    console.log(`Wrote plan to ${POOLS_PATH} (pool addresses still null).`);
    if (!isNonZeroAddress(book.PoolFactory) || !musd) {
      console.log("Broadcast unavailable until PoolFactory and MUSD are set.");
    } else {
      console.log("Ready for --broadcast.");
    }
    return;
  }

  if (!musd) {
    console.error("Cannot broadcast: set MUSD_ADDRESS or deploy DemoMUSD first.");
    process.exit(1);
  }

  let factoryAddr: string;
  try {
    factoryAddr = requireFactory(book);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const { provider, wallet } = await connectProvider();
  if (!wallet) {
    console.error("Broadcast requires PRIVATE_KEY (or ETH_PRIVATE_KEY).");
    process.exit(1);
  }

  const factory = factoryContract(factoryAddr, wallet);
  const records: PoolRecord[] = [];

  for (const p of horizonPairs(musd)) {
    const [token0, token1] = sortTokens(p.share, p.musd);
    const existing = (await factory.getPool(token0, token1, TICK_SPACING)) as string;
    let pool = existing;
    if (!isNonZeroAddress(existing)) {
      console.log(`createPool ${p.key} token0=${token0} token1=${token1} spacing=${TICK_SPACING}`);
      const tx = await factory.createPool(token0, token1, TICK_SPACING, SQRT_PRICE_1_1);
      const receipt = await tx.wait();
      pool = (await factory.getPool(token0, token1, TICK_SPACING)) as string;
      console.log(`  pool=${pool} tx=${receipt?.hash}`);
    } else {
      console.log(`Pool already exists for ${p.key}: ${existing}`);
    }
    records.push({
      key: p.key,
      share: p.share,
      shareSymbol: p.shareSymbol,
      musd: p.musd,
      token0,
      token1,
      tickSpacing: TICK_SPACING,
      pool: isNonZeroAddress(pool) ? pool : null,
      sqrtPriceX96Init: SQRT_PRICE_1_1.toString(),
    });
  }

  const out: PoolsBook = {
    chainId: 84532,
    network: "baseSepolia",
    tickSpacing: TICK_SPACING,
    musd,
    musdKind: kind,
    canonicalMusdMainnet: CANONICAL_MUSD_MAINNET,
    pools: records,
    note: "CL200 vault-share/MUSD pools on minimal Slipstream (Base Sepolia).",
  };
  writePoolsBook(out);
  console.log(`Wrote ${POOLS_PATH}`);
  void provider.getNetwork();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
