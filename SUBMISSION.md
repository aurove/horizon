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
| Pitch / deck | _TBD_ | Optional |

> **Judge note:** Prefer `https://www.aurove.xyz` or `https://testnet.aurove.xyz`. The `*.vercel.app` hostname is currently public after SSO was turned off; if it ever redirects to Vercel SSO again, run the public dApp locally from https://github.com/aurove/dapp.

## Public repos

| Repo | URL | Visibility (checked 2026-11-10) |
| --- | --- | --- |
| Horizon (contracts + Wormhole NTT) | https://github.com/aurove/horizon | **public** |
| dApp | https://github.com/aurove/dapp | **public** (`gh repo edit Aurove/dapp --visibility public` succeeded / already public) |

## Contract addresses (testnet)

Sources: `contracts/deployments/{testnet,baseSepolia}/` and `wormhole/vaults/*/testnet/deployment.json`.

### Mezo testnet — Horizon vaults

| Contract | Address |
| --- | --- |
| VaultFactory | `0x5f6AcDD6390f0C93e93482A917d8798376F56e17` |
| avBTC Vault (`avBTCv`) | `0xb4122E019693A7A7c470519093599D0c45f7CF12` |
| avMEZO Vault (`avMEZOv`) | `0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6` |

Underlying Id20 assets (from vault `linkedData`):

| Asset | Address |
| --- | --- |
| avBTC Id20 | `0xf2aeB53d71CD541EFeaA37788F0841D7d21612F9` |
| avMEZO Id20 | `0x0aeDdEaB271Bc032d6758c34Dc8356632D6F812e` |

### Base Sepolia — VaultPeer tokens

| Contract | Address |
| --- | --- |
| avBTCv peer | `0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132` |
| avMEZOv peer | `0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855` |

### Wormhole NTT (testnet)

#### avBTCv

| Chain | Role | Address |
| --- | --- | --- |
| Mezo | NTT manager (locking) | `0x7F47719ca9B033843e575fA49F847220337De151` |
| Mezo | Wormhole transceiver | `0xE17A087AbCf0a45072d110078E1937911d4829E7` |
| Mezo | Token (vault) | `0xb4122E019693A7A7c470519093599D0c45f7CF12` |
| BaseSepolia | NTT manager (burning) | `0x862f45A57f83393AC5a01c5860DF2A5e051501C4` |
| BaseSepolia | Wormhole transceiver | `0xf22EaAecdA0E2144154a964C2294549a3Ba999C4` |
| BaseSepolia | Token (peer) | `0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132` |

#### avMEZOv

| Chain | Role | Address |
| --- | --- | --- |
| Mezo | NTT manager (locking) | `0x0F909054b03dBfAd5212c2209051F37CD3e582c9` |
| Mezo | Wormhole transceiver | `0xF1E1Fa9dBa06D8Ce388d48492bf45616d7eF61fB` |
| Mezo | Token (vault) | `0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6` |
| BaseSepolia | NTT manager (burning) | `0xe97416e5Cac85493Eee13ecc165275Dcb8A5bDed` |
| BaseSepolia | Wormhole transceiver | `0xA64616831f8B430469E9101F35Ba778a485d3848` |
| BaseSepolia | Token (peer) | `0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855` |

Deployer / NTT owner (testnet): `0x6E1126EA838DA392A55D8DdeD9bADEccA5835114`

## Demo transactions

| Flow | Explorer link | Notes |
| --- | --- | --- |
| Deposit into vault (Mezo) | _TBD_ | |
| Harvest / compound | _TBD_ | |
| Bridge Mezo → Base Sepolia (NTT) | _TBD_ | Prefer `reports/` receipt from `pnpm bridge:roundtrip:testnet` |
| Bridge Base Sepolia → Mezo (return) | _TBD_ | |
| Aerodrome LP / swap (if applicable) | _TBD_ | Out of scope for this hygiene PR |

## Team

| Name | Role | Contact |
| --- | --- | --- |
| _TBD_ | _TBD_ | _TBD_ |

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
- [ ] Demo tx hashes / explorer links filled in
- [ ] Team table filled in
- [ ] Demo video linked
