# Mainnet Aerodrome Horizon pools (Base)

Operator runbook for **avMEZOv / MUSD** and **avBTCv / MUSD** Slipstream pools on **Base mainnet**.

## MUSD: Sepolia vs mainnet

| Network | MUSD |
|---|---|
| **Base Sepolia** | `DemoMUSD` (deployed via `pnpm deploy:demo-musd:broadcast`) |
| **Base mainnet** | Canonical MUSD `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` (Wormhole NTT) |

Do **not** point mainnet pools at DemoMUSD. Canonical MUSD has no code on Base Sepolia.

## Aurove ops Slipstream addresses (Base mainnet)

Verified against parent monorepo `scripts/lib/aero-musd-mezo-liquidity.ts` / `aero-swap.ts`:

| Role | Address |
|---|---|
| CL factory | `0x9CB220581b91b0C83223012FE69688b92aD07a76` |
| Swap router | `0x9Ee35Bf1bd69a03c6F0393582030fCe8Bb93D418` |

NPM is read from the pool (`pool.nft()`) after create; do not assume a Sepolia stub NPM on mainnet.

## Pool parameters

- **Tick spacing:** `200` (CL200; fee from factory `tickSpacingToFee`)
- **Pairs:** mainnet VaultPeer `avMEZOv` + canonical MUSD; mainnet VaultPeer `avBTCv` + canonical MUSD
- Resolve peer addresses from `contracts/deployments` once mainnet peers are live (Sepolia peers in this package are **not** valid on mainnet)

## Token0 / token1 sorting

Slipstream requires **`token0 < token1`** by address (lowercase hex compare). Sort before `createPool` / `NPM.mint`:

```ts
const [token0, token1] =
  share.toLowerCase() < musd.toLowerCase() ? [share, musd] : [musd, share];
```

Unsorted keys revert or resolve the wrong pool.

## Create + initialize

1. Confirm factory has tick spacing `200` enabled.
2. `getPool(token0, token1, 200)` — skip create if already non-zero.
3. `CLFactory.createPool(tokenA, tokenB, 200, sqrtPriceX96)` with a deliberate init price (demo scripts use tick-0 / 1:1 `79228162514264337593543950336`; production should match expected share/MUSD spot).
4. Seed LP via official NPM `mint` (`sqrtPriceX96 = 0` once the pool is initialized). Align `tickLower` / `tickUpper` to multiples of `200`.

Sepolia helpers (`create-horizon-pools`, `seed-horizon-lp`) target the **minimal** Sepolia Slipstream + DemoMUSD stack. On mainnet, call the ops factory/router above (or mirror those scripts with mainnet addresses + canonical MUSD).

## Gauge listing (follow-on)

Pool create + seed does **not** attach emissions. Gauge listing is a **separate** Aerodrome / **veAERO** governance step after the pool exists and has liquidity. Stake LP NFTs only after a live gauge is approved for the pool.
