# Horizon testnet address registry

Canonical addresses for Mezo testnet vaults, Base Sepolia peers, and Wormhole NTT managers. Values are read from checked-in deployment artifacts; regenerate the table with:

```bash
pnpm addresses:testnet
```

## Sources

| Artifact | Path |
| --- | --- |
| Mezo vaults / factory | `contracts/deployments/testnet/` |
| Base Sepolia peers | `contracts/deployments/baseSepolia/` |
| NTT (avBTCv) | `wormhole/vaults/avBTCv/testnet/deployment.json` |
| NTT (avMEZOv) | `wormhole/vaults/avMEZOv/testnet/deployment.json` |

## Explorers

| Chain | Chain ID | Browser | API (verification) |
| --- | --- | --- | --- |
| Mezo testnet | `31611` | https://explorer.test.mezo.org | https://api.explorer.test.mezo.org/api (Blockscout) |
| Base Sepolia | `84532` | https://sepolia.basescan.org | Basescan (`BASESCAN_API_KEY` / `ETHERSCAN_API_KEY`) |

Contract page template: `{browser}/address/{address}`.

## Mezo testnet — Horizon vaults

| Contract | Address | Explorer |
| --- | --- | --- |
| VaultFactory | `0x5f6AcDD6390f0C93e93482A917d8798376F56e17` | https://explorer.test.mezo.org/address/0x5f6AcDD6390f0C93e93482A917d8798376F56e17 |
| avBTC Vault (`avBTCv`) | `0xb4122E019693A7A7c470519093599D0c45f7CF12` | https://explorer.test.mezo.org/address/0xb4122E019693A7A7c470519093599D0c45f7CF12 |
| avMEZO Vault (`avMEZOv`) | `0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6` | https://explorer.test.mezo.org/address/0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6 |

Underlying Id20 assets (from vault `linkedData.asset`):

| Asset | Address | Explorer |
| --- | --- | --- |
| avBTC Id20 | `0xf2aeB53d71CD541EFeaA37788F0841D7d21612F9` | https://explorer.test.mezo.org/address/0xf2aeB53d71CD541EFeaA37788F0841D7d21612F9 |
| avMEZO Id20 | `0x0aeDdEaB271Bc032d6758c34Dc8356632D6F812e` | https://explorer.test.mezo.org/address/0x0aeDdEaB271Bc032d6758c34Dc8356632D6F812e |

## Base Sepolia — VaultPeer tokens

| Contract | Address | Explorer |
| --- | --- | --- |
| avBTCv peer | `0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132` | https://sepolia.basescan.org/address/0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132 |
| avMEZOv peer | `0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855` | https://sepolia.basescan.org/address/0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855 |

## Wormhole NTT (testnet)

Deployer / NTT owner: `0x6E1126EA838DA392A55D8DdeD9bADEccA5835114`

### avBTCv

| Chain | Role | Address | Explorer |
| --- | --- | --- | --- |
| Mezo | NTT manager (locking) | `0x7F47719ca9B033843e575fA49F847220337De151` | https://explorer.test.mezo.org/address/0x7F47719ca9B033843e575fA49F847220337De151 |
| Mezo | Wormhole transceiver | `0xE17A087AbCf0a45072d110078E1937911d4829E7` | https://explorer.test.mezo.org/address/0xE17A087AbCf0a45072d110078E1937911d4829E7 |
| Mezo | Token (vault) | `0xb4122E019693A7A7c470519093599D0c45f7CF12` | https://explorer.test.mezo.org/address/0xb4122E019693A7A7c470519093599D0c45f7CF12 |
| BaseSepolia | NTT manager (burning) | `0x862f45A57f83393AC5a01c5860DF2A5e051501C4` | https://sepolia.basescan.org/address/0x862f45A57f83393AC5a01c5860DF2A5e051501C4 |
| BaseSepolia | Wormhole transceiver | `0xf22EaAecdA0E2144154a964C2294549a3Ba999C4` | https://sepolia.basescan.org/address/0xf22EaAecdA0E2144154a964C2294549a3Ba999C4 |
| BaseSepolia | Token (peer) | `0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132` | https://sepolia.basescan.org/address/0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132 |

### avMEZOv

| Chain | Role | Address | Explorer |
| --- | --- | --- | --- |
| Mezo | NTT manager (locking) | `0x0F909054b03dBfAd5212c2209051F37CD3e582c9` | https://explorer.test.mezo.org/address/0x0F909054b03dBfAd5212c2209051F37CD3e582c9 |
| Mezo | Wormhole transceiver | `0xF1E1Fa9dBa06D8Ce388d48492bf45616d7eF61fB` | https://explorer.test.mezo.org/address/0xF1E1Fa9dBa06D8Ce388d48492bf45616d7eF61fB |
| Mezo | Token (vault) | `0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6` | https://explorer.test.mezo.org/address/0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6 |
| BaseSepolia | NTT manager (burning) | `0xe97416e5Cac85493Eee13ecc165275Dcb8A5bDed` | https://sepolia.basescan.org/address/0xe97416e5Cac85493Eee13ecc165275Dcb8A5bDed |
| BaseSepolia | Wormhole transceiver | `0xA64616831f8B430469E9101F35Ba778a485d3848` | https://sepolia.basescan.org/address/0xA64616831f8B430469E9101F35Ba778a485d3848 |
| BaseSepolia | Token (peer) | `0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855` | https://sepolia.basescan.org/address/0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855 |

## Contract verification runbook

Standalone verification against the checked-in deployment records:

```bash
# From horizon workspace root
cp -n .env.example .env   # if needed
# Optional but required for Base Sepolia / Basescan:
#   BASESCAN_API_KEY=...   (or ETHERSCAN_API_KEY)
pnpm install
pnpm verify:cross-chain:testnet
```

What that command runs (`scripts/verify-horizon.mjs testnet`):

1. `pnpm --filter @aurove/horizon-contracts run verify:testnet` — Mezo vaults / factory (Blockscout)
2. `pnpm --filter @aurove/horizon-contracts run verify:base-sepolia` — Base Sepolia VaultPeers (Basescan)
3. `pnpm --filter @aurove/horizon-wormhole run verify:testnet` — NTT manager + Wormhole transceiver proxies and implementations (Foundry `forge verify-contract`)

Per-package equivalents:

```bash
pnpm --filter @aurove/horizon-contracts run verify:testnet
pnpm --filter @aurove/horizon-contracts run verify:base-sepolia
pnpm --filter @aurove/horizon-wormhole run verify:testnet
```

### Env requirements

| Variable | Needed for |
| --- | --- |
| `MEZO_TESTNET_RPC_URL` | Mezo RPC (default `https://rpc.test.mezo.org`) |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC (default `https://sepolia.base.org`) |
| `BASESCAN_API_KEY` or `ETHERSCAN_API_KEY` | Base Sepolia Hardhat + NTT Foundry verification |
| NTT CLI checkout (`~/.ntt-cli/.checkout`) + `forge` / `cast` | NTT verifier only (`pnpm ntt:install` if missing) |

Mezo Blockscout verification does not need an API key. If Basescan keys are missing, the contracts Mezo step may still succeed while Base Sepolia / NTT steps fail — that is expected; re-run after setting the key.

### Where to confirm verification

After a successful run, open each address on the explorers above and confirm the **Contract** / **Code** tab shows verified source. Placeholders if verification has not been re-run in this environment:

| Surface | Verification URL placeholder |
| --- | --- |
| Mezo VaultFactory | https://explorer.test.mezo.org/address/0x5f6AcDD6390f0C93e93482A917d8798376F56e17#code |
| Mezo avBTCv | https://explorer.test.mezo.org/address/0xb4122E019693A7A7c470519093599D0c45f7CF12#code |
| Mezo avMEZOv | https://explorer.test.mezo.org/address/0xe65dA484Ec0820b4E9c8be731D38E27368b4aAC6#code |
| Base Sepolia avBTCv peer | https://sepolia.basescan.org/address/0xb25912d67A8fb9C7Acb8b2eB4c1600aF7872D132#code |
| Base Sepolia avMEZOv peer | https://sepolia.basescan.org/address/0x2E9eAa58834c39a8bDe92886Cbf8A18954bFF855#code |
| Mezo avBTCv NTT manager | https://explorer.test.mezo.org/address/0x7F47719ca9B033843e575fA49F847220337De151#code |
| BaseSepolia avBTCv NTT manager | https://sepolia.basescan.org/address/0x862f45A57f83393AC5a01c5860DF2A5e051501C4#code |
| Mezo avMEZOv NTT manager | https://explorer.test.mezo.org/address/0x0F909054b03dBfAd5212c2209051F37CD3e582c9#code |
| BaseSepolia avMEZOv NTT manager | https://sepolia.basescan.org/address/0xe97416e5Cac85493Eee13ecc165275Dcb8A5bDed#code |

Live verify success is not required to ship this documentation when API keys or the NTT Foundry checkout are unavailable; keep the commands above and re-run when credentials are present.

## Mainnet

Mainnet addresses live under `contracts/deployments/{mainnet,base}/` and `wormhole/vaults/*/mainnet/deployment.json`. Use `pnpm verify:cross-chain:mainnet` with `MEZO_MAINNET_RPC_URL` and `BASESCAN_API_KEY` when those artifacts are populated.
