# Horizon Destination Executor (Wave 2 stretch)

Minimal scaffolding for destination-side (Base) execution after a Mezo → Base vault-share bridge.

## Wave 2 destination execution layers

| Priority | Scope | Status |
|----------|--------|--------|
| **P0** | Guided UX in the dapp: user bridges, then manually swaps / LPs on Aero Slipstream | Done in dapp |
| **P1** | Wormhole Executor auto-redeem (relayer completes NTT delivery without user claim) | Out of this stretch |
| **P2** | Mint-to-executor + on-contract swap / LP (`HorizonDestinationExecutor`) | This contract |

## Custody preference

**Default for Wave 2 demos:** mint the vault-share **peer to the user’s wallet** (P0). The user then swaps / LPs in the dapp. That keeps bridged inventory under the user’s control.

**Mint-to-executor** is only for an owner/keeper zap once `swapExactIn` is restricted:

1. NTT mints the vault-share **peer** to `HorizonDestinationExecutor`.
2. The **owner** (or a future authorized operator) calls `swapExactIn` — the contract spends its own balance first, then pulls any shortfall from the owner.
3. Slipstream `SwapRouter.exactInputSingle` sends `tokenOut` (typically MUSD) to `recipient`.
4. `mintLp` is a stub (`revert("not implemented")`) for a follow-on NPM wrapper.

Do **not** mint to the executor while `swapExactIn` is callable by arbitrary addresses: shared custody plus a free `recipient` argument lets a third party swap out bridged balances. The current Solidity requires `onlyOwner` on `swapExactIn` for that reason.

> **Deployed Base Sepolia note:** the Wave 2 address in `SUBMISSION.md` / `aero/deployments/baseSepolia/addresses.json` was broadcast before `onlyOwner` landed. Treat that deployment as a non-custodial stub (do not mint user funds to it). Redeploy from this package before using mint-to-executor custody.

## Contract surface

- **Config (owner):** Slipstream `swapRouter`, `npm`, `musd`, peer-token allowlist.
- **`swapExactIn(tokenIn, tokenOut, amountIn, minOut, recipient, tickSpacing)`** → `onlyOwner`; `ISlipstreamSwapRouter.exactInputSingle`.
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
