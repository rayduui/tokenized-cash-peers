# RWA Pulse

Next.js dashboard for tokenized funds and real-world assets across markets.

## Data
- **Yields**: `data/yields.json` — served via `/api/yields`. Update the file and push (or have a scheduled job rewrite it) to refresh.
- **News**: `data/news.json` — served via `/api/news`.
- **On-chain**: Live from DefiLlama free `/protocols` endpoint.

## Scheduled refresh
Vercel Cron hits `/api/revalidate` daily at 01:00 UTC to revalidate the page and API routes.

## Deploy
Push to `main` → Vercel auto-deploys.

Live: https://rwa-pulse-live.vercel.app
