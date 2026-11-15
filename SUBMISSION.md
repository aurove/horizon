# Horizon — Hackathon Submission

Judge packet for the **2026 Mezo Buildathon / AKINDO** (Wave 2). Product overview and developer setup: [`README.md`](./README.md). Contract and NTT technical references: [`contracts/README.md`](./contracts/README.md), [`wormhole/README.md`](./wormhole/README.md).

## Live URLs

| Surface | URL | Notes |
| --- | --- | --- |
| dApp (testnet) | https://testnet.aurove.xyz | **Primary judge URL** — Horizon bridge + Base Sepolia swap |
| dApp (production) | https://www.aurove.xyz | Public (HTTP 200) |
| dApp source | https://github.com/aurove/dapp/tree/testnet | Use the **`testnet`** branch |
| Local dApp (fallback) | Clone the `testnet` branch, then `pnpm install && pnpm --filter @aurove/dapp dev` | Wallet flows against local UI |
| Demo video | _TBD_ | Link walkthrough once recorded |
| Pitch / deck | [`docs/pitch/Aurove-Horizon-Wave2.pptx`](./docs/pitch/Aurove-Horizon-Wave2.pptx) | Regenerate via `node docs/pitch/generate-horizon-deck.js` |

> **Judge note:** Prefer https://testnet.aurove.xyz for Horizon Wave 2. Production www is the broader Aurove app. If a hosted URL is unavailable, run the dApp locally from the `testnet` branch.

## Public repos

| Repo | URL | Visibility |
| --- | --- | --- |
| Horizon (contracts + Wormhole NTT + Aero) | https://github.com/aurove/horizon | **public** · MIT |
| Horizon Contracts submodule | https://github.com/aurove/horizon-contracts | **public** · MIT |
| Horizon Wormhole submodule | https://github.com/aurove/horizon-wormhole | **public** · MIT |
| dApp | https://github.com/aurove/dapp/tree/testnet | **public** (`testnet` branch) |

## Contract addresses (testnet)

Sources: `contracts/deployments/{testnet,baseSepolia}/` and `wormhole/vaults/*/testnet/deployment.json`. Deployer / NTT owner: `0x6E1126EA838DA392A55D8DdeD9bADEccA5835114`.

### Mezo testnet — Horizon vaults

Redeployed 2026-11-10 (dual-ABI Vault + dead-share seed path). Dead shares seeded from deployer Id20 (`1e12` assets → `0x…dEaD` on both vaults).

| Contract | Address | Explorer |
| --- | --- | --- |
| VaultFactory | `0x48E6cF84FFEd65AeB7Ee560123065606Df4D1f99` | [Blockscout verified](https://explorer.test.mezo.org/address/0x48E6cF84FFEd65AeB7Ee560123065606Df4D1f99#code) |
| avBTC Vault (`avBTCv`) | `0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f` | [Sourcify verified](https://repo.sourcify.dev/31611/0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f) · [explorer](https://explorer.test.mezo.org/address/0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f) |
| avMEZO Vault (`avMEZOv`) | `0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c` | [Sourcify verified](https://repo.sourcify.dev/31611/0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c) · [explorer](https://explorer.test.mezo.org/address/0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c) |

Factory-created vaults are verified on Sourcify. Mezo Blockscout may still report “not a smart-contract” for those CREATE addresses even when RPC bytecode and Sourcify matches are live.

Underlying Id20 assets (from vault `linkedData`):

| Asset | Address |
| --- | --- |
| avBTC Id20 (`avBTCm`) | `0xf2aeB53d71CD541EFeaA37788F0841D7d21612F9` |
| avMEZO Id20 (`avMEZOm`) | `0x0aeDdEaB271Bc032d6758c34Dc8356632D6F812e` |

### Base Sepolia — VaultPeer tokens + MUSD + Aero

| Contract | Address | Explorer |
| --- | --- | --- |
| avBTCv peer | `0x0d36e2B7350950662859A82A91E13Ad7d0E594E0` | [Basescan verified](https://sepolia.basescan.org/address/0x0d36e2B7350950662859A82A91E13Ad7d0E594E0#code) |
| avMEZOv peer | `0x172096f3F0F98B9dc1302695A48044D6A3D799C9` | [Basescan verified](https://sepolia.basescan.org/address/0x172096f3F0F98B9dc1302695A48044D6A3D799C9#code) |
| MUSD (pinned) | `0x560985f804De8187E8FBA94F7127Bc4c0e54AEA5` | [token](https://sepolia.basescan.org/address/0x560985f804De8187E8FBA94F7127Bc4c0e54AEA5) |
| HorizonDestinationExecutor | `0xA874C686D513B079A02399B4dAFC36669C23Ad5b` | [Basescan verified](https://sepolia.basescan.org/address/0xA874C686D513B079A02399B4dAFC36669C23Ad5b#code) |
| Slipstream PoolFactory (`CLFactory`) | `0x6e8614B6f32145D680209a4959153f36BD208b85` | [Basescan verified](https://sepolia.basescan.org/address/0x6e8614B6f32145D680209a4959153f36BD208b85#code) |
| Pool implementation (`CLPool`) | `0xcF67F0Bb906B38AaE207015b9C20C53C3fe84610` | [Basescan verified](https://sepolia.basescan.org/address/0xcF67F0Bb906B38AaE207015b9C20C53C3fe84610#code) |
| NonfungiblePositionManager | `0xB0D6450Ed37Da105B7ea3cd29D1256616DaA9B5F` | [Basescan verified](https://sepolia.basescan.org/address/0xB0D6450Ed37Da105B7ea3cd29D1256616DaA9B5F#code) |
| SwapRouter | `0xE056f7fF35B952E7BE7D78b8F68c0F293fB6E6Ba` | [Basescan verified](https://sepolia.basescan.org/address/0xE056f7fF35B952E7BE7D78b8F68c0F293fB6E6Ba#code) |
| QuoterV2 | `0x6C1d018B50019c6b51E1cc9F68027D31Ad10061F` | [Basescan verified](https://sepolia.basescan.org/address/0x6C1d018B50019c6b51E1cc9F68027D31Ad10061F#code) |
| MinimalFactoryRegistry | `0x429B6270E959794d256C9D78421f56D635fd00bC` | [Basescan verified](https://sepolia.basescan.org/address/0x429B6270E959794d256C9D78421f56D635fd00bC#code) |
| MinimalLegacyCLFactory | `0x51751793817DeBD736aA05948036B43463f1BFea` | [Basescan verified](https://sepolia.basescan.org/address/0x51751793817DeBD736aA05948036B43463f1BFea#code) |
| MinimalVoter | `0xEd7Db0248eD651E24Bc87E7e289dBD388bd6AaA7` | [Basescan verified](https://sepolia.basescan.org/address/0xEd7Db0248eD651E24Bc87E7e289dBD388bd6AaA7#code) |
| MinimalPositionDescriptor | `0xF1d9cEB0fc2d1c49795903d9feB9f790de9A550c` | [Basescan verified](https://sepolia.basescan.org/address/0xF1d9cEB0fc2d1c49795903d9feB9f790de9A550c#code) |
| avMEZOv–MUSD CL200 pool | `0xD084DB8cBbE7865d4dAcaF35e4a4A6a436D0EEe8` | [Basescan verified](https://sepolia.basescan.org/address/0xD084DB8cBbE7865d4dAcaF35e4a4A6a436D0EEe8#code) (EIP-1167 → `CLPool`) |
| avBTCv–MUSD CL200 pool | `0x95D890750550791E44a1d1f4986443d51696BdA5` | [Basescan verified](https://sepolia.basescan.org/address/0x95D890750550791E44a1d1f4986443d51696BdA5#code) (EIP-1167 → `CLPool`) |

### Wormhole NTT (testnet)

Proxies and implementations are verified on Mezo Blockscout / Basescan (and Sourcify). Linked library `TransceiverStructs` on Base Sepolia: [`0xDB8D732c9f7a8eeC4dFce192f2B902f3c04D73ed`](https://sepolia.basescan.org/address/0xDB8D732c9f7a8eeC4dFce192f2B902f3c04D73ed#code).

#### avBTCv

| Chain | Role | Address | Explorer |
| --- | --- | --- | --- |
| Mezo | NTT manager (locking) | `0x01B2C64505f367203429753029EA8BEB66987a09` | [Blockscout verified](https://explorer.test.mezo.org/address/0x01B2C64505f367203429753029EA8BEB66987a09#code) |
| Mezo | Wormhole transceiver | `0xA21328Abc178E1b47eC9A14f40e7100372678d10` | [Blockscout verified](https://explorer.test.mezo.org/address/0xA21328Abc178E1b47eC9A14f40e7100372678d10#code) |
| Mezo | Token (vault) | `0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f` | [Sourcify verified](https://repo.sourcify.dev/31611/0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f) |
| BaseSepolia | NTT manager (burning) | `0x96e12AD5F0402a458823A8E2A6Ea0E986DCD358e` | [Basescan verified](https://sepolia.basescan.org/address/0x96e12AD5F0402a458823A8E2A6Ea0E986DCD358e#code) |
| BaseSepolia | Wormhole transceiver | `0x82C8d99f67eB28b023387236051cB292c9A477AA` | [Basescan verified](https://sepolia.basescan.org/address/0x82C8d99f67eB28b023387236051cB292c9A477AA#code) |
| BaseSepolia | Token (peer) | `0x0d36e2B7350950662859A82A91E13Ad7d0E594E0` | [Basescan verified](https://sepolia.basescan.org/address/0x0d36e2B7350950662859A82A91E13Ad7d0E594E0#code) |

#### avMEZOv

| Chain | Role | Address | Explorer |
| --- | --- | --- | --- |
| Mezo | NTT manager (locking) | `0x2a0B2726f7822cEBdE9D665D049a42f13Fa6A517` | [Blockscout verified](https://explorer.test.mezo.org/address/0x2a0B2726f7822cEBdE9D665D049a42f13Fa6A517#code) |
| Mezo | Wormhole transceiver | `0x6201F4c88aAfDd627108467dafA81464E3eb885a` | [Blockscout verified](https://explorer.test.mezo.org/address/0x6201F4c88aAfDd627108467dafA81464E3eb885a#code) |
| Mezo | Token (vault) | `0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c` | [Sourcify verified](https://repo.sourcify.dev/31611/0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c) |
| BaseSepolia | NTT manager (burning) | `0x79D11c9d7F5d5ef676c4c87Cf9deEC5D972bd8A1` | [Basescan verified](https://sepolia.basescan.org/address/0x79D11c9d7F5d5ef676c4c87Cf9deEC5D972bd8A1#code) |
| BaseSepolia | Wormhole transceiver | `0x9383b1ACAf2bD2B0F6b205Be9fFbCcBfC78A8300` | [Basescan verified](https://sepolia.basescan.org/address/0x9383b1ACAf2bD2B0F6b205Be9fFbCcBfC78A8300#code) |
| BaseSepolia | Token (peer) | `0x172096f3F0F98B9dc1302695A48044D6A3D799C9` | [Basescan verified](https://sepolia.basescan.org/address/0x172096f3F0F98B9dc1302695A48044D6A3D799C9#code) |

VaultPeer minters are sealed to spoke NTT managers; peer ownership is renounced. Full NTT verify commands: [`wormhole/README.md`](./wormhole/README.md).

## Demo transactions

Live Base Sepolia walkthroughs (2026-11-15). Receipts also under `reports/wave2-e2e-*.json`. Wallet `0x6E1126EA838DA392A55D8DdeD9bADEccA5835114`.

| Flow | Explorer link | Notes |
| --- | --- | --- |
| Deposit into vault (Mezo) | Prior Id20→vault deposits for bridged inventory | Wave 2 ops; E2E often uses `E2E_SKIP_BRIDGE` with existing peer balance |
| Harvest / compound | _TBD_ | Out of scope for Wave 2 Aero demo path |
| Bridge Mezo → Base Sepolia (avMEZOv) | [Mezo tx `0xfbe5048c…075b4d`](https://wormholescan.io/#/tx/0xfbe5048c479ddba224b7f36af377d7b8cdaa9106a7293d4428e4539615075b4d?network=Testnet) | 10 avMEZOv landed on peer `0x1720…C9` |
| Bridge Mezo → Base Sepolia (avBTCv) | [Mezo tx `0xfd4c6ee6…a0e038`](https://wormholescan.io/#/tx/0xfd4c6ee6ba106bcd131d1c0f6e8ce0b6b52ed4fc02ab5696193f61c06ea0e038?network=Testnet) | 0.002 avBTCv landed on peer `0x0d36…E0` |
| Bridge Base Sepolia → Mezo (return) | _TBD_ | Optional; NTT + dApp Deposit support the path; linked tx not required for Aero LP demo |
| Seed CL200 LP (avMEZOv–MUSD) | [Base `0x69515bf4…83a6f1`](https://sepolia.basescan.org/tx/0x69515bf4e74ed62aa4b5b370f4641e2c7ef4f076f8f8952dcd42e33f7a83a6f1) | `pnpm seed:horizon-lp:broadcast` (0.001 / 0.001) |
| Seed CL200 LP (avBTCv–MUSD) | [Base `0xc395cff7…e99bf5`](https://sepolia.basescan.org/tx/0xc395cff77a6c361faf41411de5fa68e8ae21f4a0d61a04bb0ea82d9743e99bf5) | Same seed run |
| E2E swap + LP (avMEZOv) | Swap [`0xf91b8a9c…de4aaf`](https://sepolia.basescan.org/tx/0xf91b8a9ceddc0cbfc2280db52058252aae1f68f4ff08220f648c94d308de4aaf) · LP [`0x9d90b16f…cb4c88`](https://sepolia.basescan.org/tx/0x9d90b16fa655efa4a4b9f3ad2c1204af212926fd1d850ddab389d2376ccb4c88) | `E2E_SKIP_BRIDGE=YES` amount `0.01`; receipt `reports/wave2-e2e-1794723409190.json` |
| E2E swap + LP (avBTCv) | Swap [`0xd65aa006…c26a3`](https://sepolia.basescan.org/tx/0xd65aa006d90938519751bcaf4df911c6d8d388e65eba5d079e7e49408e2c26a3) · LP [`0x341299db…46bf34`](https://sepolia.basescan.org/tx/0x341299dba0b7f61df6c311011e360babdd6202030bcb2a15c5854b18e346bf34) | amount `0.0005`; receipt `reports/wave2-e2e-1794723440756.json` |

**Note:** Mezo testnet Portal MUSD NTT (transceiver `0x0E628…`) stopped producing guardian VAAs after sequence 88. Large (~7555) and tiny (1) Mezo→Base MUSD transfers remain unclaimable via Wormholescan; Base Sepolia MUSD inventory for this demo came from an alternate path once the deployer balance was non-zero. Vault-share NTT (avMEZOv / avBTCv) VAAs continue to work.

## Suggested judge walkthrough

1. Open https://testnet.aurove.xyz — connect a wallet on **Mezo Testnet** or **Base Sepolia**.
2. **Bridge:** withdraw/deposit Horizon vault shares Mezo ↔ Base (NTT). Prefer Max amounts (UI floors to Wormhole’s 8-decimal precision).
3. **Swap (Base):** `/swap` with avMEZOv / avBTCv / MUSD on Aero Slipstream routes.
4. Optional local verify (no private key):

```bash
git clone --recurse-submodules https://github.com/aurove/horizon.git
cd horizon && pnpm install
pnpm test
pnpm verify:cross-chain:testnet   # RPCs defaulted; BASESCAN_API_KEY optional
```

## Team

| Name | Role | Contact |
| --- | --- | --- |
| Capy Levi | Founder & Lead Developer, Aurove | [@levi_chimezie](https://x.com/levi_chimezie) |

Pitch deck team slide: [`docs/pitch/Aurove-Horizon-Wave2.pptx`](./docs/pitch/Aurove-Horizon-Wave2.pptx).

## Env vars for judges (no secrets)

Judges reviewing or running the stack locally do **not** need private keys. Use public RPCs and the checked-in deployment artifacts.

### Horizon workspace (this repo)

Copy [`.env.example`](./.env.example) → `.env`. For read-only / verify workflows, leave private keys empty.

| Variable | Required for judges? | Purpose |
| --- | --- | --- |
| `MEZO_TESTNET_RPC_URL` | Yes (defaults in example) | Mezo testnet RPC (`https://rpc.test.mezo.org`) |
| `BASE_SEPOLIA_RPC_URL` | Yes (defaults in example) | Base Sepolia RPC (`https://sepolia.base.org`) |
| `BASESCAN_API_KEY` | Optional | Basescan verification only |
| `ETH_PRIVATE_KEY` | **No** — do not share | Deploy / configure signer |
| `HORIZON_ROUNDTRIP_PRIVATE_KEY` | **No** — do not share | Live bridge round-trip signer |
| `HORIZON_AVBTCV_NTT_LIMIT` / `HORIZON_AVMEZOV_NTT_LIMIT` | Deploy only | NTT rate limits |
| `CONFIRM_HORIZON_*` | Deploy / destructive flows only | Explicit confirmations |

Useful judge commands (no signing):

```bash
pnpm install
pnpm test
pnpm verify:cross-chain:testnet   # needs RPC URLs; optional BASESCAN_API_KEY
```

Addresses above are also readable from:

- `contracts/deployments/testnet/`
- `contracts/deployments/baseSepolia/`
- `wormhole/vaults/avBTCv/testnet/deployment.json`
- `wormhole/vaults/avMEZOv/testnet/deployment.json`

### dApp (`aurove/dapp`, `testnet` branch)

Public client vars only (from that repo’s `.env.example`). Never commit service-role keys or webhook secrets.

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect cloud project (public id) |
| `NEXT_PUBLIC_MEZO_TESTNET_RPC_HTTP` | Default `https://rpc.test.mezo.org` |
| `NEXT_PUBLIC_APP_ENV` | `local` / testnet / production selector |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase client (if features need them) |

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CRON_INTERNAL_SECRET`, `EVENTS_WEBHOOK_SECRET`, `PYTH_HERMES_API_KEY`, private keys) are **not** required for UI walkthroughs against the live custom-domain deployments (`www.aurove.xyz` / `testnet.aurove.xyz`) or a local `pnpm --filter @aurove/dapp dev` run.

## Publish checklist

### Repos & license

- [x] Horizon repo public
- [x] dApp repo public
- [x] MIT `LICENSE` at horizon root
- [x] `"license": "MIT"` on root / contracts / wormhole `package.json`
- [x] Root README license section points at `LICENSE`

### Docs

- [x] Root [`README.md`](./README.md) reflects Wave 2 live status (not “intended only”)
- [x] [`contracts/README.md`](./contracts/README.md) — setup, tests, deploy, addresses, verification
- [x] [`wormhole/README.md`](./wormhole/README.md) + [`wormhole/docs/ntt-design.md`](./wormhole/docs/ntt-design.md)
- [x] Live URL guidance: prefer `testnet.aurove.xyz` / `www.aurove.xyz`; dApp source on **`testnet`** branch
- [x] Pitch deck at `docs/pitch/Aurove-Horizon-Wave2.pptx`

### Explorer verification (testnet)

- [x] Mezo NTT managers + Wormhole transceivers (Blockscout)
- [x] Base Sepolia NTT managers + Wormhole transceivers + `TransceiverStructs` (Basescan)
- [x] Aero Slipstream stack (PoolFactory, CLPool, NPM, SwapRouter, QuoterV2, stubs) + CL200 pools via EIP-1167 (Basescan)
- [x] Address tables in this file link to verified `#code` explorer pages

### Demos

- [x] Demo tx hashes / explorer links filled in (Mezo→Base bridge + seed + live E2E swap/LP 2026-11-15)
- [ ] Demo video linked
- [x] Team table: Capy Levi (Founder & Lead Developer) · [@levi_chimezie](https://x.com/levi_chimezie)
- [ ] Optional: Base Sepolia → Mezo return demo tx linked
- [ ] Optional: harvest / compound demo tx linked

### Out of scope for Wave 2 submission

- Mainnet Mezo / Base Horizon endpoints
- Portal MUSD NTT guardian recovery on Mezo testnet (use pinned Base Sepolia MUSD instead)
