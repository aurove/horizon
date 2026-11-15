# Horizon — Hackathon Submission

Skeleton for Mezo Buildathon / AKINDO judges. Fill remaining placeholders before final submission.

## Live URLs

| Surface | URL | Notes |
| --- | --- | --- |
| dApp (production) | https://www.aurove.xyz | Public (HTTP 200) — prefer this for judges |
| dApp (testnet) | https://testnet.aurove.xyz | Public (HTTP 200) |
| dApp (Vercel deployment hostname) | https://mezo-fractals-eldra-efc19f6f.vercel.app | Was behind Deployment Protection / SSO (`/sso-api`). SSO disabled 2026-11-10 via `vercel project protection disable mezo-fractals --sso` (`ssoProtection: null`); hostname now returns HTTP 200. Still prefer custom domains above. |
| Local dApp (fallback) | Clone https://github.com/aurove/dapp then `pnpm install && pnpm --filter @aurove/dapp dev` (or `pnpm dev` from that repo root) | Use for local wallet flows or if hosted URLs change |
| Demo video | _TBD_ | Link walkthrough once recorded |
| Pitch / deck | [`docs/pitch/Aurove-Horizon-Wave2.pptx`](./docs/pitch/Aurove-Horizon-Wave2.pptx) | Wave 2 pitch deck (regenerate via `node docs/pitch/generate-horizon-deck.js`) |

> **Judge note:** Prefer `https://www.aurove.xyz` or `https://testnet.aurove.xyz`. The `*.vercel.app` hostname is currently public after SSO was turned off; if it ever redirects to Vercel SSO again, run the public dApp locally from https://github.com/aurove/dapp.

## Public repos

| Repo | URL | Visibility (checked 2026-11-10) |
| --- | --- | --- |
| Horizon (contracts + Wormhole NTT) | https://github.com/aurove/horizon | **public** |
| dApp | https://github.com/aurove/dapp | **public** (`gh repo edit Aurove/dapp --visibility public` succeeded / already public) |

## Contract addresses (testnet)

Sources: `contracts/deployments/{testnet,baseSepolia}/` and `wormhole/vaults/*/testnet/deployment.json`.

### Mezo testnet — Horizon vaults

Redeployed 2026-11-10 (dual-ABI Vault + dead-share seed path). Dead shares seeded later from deployer Id20 (`1e12` assets → `0x…dEaD` on both vaults).

| Contract | Address | Explorer |
| --- | --- | --- |
| VaultFactory | `0x48E6cF84FFEd65AeB7Ee560123065606Df4D1f99` | [Blockscout verified](https://explorer.test.mezo.org/address/0x48E6cF84FFEd65AeB7Ee560123065606Df4D1f99#code) |
| avBTC Vault (`avBTCv`) | `0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f` | [Sourcify verified](https://repo.sourcify.dev/31611/0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f) · [explorer](https://explorer.test.mezo.org/address/0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f) |
| avMEZO Vault (`avMEZOv`) | `0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c` | [Sourcify verified](https://repo.sourcify.dev/31611/0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c) · [explorer](https://explorer.test.mezo.org/address/0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c) |

Factory-created vaults are verified on Sourcify. Mezo Blockscout still reports “not a smart-contract” for those CREATE addresses even though RPC bytecode and Sourcify matches are live.

Underlying Id20 assets (from vault `linkedData`):

| Asset | Address |
| --- | --- |
| avBTC Id20 | `0xf2aeB53d71CD541EFeaA37788F0841D7d21612F9` |
| avMEZO Id20 | `0x0aeDdEaB271Bc032d6758c34Dc8356632D6F812e` |

### Base Sepolia — VaultPeer tokens + MUSD + Aero

| Contract | Address | Explorer |
| --- | --- | --- |
| avBTCv peer | `0x0d36e2B7350950662859A82A91E13Ad7d0E594E0` | [verified](https://sepolia.basescan.org/address/0x0d36e2B7350950662859A82A91E13Ad7d0E594E0#code) |
| avMEZOv peer | `0x172096f3F0F98B9dc1302695A48044D6A3D799C9` | [verified](https://sepolia.basescan.org/address/0x172096f3F0F98B9dc1302695A48044D6A3D799C9#code) |
| MUSD (pinned) | `0x560985f804De8187E8FBA94F7127Bc4c0e54AEA5` | [token](https://sepolia.basescan.org/address/0x560985f804De8187E8FBA94F7127Bc4c0e54AEA5) |
| HorizonDestinationExecutor | `0xA874C686D513B079A02399B4dAFC36669C23Ad5b` | [verified](https://sepolia.basescan.org/address/0xA874C686D513B079A02399B4dAFC36669C23Ad5b#code) |
| Slipstream PoolFactory | `0x6e8614B6f32145D680209a4959153f36BD208b85` | [address](https://sepolia.basescan.org/address/0x6e8614B6f32145D680209a4959153f36BD208b85) |
| NonfungiblePositionManager | `0xB0D6450Ed37Da105B7ea3cd29D1256616DaA9B5F` | [address](https://sepolia.basescan.org/address/0xB0D6450Ed37Da105B7ea3cd29D1256616DaA9B5F) |
| SwapRouter | `0xE056f7fF35B952E7BE7D78b8F68c0F293fB6E6Ba` | [address](https://sepolia.basescan.org/address/0xE056f7fF35B952E7BE7D78b8F68c0F293fB6E6Ba) |
| avMEZOv–MUSD CL200 pool | `0xD084DB8cBbE7865d4dAcaF35e4a4A6a436D0EEe8` | [address](https://sepolia.basescan.org/address/0xD084DB8cBbE7865d4dAcaF35e4a4A6a436D0EEe8) |
| avBTCv–MUSD CL200 pool | `0x95D890750550791E44a1d1f4986443d51696BdA5` | [address](https://sepolia.basescan.org/address/0x95D890750550791E44a1d1f4986443d51696BdA5) |

### Wormhole NTT (testnet)

#### avBTCv

| Chain | Role | Address |
| --- | --- | --- |
| Mezo | NTT manager (locking) | `0x01B2C64505f367203429753029EA8BEB66987a09` |
| Mezo | Wormhole transceiver | `0xA21328Abc178E1b47eC9A14f40e7100372678d10` |
| Mezo | Token (vault) | `0x8e95C83A5144dcdD6ce79D7fBd58057b689f086f` |
| BaseSepolia | NTT manager (burning) | `0x96e12AD5F0402a458823A8E2A6Ea0E986DCD358e` |
| BaseSepolia | Wormhole transceiver | `0x82C8d99f67eB28b023387236051cB292c9A477AA` |
| BaseSepolia | Token (peer) | `0x0d36e2B7350950662859A82A91E13Ad7d0E594E0` |

#### avMEZOv

| Chain | Role | Address |
| --- | --- | --- |
| Mezo | NTT manager (locking) | `0x2a0B2726f7822cEBdE9D665D049a42f13Fa6A517` |
| Mezo | Wormhole transceiver | `0x6201F4c88aAfDd627108467dafA81464E3eb885a` |
| Mezo | Token (vault) | `0x2C45a18a23d5bfFf3Fc0c4Bff6376dA1d943373c` |
| BaseSepolia | NTT manager (burning) | `0x79D11c9d7F5d5ef676c4c87Cf9deEC5D972bd8A1` |
| BaseSepolia | Wormhole transceiver | `0x9383b1ACAf2bD2B0F6b205Be9fFbCcBfC78A8300` |
| BaseSepolia | Token (peer) | `0x172096f3F0F98B9dc1302695A48044D6A3D799C9` |

Deployer / NTT owner (testnet): `0x6E1126EA838DA392A55D8DdeD9bADEccA5835114`. VaultPeer minters sealed to spoke NTT managers; peer ownership renounced.

## Demo transactions

Live Base Sepolia walkthroughs (2026-11-15). Receipts also under `reports/wave2-e2e-*.json`. Wallet `0x6E1126EA838DA392A55D8DdeD9bADEccA5835114`.

| Flow | Explorer link | Notes |
| --- | --- | --- |
| Deposit into vault (Mezo) | Prior Id20→vault deposits for bridged inventory | Wave 2 ops; not re-run in this E2E (`E2E_SKIP_BRIDGE`) |
| Harvest / compound | _TBD_ | Out of scope for Wave 2 Aero path |
| Bridge Mezo → Base Sepolia (avMEZOv) | [Mezo tx `0xfbe5048c…075b4d`](https://wormholescan.io/#/tx/0xfbe5048c479ddba224b7f36af377d7b8cdaa9106a7293d4428e4539615075b4d?network=Testnet) | 10 avMEZOv landed on peer `0x1720…C9` |
| Bridge Mezo → Base Sepolia (avBTCv) | [Mezo tx `0xfd4c6ee6…a0e038`](https://wormholescan.io/#/tx/0xfd4c6ee6ba106bcd131d1c0f6e8ce0b6b52ed4fc02ab5696193f61c06ea0e038?network=Testnet) | 0.002 avBTCv landed on peer `0x0d36…E0` |
| Bridge Base Sepolia → Mezo (return) | _TBD_ | Optional; not required for Aero LP demo |
| Seed CL200 LP (avMEZOv–MUSD) | [Base `0x69515bf4…83a6f1`](https://sepolia.basescan.org/tx/0x69515bf4e74ed62aa4b5b370f4641e2c7ef4f076f8f8952dcd42e33f7a83a6f1) | `pnpm seed:horizon-lp:broadcast` (0.001 / 0.001) |
| Seed CL200 LP (avBTCv–MUSD) | [Base `0xc395cff7…e99bf5`](https://sepolia.basescan.org/tx/0xc395cff77a6c361faf41411de5fa68e8ae21f4a0d61a04bb0ea82d9743e99bf5) | Same seed run |
| E2E swap + LP (avMEZOv) | Swap [`0xf91b8a9c…de4aaf`](https://sepolia.basescan.org/tx/0xf91b8a9ceddc0cbfc2280db52058252aae1f68f4ff08220f648c94d308de4aaf) · LP [`0x9d90b16f…cb4c88`](https://sepolia.basescan.org/tx/0x9d90b16fa655efa4a4b9f3ad2c1204af212926fd1d850ddab389d2376ccb4c88) | `E2E_SKIP_BRIDGE=YES` amount `0.01`; receipt `reports/wave2-e2e-1794723409190.json` |
| E2E swap + LP (avBTCv) | Swap [`0xd65aa006…c26a3`](https://sepolia.basescan.org/tx/0xd65aa006d90938519751bcaf4df911c6d8d388e65eba5d079e7e49408e2c26a3) · LP [`0x341299db…46bf34`](https://sepolia.basescan.org/tx/0x341299dba0b7f61df6c311011e360babdd6202030bcb2a15c5854b18e346bf34) | amount `0.0005`; receipt `reports/wave2-e2e-1794723440756.json` |

**Note:** Mezo testnet Portal MUSD NTT (transceiver `0x0E628…`) stopped producing guardian VAAs after sequence 88. Large (~7555) and tiny (1) Mezo→Base MUSD transfers remain unclaimable via Wormholescan; Base Sepolia MUSD inventory for this demo came from an alternate path once the deployer balance was non-zero. Vault-share NTT (avMEZOv / avBTCv) VAAs continue to work.

## Team

Real names/roles/contacts unknown at submission time — do not invent biographies. Use placeholders below until contributors confirm.

| Name | Role | Contact |
| --- | --- | --- |
| Aurove core contributors | Protocol / product | _TBD_ |
| _TBD_ | Engineering | _TBD_ |
| _TBD_ | Design / GTM | _TBD_ |

Pitch deck team slide mirrors these placeholders: [`docs/pitch/Aurove-Horizon-Wave2.pptx`](./docs/pitch/Aurove-Horizon-Wave2.pptx).

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

### dApp (`aurove/dapp`)

Public client vars only (from that repo’s `.env.example`). Never commit service-role keys or webhook secrets.

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect cloud project (public id) |
| `NEXT_PUBLIC_MEZO_TESTNET_RPC_HTTP` | Default `https://rpc.test.mezo.org` |
| `NEXT_PUBLIC_APP_ENV` | `local` / testnet / production selector |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase client (if features need them) |

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `CRON_INTERNAL_SECRET`, `EVENTS_WEBHOOK_SECRET`, `PYTH_HERMES_API_KEY`, private keys) are **not** required for UI walkthroughs against the live custom-domain deployments (`www.aurove.xyz` / `testnet.aurove.xyz`) or a local `pnpm --filter @aurove/dapp dev` run.

## Publish checklist

- [x] Attempt `gh repo edit Aurove/dapp --visibility public` (and/or API PATCH) — **succeeded**; repo is public
- [x] Horizon repo public
- [x] MIT `LICENSE` at horizon root
- [x] README license section updated
- [x] `"license": "MIT"` on root / contracts / wormhole `package.json`
- [x] Live URL guidance: prefer public custom domains; document former SSO on `*.vercel.app` + disable attempt; document local dApp run path
- [x] Demo tx hashes / explorer links filled in (seed + live E2E swap/LP 2026-11-15)
- [ ] Team table: replace placeholders with confirmed names / roles / contacts
- [ ] Demo video linked
- [x] Pitch deck at `docs/pitch/Aurove-Horizon-Wave2.pptx`
