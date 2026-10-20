# Aurove Horizon

**Locked on Mezo. Liquid everywhere.**

Cross-chain liquidity infrastructure for tokenized Mezo Earn positions.

Horizon extends [Aurove](https://github.com/aurove)'s liquid representations of veBTC and veMEZO positions into ERC-4626 vaults, making them composable across DeFi ecosystems.

Aurove transforms locked BTC and MEZO positions into **1:1 liquid ERC-1155 representations**, which can be wrapped 1:1 into fungible ERC-20 tokens. Horizon takes these assets further by introducing ERC-4626 vaults whose shares can be bridged across chains and deployed into external liquidity markets.

Starting with Mezo and Base, Horizon enables these assets to participate in MUSD liquidity pools on Aerodrome while their underlying positions remain in Mezo Earn, continuing to generate rewards and yield.

> **Status:** Under development for the 2026 Mezo Buildathon on AKINDO. The architecture and roadmap below describe the intended implementation.

## The Problem

Mezo Earn allows users to lock BTC and MEZO, receiving veBTC and veMEZO positions that provide access to protocol incentives, rewards, and governance.

However, locking capital traditionally comes with a trade-off: assets committed to long-term positions become less accessible for trading, liquidity provision, and other DeFi opportunities.

Aurove addresses this by making veNFT positions liquid through standardized token representations.

But liquidity confined to one chain still has limitations.

**What if capital locked in Mezo Earn could participate in DeFi markets across multiple chains without requiring users to exit their original positions?**

## Introducing Horizon

Horizon is Aurove's cross-chain vault and liquidity extension.

It introduces three capabilities:

1. **Tokenized Vaults:** Extend Aurove's 1:1 liquid representations into ERC-4626 vaults, enabling standardized vault shares that integrate with ERC-20-based DeFi infrastructure.
2. **Cross-Chain Mobility:** Bridge vault shares from Mezo to other supported networks through Wormhole's Native Token Transfers (NTT) infrastructure.
3. **External Liquidity:** Enable bridged vault shares to trade and provide liquidity against MUSD on Aerodrome, beginning on Base.

The underlying veNFT positions remain in Aurove's custody system on Mezo. Horizon transports their tokenized economic representations, not the original veNFTs.

The goal is straightforward: **make locked capital usable wherever DeFi liquidity exists.**

## How It Works

```mermaid
flowchart TD
    A["Locked BTC / MEZO<br/>Mezo Earn"] --> B["veBTC / veMEZO Positions"]
    B --> C["Aurove<br/>1:1 ERC-1155 Representation"]
    C --> D["Id20<br/>1:1 ERC-20 Wrapper"]
    D --> E["Horizon<br/>ERC-4626 Vault"]
    E --> F["ERC-4626 Vault Shares"]
    F --> G["Wormhole NTT<br/>Cross-Chain Transfer"]
    G --> H["Bridged Vault Shares<br/>Base"]
    H --> I["Aerodrome<br/>Liquidity Pool"]
    J["MUSD on Base"] --> I

    I --> K["Cross-Chain Liquidity<br/>Trading and DeFi Utility"]
```

### 1. Start with a locked position

Users lock BTC or MEZO through Mezo Earn, receiving veBTC or veMEZO positions that represent their locked capital and associated protocol rights.

These positions continue participating in Mezo Earn under the protocol's lock and reward rules.

### 2. Make the position liquid with Aurove

Aurove converts veNFT positions into **1:1 liquid ERC-1155 representations**, preserving their underlying asset denomination and accounting for the corresponding locked positions.

Each ERC-1155 position class can then be wrapped **1:1 into an ERC-20 token through Aurove's Id20 system**, allowing users to move between ERC-1155 and ERC-20 representations without changing the number of units represented.

This two-layer model provides several benefits:

- **1:1 representation:** Liquid ERC-1155 units correspond to the underlying locked position units.
- **1:1 wrapping:** Every Id20 token represents an equivalent unit of its corresponding ERC-1155 asset.
- **DeFi compatibility:** Both token standards can integrate with DeFi infrastructure, with Id20 providing native compatibility with ERC-20-based protocols.
- **Transparent pricing:** The 1:1 denomination makes it easier to value and compare the liquid representations against canonical ERC-20 BTC and MEZO assets in liquidity markets.

This does not imply guaranteed price parity with unlocked BTC or MEZO. Market prices can reflect lock restrictions, remaining duration, liquidity, and associated reward entitlements.

The result is a standardized representation of locked capital that can be transferred, traded, and integrated into DeFi while its underlying position remains in Mezo Earn.

### 3. Deposit into a Horizon vault

Horizon accepts an eligible Id20 token into a corresponding ERC-4626 vault.

Depositors receive transferable vault shares representing a proportional claim on the vault's underlying Id20 assets.

Unlike Aurove's fixed 1:1 ERC-1155-to-Id20 wrapping, ERC-4626 vault shares use an exchange rate determined by the vault's assets and share supply. As yield compounds, each share can represent an increasing quantity of Id20.

The initial design focuses on existing managed Aurove positions, with support for additional position classes planned.

### 4. Bridge to Base

Vault shares are designed to move between Mezo and Base using Wormhole NTT infrastructure once deployment and configuration are complete.

The intended cross-chain design maintains a backed representation of the originating vault shares while the underlying locked positions remain on Mezo.

### 5. Access Aerodrome liquidity

On Base, bridged Horizon vault shares are intended to be paired with MUSD in Aerodrome liquidity pools.

Users will be able to trade these representations or provide liquidity without requiring the original veNFT positions to leave Mezo.

### 6. Return to Mezo

The process is designed to work in reverse.

The intended return path lets users withdraw liquidity, bridge vault shares back to Mezo, redeem ERC-4626 shares for underlying Id20 tokens, and continue through Aurove's existing redemption lifecycle.

**Mezo Earn rewards and yields are claimable only on Mezo, through the applicable withdrawal or redemption process.** Bridging vault shares to Base does not transfer the underlying reward-claiming mechanism to Base.

Horizon vaults can capture yield through Aurove's on-Mezo compounding mechanism, but users cannot directly claim their underlying Mezo Earn rewards on the destination chain.

Redemption of vault shares does not bypass the original veNFT's lock or withdrawal restrictions.

## Architecture

Horizon extends Aurove's existing infrastructure rather than replacing it.

| Component | Role |
|---|---|
| **Mezo Earn** | Original veBTC and veMEZO positions, locks, and protocol rewards |
| **Aurove Ledger** | 1:1 ERC-1155 representation and accounting for liquid positions |
| **Aurove Id20** | 1:1 ERC-20 wrappers for fungible ERC-1155 position classes |
| **Horizon Vaults** | ERC-4626 vaults accepting eligible Id20 assets and compounding attributable yield |
| **Wormhole NTT** | Cross-chain transfers of vault shares |
| **Aerodrome** | Trading and liquidity provision for bridged shares against MUSD |

### ERC-4626 Vaults

ERC-4626 provides a standardized interface for tokenized vaults, including deposits, withdrawals, share accounting, and asset conversion.

Horizon uses this standard to expose existing Aurove assets to a broader range of ERC-20-based protocols.

Each vault is intended to correspond to a defined, fungible underlying position class, preventing different lock terms or economic entitlements from being combined without an explicit accounting model.

### Reward Accounting and Compounding

**Yield originates in Mezo Earn and is processed through Aurove's existing reward infrastructure.**

Aurove claims and harvests rewards from Mezo Earn and compounds those yields into additional Id20 units, increasing the liquid assets attributable to the underlying positions.

Horizon builds on this mechanism.

Vaults holding eligible Id20 assets can claim their attributable compounded Id20 yields through Aurove and reinvest them into the vault's underlying asset balance.

This increases the total Id20 assets backing the vault's existing shares, allowing the ERC-4626 exchange rate to appreciate as yield is compounded.

As a result:

- The original BTC and MEZO positions remain committed to Mezo Earn.
- Aurove manages reward harvesting and conversion into additional liquid Id20 assets on Mezo.
- Horizon vaults can claim and compound those attributable Id20 yields.
- Vault-share holders participate in the resulting asset-per-share growth without individually claiming the underlying Mezo Earn rewards.
- Bridged vault shares remain backed by shares of the originating Mezo vault.

**Yield is generated, claimed, and compounded on Mezo.** Users accessing Horizon assets on other chains gain exposure to the resulting vault value, but the underlying rewards and yields are claimable only on Mezo when the applicable positions are redeemed or withdrawn.

This architecture separates yield generation from cross-chain liquidity while preserving the underlying reward-accounting rules.

### Cross-Chain Design

Horizon is designed around a canonical vault-share supply on Mezo with representations on supported destination chains.

The bridge implementation must preserve supply conservation, enforce authorized cross-chain messaging, and support a complete return path to the originating ERC-4626 vault.

Horizon does not bridge the underlying veNFTs or transfer Mezo Earn custody to external chains.

## Repository Structure

Horizon uses a workspace repository with independently maintained Git submodules.

```text
horizon/
├── contracts/          # Horizon smart contracts
├── wormhole/           # Wormhole integration
├── package.json        # Root workspace package
├── .gitmodules         # Submodule configuration
└── README.md
```

**Repositories**

- [Horizon Workspace](https://github.com/aurove/horizon)
- [Horizon Contracts](https://github.com/aurove/horizon-contracts)
- [Horizon Wormhole](https://github.com/aurove/horizon-wormhole)

## Development

### Prerequisites

- Git
- Node.js and a compatible package manager
- An EVM development environment, as configured by the contract implementation
- RPC access and funded development accounts for the networks being tested

### Clone the repository

```bash
git clone --recurse-submodules https://github.com/aurove/horizon.git
cd horizon
```

For an existing checkout:

```bash
git submodule update --init --recursive
```

### Working with submodules

To fetch the latest commits from the configured submodule branches:

```bash
git submodule update --remote
```

The workspace provides root scripts for building and testing the contracts and initializing the Wormhole NTT configuration. See [`wormhole/README.md`](./wormhole/README.md) for NTT CLI setup and deployment steps.

The end-to-end deployment entry points are `pnpm deploy:cross-chain:testnet` and `pnpm deploy:cross-chain:mainnet`. They deploy the Mezo vaults and Base peers, deploy/configure NTT, set per-token rate limits, and seal each spoke peer to its NTT Manager. See [`wormhole/README.md`](./wormhole/README.md) for required environment variables and safeguards.

## Buildathon Roadmap

Horizon is being developed during the **2026 Mezo Buildathon on AKINDO**.

### Phase 1 — Vault Infrastructure

- [x] Implement ERC-4626 vaults for eligible Aurove Id20 assets.
- [x] Define a one-vault-per-Id20 creation registry in `VaultFactory`.
- [x] Implement deposit, mint, withdraw, and redeem flows for vault shares.
- [x] Integrate Aurove Id20 reward claiming and gauge compounding.
- [x] Add vault accounting, conversion, withdrawal, and invariant test coverage.

### Phase 2 — Cross-Chain Integration

- [x] Initialize NTT tooling, pin the CLI, and provide config initialization and deployment helpers.
- [x] Implement the Base `VaultPeer` representation with an NTT-manager-only mint/burn boundary and one-time minter sealing.
- [x] Add a modular Horizon deployment script for Mezo vaults, Base peers, NTT managers, peer configuration, limits, and minter handoff.
- [ ] Execute the deployment and configure Mezo and Base endpoints on the target networks.
- [ ] Implement cross-chain transfer and settlement flows.
- [ ] Run Mezo → Base → Mezo round-trip tests and verify backing and supply conservation.
- [ ] Test return transfers and vault redemption.

### Phase 3 — External Liquidity

- [ ] Integrate bridged Horizon shares with Aerodrome.
- [ ] Create initial vault-share/MUSD liquidity pools.
- [ ] Implement liquidity provisioning and removal flows.
- [ ] Build the end-to-end user experience.
- [ ] Demonstrate the complete Mezo → Base → Mezo lifecycle.

### Phase 4 — Yield Optimization

- [ ] Optimize harvesting and vault-level compounding.
- [ ] Improve vault share accounting and yield visibility.
- [ ] Extend support to additional Aurove position classes.
- [ ] Improve cross-chain liquidity management and integrations.

Checked items describe implementation and test coverage in the repository. Network deployment, live NTT configuration, and bridge round-trip verification remain outstanding.

## Security Considerations

Horizon introduces additional risks beyond those of the underlying veNFT positions and the existing Aurove protocol.

Important considerations include:

- **Vault accounting:** ERC-4626 deposits, withdrawals, conversions, rounding, and share pricing must preserve underlying asset accounting.
- **Reward accounting:** Claimed rewards, pending Id20 entitlements, and compounded assets must not be double-counted.
- **Cross-chain security:** Bridged shares depend on the security and configuration of the messaging and token-transfer infrastructure.
- **Liquidity risk:** Vault-share markets may have limited liquidity, price deviations, and slippage.
- **LP risk:** Providing concentrated liquidity can expose users to impermanent loss and out-of-range positions.
- **Underlying lock restrictions:** Liquid representations do not remove the original veNFT lock conditions.
- **External dependencies:** Horizon depends on the correct operation of Aurove, Mezo Earn, Wormhole, Aerodrome, and the tokens involved.

**Horizon is experimental software under development. It should not be treated as audited or production-ready unless an explicit security assessment and deployment announcement are published.**

## The Bigger Picture

Aurove makes locked BTC and MEZO positions liquid through **1:1 ERC-1155 representations and 1:1 ERC-20 wrappers**, making their economic value easier to access, integrate, and price in DeFi.

Horizon makes that liquidity portable and yield-bearing through ERC-4626 vaults.

By combining Aurove's existing tokenization and compounding infrastructure with cross-chain interoperability and external liquidity markets, Horizon aims to expand the utility of Mezo-native capital beyond its originating network.

Base and Aerodrome are the starting point, not the limit.

The long-term vision is a network of interoperable vault assets that allow locked capital to remain productive on its home chain while accessing liquidity and opportunities across DeFi.

**Locked on Mezo. Liquid everywhere.**

---

### Links

- [Aurove on GitHub](https://github.com/aurove)
- [Horizon Repository](https://github.com/aurove/horizon)
- [Mezo](https://mezo.org/)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [Wormhole Documentation](https://wormhole.com/docs/)
- [Aerodrome](https://aerodrome.finance/)

### License

A license has not yet been declared in this repository. License terms and applicable third-party notices should be added before distribution or reuse.
