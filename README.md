# Miningcore Pool Website UI

Modern frontend for a MiningCore Mining Pool, built with Next.js 14 + TypeScript + Tailwind.
Automatically connects to the Miningcore API to display pools, blocks, miners, and payouts

NOTE: no need to change code when adding new pools.

---

## Features

- TODO (new changes made)

---

## Installation

### 1. Clone the repository

``
git clone https://github.com/miguel-m-barreto/hashstorm-ui.git
cd hashstorm-ui
``

2. Install dependencies

``
npm install
``

3. Create .env.local

TODO (new changes)


4. Start in development mode

``
npm run dev
``

5. Build for production

``
npm run build
npm start
``

---

# Miningcore Integration

The UI communicates with the following standard endpoints:

## Endpoint Description
### Lists all pools
/api/pools

### Pool details
/api/pools/{id}

### Pool performance history
/api/pools/{id}/performance

### List of miners in the pool
/api/pools/{id}/miners

### Miner statistics
/api/pools/{id}/miners/{address}

### Miner performance history
/api/pools/{id}/miners/{address}/performance

### Blocks mined
/api/pools/{id}/blocks

### Payments made
/api/pools/{id}/payments

### TODO ADD NEW ENDPOINTS CREATED

#### NOTE: When you add a new pool to Miningcore's config.json, it will automatically appear on the website.

---

## Real-time Features

Hashrate graphs (pool and miners) - /performance endpoint data

Lightweight auto-refresh - automatic revalidation every 15 seconds (Next.js fetch revalidate)

External links - coin explorer, Twitter, Discord, and Telegram

---

## Customization

Change colors and theme in tailwind.config.ts

Logo in public/logo.svg

Global name and description in app/layout.tsx

---

## Technical Notes

Framework: Next.js 14 (App Router)

Language: TypeScript

UI: TailwindCSS + shadcn/ui

Charts: Recharts

Cache: incremental revalidation (next: { revalidate: 15 })

NOTE: No need to change code when adding new pools in Miningcore

---

Future / Planned Extensions

Global leaderboards (top miners by coin)

Optional authentication for user dashboard (personal stats)

Proxy API with caching via Edge Functions (Cloudflare/Vercel)

Multilingual support

Notifications and alerts by email / Telegram

---

# Author

Miguel Matos Barreto
Website: hashstorm.org

Email: TO ADD

---

# License

This project is open-source under the MIT license.
You can use it freely to manage and display Miningcore pool data.
Please consider in crediting the original author (Miguel Matos Barreto)

---

# Donate

```
BTC: TO ADD
ETH: TO ADD
LTC: TO ADD
SOL: TO ADD
```