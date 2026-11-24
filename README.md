# Tokenized Cash Peers

Independent dashboard for a fixed global peer set of tokenized USD money-market / short-term government funds:

- UBS uMINT
- BlackRock BUIDL
- Franklin Templeton BENJI (FOBXX)
- Circle USYC
- WisdomTree WTGXX
- Superstate USTB

Style inspired by Pharos.watch (data-dense, calm, source-transparent).

## Data

- On-chain AUM / TVL / holders refreshed from DefiLlama public RWA API on page load and manual refresh.
- Official 7-day yields maintained from issuer factsheets (static in this prototype; can be moved to a scheduled update).
- Dual-source gaps are noted when present.

## Deploy

Linked to Vercel. Push to `main` triggers automatic deployment.

Not a publication of UBS. For information only.
