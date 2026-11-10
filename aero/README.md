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
├── src/stubs/                  # Minimal voter/registry/legacy factory/descriptor
├── script/DeployMinimalCL.s.sol
├── scripts/deploy-slipstream-base-sepolia.ts
├── abis/minimal.ts
└── deployments/baseSepolia/addresses.json   # idempotent address book
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

PR5 consumes this file to create/seed `avMEZOv/MUSD` and `avBTCv/MUSD` pools.

## Gaps / notes

- Full official `DeployCL.s.sol` needs live Voter, FactoryRegistry, legacy factories, gauges, redistributor, and fee modules — intentionally not used here.
- Fee modules omitted: `getSwapFee` falls back to `tickSpacingToFee`; `getUnstakedFee` returns 0 when stub voter reports no live gauge.
- Compiling requires solc **0.7.6**. If `forge build` cannot download the binary (network/403), install it into Foundry's SVM cache manually, then re-run `forge build`.
- Nested `slipstream/lib/*` submodules must be initialized for remappings (`@openzeppelin`, `forge-std`, `@nomad-xyz`, etc.).
