/**
 * Mint a small full-range LP position into each Horizon share/MUSD CL200 pool via NPM.
 *
 * Default: dry-run (print mint params). --broadcast: approve + mint.
 * If the pool is missing, first mint uses sqrtPriceX96 != 0 (creates+inits); otherwise 0.
 *
 * Requires token balances (DemoMUSD is mintable; vault peers need prior bridge/mint).
 */
import { MaxUint256, parseEther } from "ethers";
import {
  ADDRESSES_PATH,
  POOLS_PATH,
  SQRT_PRICE_1_1,
  TICK_SPACING,
  connectProvider,
  erc20,
  factoryContract,
  fullRangeTicks,
  horizonPairs,
  isNonZeroAddress,
  npmContract,
  parseFlags,
  readAddressBook,
  readPoolsBook,
  requireFactory,
  requireNpm,
  resolveMusdAddress,
  sortTokens,
  writePoolsBook,
} from "./lib/horizon-pools.js";

/** Small demo seed — override with SEED_AMOUNT_SHARE / SEED_AMOUNT_MUSD (ether units). */
function seedAmounts(): { share: bigint; musd: bigint } {
  const share = parseEther(process.env.SEED_AMOUNT_SHARE || "0.01");
  const musd = parseEther(process.env.SEED_AMOUNT_MUSD || "0.01");
  return { share, musd };
}

async function ensureAllowance(
  token: ReturnType<typeof erc20>,
  owner: string,
  spender: string,
  amount: bigint,
  broadcast: boolean,
): Promise<void> {
  const current = (await token.allowance(owner, spender)) as bigint;
  if (current >= amount) return;
  if (!broadcast) {
    console.log(`  would approve ${await token.getAddress()} -> ${spender}`);
    return;
  }
  const tx = await token.approve(spender, MaxUint256);
  await tx.wait();
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv);
  if (flags.has("--help") || flags.has("-h")) {
    console.log(`Usage: tsx scripts/seed-horizon-lp.ts [--broadcast]

  (default)     print mint plan (no txs)
  --broadcast   approve + NPM.mint small full-range LP

Env: SEED_AMOUNT_SHARE / SEED_AMOUNT_MUSD (ether units, default 0.01)
Requires: PoolFactory + NPM in ${ADDRESSES_PATH}, MUSD, and token balances.
`);
    return;
  }

  const broadcast = flags.has("--broadcast");
  const book = readAddressBook();
  const poolsBook = readPoolsBook();
  const { address: musd } = resolveMusdAddress(book, poolsBook);
  const amounts = seedAmounts();
  const { tickLower, tickUpper } = fullRangeTicks(TICK_SPACING);

  if (!musd) {
    console.log("MUSD missing — dry-run only. Deploy DemoMUSD or set MUSD_ADDRESS.");
    if (broadcast) process.exit(1);
  }

  let factoryAddr: string | null = null;
  let npmAddr: string | null = null;
  try {
    factoryAddr = requireFactory(book);
    npmAddr = requireNpm(book);
  } catch (e) {
    console.log(e instanceof Error ? e.message : e);
    if (broadcast) process.exit(1);
  }

  console.log(`NPM: ${npmAddr ?? "(missing)"}  Factory: ${factoryAddr ?? "(missing)"}`);
  console.log(`Seed amounts: share=${amounts.share} musd=${amounts.musd}`);
  console.log(`Ticks: [${tickLower}, ${tickUpper}] spacing=${TICK_SPACING}`);

  if (!musd || !factoryAddr || !npmAddr) {
    console.log("Dry-run incomplete inputs; wrote nothing new.");
    return;
  }

  const { provider, wallet } = await connectProvider();
  if (broadcast && !wallet) {
    console.error("Broadcast requires PRIVATE_KEY (or ETH_PRIVATE_KEY).");
    process.exit(1);
  }

  const runner = wallet ?? provider;
  const factory = factoryContract(factoryAddr, runner);
  const npm = npmContract(npmAddr, runner);
  const updatedPools = [...(poolsBook.pools.length ? poolsBook.pools : [])];

  for (const p of horizonPairs(musd)) {
    const [token0, token1] = sortTokens(p.share, p.musd);
    const pool = (await factory.getPool(token0, token1, TICK_SPACING)) as string;
    const poolExists = isNonZeroAddress(pool);
    const sqrtPriceX96 = poolExists ? 0n : SQRT_PRICE_1_1;

    const amount0Desired = token0.toLowerCase() === p.share.toLowerCase() ? amounts.share : amounts.musd;
    const amount1Desired = token1.toLowerCase() === p.share.toLowerCase() ? amounts.share : amounts.musd;

    console.log(`\n${p.key}`);
    console.log(`  pool=${poolExists ? pool : "(will create via mint)"} sqrtPriceX96=${sqrtPriceX96}`);
    console.log(`  token0=${token0} amount0=${amount0Desired}`);
    console.log(`  token1=${token1} amount1=${amount1Desired}`);

    if (!broadcast || !wallet) continue;

    const t0 = erc20(token0, wallet);
    const t1 = erc20(token1, wallet);
    const bal0 = (await t0.balanceOf(wallet.address)) as bigint;
    const bal1 = (await t1.balanceOf(wallet.address)) as bigint;

    // DemoMUSD is publicly mintable; top up if short.
    if (bal0 < amount0Desired) {
      try {
        console.log(`  minting token0 deficit…`);
        await (await t0.mint(wallet.address, amount0Desired - bal0)).wait();
      } catch {
        console.error(`  insufficient token0 balance ${bal0} (need ${amount0Desired})`);
        process.exit(1);
      }
    }
    if (bal1 < amount1Desired) {
      try {
        console.log(`  minting token1 deficit…`);
        await (await t1.mint(wallet.address, amount1Desired - bal1)).wait();
      } catch {
        console.error(`  insufficient token1 balance ${bal1} (need ${amount1Desired})`);
        process.exit(1);
      }
    }

    await ensureAllowance(t0, wallet.address, npmAddr, amount0Desired, true);
    await ensureAllowance(t1, wallet.address, npmAddr, amount1Desired, true);

    const deadline = Math.floor(Date.now() / 1000) + 60 * 30;
    const tx = await npm.mint({
      token0,
      token1,
      tickSpacing: TICK_SPACING,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min: 0,
      amount1Min: 0,
      recipient: wallet.address,
      deadline,
      sqrtPriceX96,
    });
    const receipt = await tx.wait();
    const poolAfter = (await factory.getPool(token0, token1, TICK_SPACING)) as string;
    console.log(`  minted liquidity; pool=${poolAfter} tx=${receipt?.hash}`);

    const idx = updatedPools.findIndex((r) => r.key === p.key);
    const record = {
      key: p.key,
      share: p.share,
      shareSymbol: p.shareSymbol,
      musd: p.musd,
      token0,
      token1,
      tickSpacing: TICK_SPACING,
      pool: poolAfter,
      sqrtPriceX96Init: SQRT_PRICE_1_1.toString(),
    };
    if (idx >= 0) updatedPools[idx] = record;
    else updatedPools.push(record);
  }

  if (broadcast && wallet) {
    writePoolsBook({
      ...poolsBook,
      musd,
      pools: updatedPools,
      note: "Pools seeded with small full-range LP via NPM.",
    });
    console.log(`\nUpdated ${POOLS_PATH}`);
  } else {
    console.log("\nDry-run complete (no txs). Re-run with --broadcast to mint.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
