# Horizon Destination Executor (Wave 2 stretch)

Minimal scaffolding for destination-side (Base) execution after a Mezo → Base vault-share bridge.

## Wave 2 destination execution layers

| Priority | Scope | Status |
|----------|--------|--------|
| **P0** | Guided UX in the dapp: user bridges, then manually swaps / LPs on Aerodrome Slipstream | Done in dapp |
| **P1** | Wormhole Executor auto-redeem (relayer completes NTT delivery without user claim) | Out of this stretch |
| **P2** | Mint-to-executor + on-contract swap / LP (`HorizonDestinationExecutor`) | This contract |

## Custody preference

Prefer **mint-to-executor** over mint-to-wallet when the goal is an atomic zap:

1. NTT mints the vault-share **peer** to `HorizonDestinationExecutor`.
2. Anyone (or a keeper) calls `swapExactIn` — the contract spends its own balance first, then pulls any shortfall from the caller.
3. Slipstream `SwapRouter.exactInputSingle` sends `tokenOut` (typically MUSD) to `recipient`.
4. `mintLp` is a stub (`revert("not implemented")`) for a follow-on NPM wrapper.

Mint-to-wallet remains fine for P0 guided UX; mint-to-executor unlocks atomic destination zaps without an extra user approve hop for the bridged amount.

## Contract surface

- **Config (owner):** Slipstream `swapRouter`, `npm`, `musd`, peer-token allowlist.
- **`swapExactIn(tokenIn, tokenOut, amountIn, minOut, recipient, tickSpacing)`** → `ISlipstreamSwapRouter.exactInputSingle`.
- **`mintLp()`** → reverts until NPM mint wiring lands.
- **Event:** `SwapExecuted`.

## Deploy (Base Sepolia stub)

```bash
# Simulation only — no broadcast required for this stretch
cd contracts
forge script script/DeployHorizonDestinationExecutor.s.sol:DeployHorizonDestinationExecutor \
  --rpc-url "$BASE_SEPOLIA_RPC_URL" -vv
```

Wire `SWAP_ROUTER`, `NPM`, `MUSD`, and optional `PEER_TOKEN` from `aero/deployments/baseSepolia/addresses.json` (and peer deploy artifacts) after Slipstream + DemoMUSD are live.

## Tests

Unit tests use a mock Slipstream router under Foundry (`solc 0.8.28` in `contracts/`). They intentionally do **not** compile against the aero Slipstream tree (`solc 0.7.6`) to avoid cross-package version conflict.
