# Tokenized Cash Peers

Independent Pharos-style dashboard for the fixed global peer set of tokenized USD money-market / short-term government funds.

## Data refresh

- **Official 7-day yields**: loaded from `yields.json` on every page load and Refresh click. Update this file (via commit or scheduled job) to refresh yields. Structure is simple key-per-fund.
- **On-chain AUM / TVL / holders**: attempted from DefiLlama public RWA endpoints; falls back to last-known figures if the free endpoint shape differs or is unavailable. Pro API can be wired later.

## Deploy

Push to `main` → Vercel auto-deploys.

Not a publication of UBS. For information only.
