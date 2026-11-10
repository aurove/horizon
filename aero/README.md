# `@aurove/horizon-aero`

Minimal Aerodrome **Slipstream** stack for Horizon Wave 2 demos on **Base Sepolia**.

## Scope

Deploy enough to **create pools, swap, and LP**:

| Contract | Role |
|---|---|
| `CLPool` implementation + `CLFactory` | Concentrated liquidity pools |
| `NonfungiblePositionManager` | Mint / manage LP NFTs |
| `SwapRouter` | Exact-in/out swaps |
| `QuoterV2` | Off-chain quotes (optional for UI) |
| Stub `MinimalVoter` + `MinimalFactoryRegistry` + `MinimalLegacyCLFactory` | Satisfy `CLFactory` constructor without veAERO/Voter/Minter |

**Out of scope:** gauges, redistributor, fee modules, veAERO emissions.

Default tick spacing: **200** (fee 3_000), enabled in `CLFactory` constructor.

Upstream submodule: [`aero/slipstream`](https://github.com/aerodrome-finance/slipstream) (pinned commit via `.gitmodules`).

WETH (Base Sepolia): `0x4200000000000000000000000000000000000006`.

## Layout

```
aero/
├── slipstream/                 # git submodule (aerodrome-finance/slipstream)
├── src/stubs/                  # Minimal voter/registry/legacy factory/descriptor + DemoMUSD
├── script/DeployMinimalCL.s.sol
├── scripts/
│   ├── deploy-slipstream-base-sepolia.ts
│   ├── deploy-demo-musd.ts
│   ├── create-horizon-pools.ts
│   ├── seed-horizon-lp.ts
│   └── lib/horizon-pools.ts
├── abis/minimal.ts
└── deployments/baseSepolia/
    ├── addresses.json          # Slipstream + DemoMUSD address book
    └── pools.json              # avMEZOv/MUSD + avBTCv/MUSD CL200 pools
```

## Prerequisites

- Foundry (`forge`) with **solc 0.7.6** available (`forge` auto-downloads when network allows)
- Node / pnpm (workspace member `@aurove/horizon-aero`)
- For broadcast: `PRIVATE_KEY` or `ETH_PRIVATE_KEY`, and `BASE_SEPOLIA_RPC_URL`

Init nested Slipstream libs once:

```bash
git submodule update --init --recursive aero/slipstream
```

## Compile

```bash
pnpm --filter @aurove/horizon-aero install
pnpm --filter @aurove/horizon-aero build
# or from aero/:
forge build
```

## Deploy (Base Sepolia)

Dry-run / scaffolding check (default — **no broadcast**):

```bash
pnpm --filter @aurove/horizon-aero deploy:slipstream:base-sepolia
```

Broadcast (writes `deployments/baseSepolia/addresses.json`):

```bash
export PRIVATE_KEY=...          # or ETH_PRIVATE_KEY
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
pnpm --filter @aurove/horizon-aero deploy:slipstream:base-sepolia:broadcast
```

Idempotent: if `PoolFactory` is already set in the address book, broadcast is skipped unless `--force`.

Equivalent forge invocation:

```bash
cd aero
AERO_ADDRESSES_OUT="$PWD/deployments/baseSepolia/addresses.json" \
PRIVATE_KEY=... \
forge script script/DeployMinimalCL.s.sol:DeployMinimalCL \
  --rpc-url "$BASE_SEPOLIA_RPC_URL" --broadcast --slow -vvv
```

### Manual `forge create` fallback

See `tsx scripts/deploy-slipstream-base-sepolia.ts --help` for step-by-step `forge create` order (stubs → CLPool → CLFactory → NPM → SwapRouter → QuoterV2).

## Address book

`deployments/baseSepolia/addresses.json` starts as a placeholder (`deployed: false`). After a successful broadcast it records:

- `PoolFactory`, `PoolImplementation`
- `NonfungiblePositionManager`, `SwapRouter`, `QuoterV2`
- Stub addresses + `defaultTickSpacing: 200`

Pool scripts also read/write `deployments/baseSepolia/pools.json`.

## MUSD on Base Sepolia

Canonical **mainnet** MUSD (Mezo / Ethereum / Base, Wormhole NTT):

`0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186`

That address has **no code on Base Sepolia** (Portal/Wormhole MUSD is mainnet-only). For Sepolia demos:

```bash
pnpm --filter @aurove/horizon-aero deploy:demo-musd            # dry-run
pnpm --filter @aurove/horizon-aero deploy:demo-musd:broadcast  # writes DemoMUSD + MUSD into addresses.json
```

Override with `MUSD_ADDRESS=0x…` when a real testnet MUSD appears.

## Create / seed Horizon share–MUSD pools

Vault peers (Base Sepolia):

| Share | Address |
|---|---|
| avMEZOvPeer | `0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855` |
| avBTCvPeer | `0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132` |

```bash
# After Slipstream (+ DemoMUSD) are recorded in addresses.json:
pnpm --filter @aurove/horizon-aero create:horizon-pools            # dry-run → pools.json plan
pnpm --filter @aurove/horizon-aero create:horizon-pools:broadcast  # CLFactory.createPool (tickSpacing 200)
pnpm --filter @aurove/horizon-aero seed:horizon-lp                 # dry-run mint plan
pnpm --filter @aurove/horizon-aero seed:horizon-lp:broadcast       # small full-range NPM.mint
```

Slipstream has **no** `createAndInitializePoolIfNecessary`. Use either:

1. `CLFactory.createPool(tokenA, tokenB, tickSpacing, sqrtPriceX96)`, then `NPM.mint` with `sqrtPriceX96 = 0`, or
2. `NPM.mint` with **`sqrtPriceX96 != 0`** on the first mint (creates + initializes the pool).

**Token ordering:** callers must pass **`token0 < token1`** (address sort) into `NPM.mint` / pool keys. Sorting is not done inside mint — unsorted tokens revert or compute the wrong pool address.

Default demo tick spacing: **200**. Align `tickLower` / `tickUpper` to multiples of 200.

Root orchestrator optional hook: set `HORIZON_RUN_AERO=YES` when running `pnpm deploy:cross-chain:testnet` to attempt Slipstream deploy + pool create after NTT setup. Missing keys or aero failures are logged and **do not** fail the cross-chain deploy.

## Gaps / notes

- Full official `DeployCL.s.sol` needs live Voter, FactoryRegistry, legacy factories, gauges, redistributor, and fee modules — intentionally not used here.
- Fee modules omitted: `getSwapFee` falls back to `tickSpacingToFee`; `getUnstakedFee` returns 0 when stub voter reports no live gauge.
- Compiling requires solc **0.7.6**. If `forge build` cannot download the binary (network/403), install it into Foundry's SVM cache manually, then re-run `forge build`.
- Nested `slipstream/lib/*` submodules must be initialized for remappings (`@openzeppelin`, `forge-std`, `@nomad-xyz`, etc.).
