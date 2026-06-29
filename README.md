# LKH SkyNet

Digital Laporan Kas Harian for PT. SkyNet Lintas Nusantara.

## Overview

LKH SkyNet is an admin dashboard for monthly cash reporting. It handles daily ledger circulation, kasbon tracking, proof uploads, period locking, and dashboard summaries from one CoreUI-based interface.

## Features

- CoreUI React admin shell with collapsible sidebar, sticky header, and routed pages
- Dashboard summary for saldo tersedia, penerimaan, pengeluaran, kasbon aktif, daily trend, and category expense charts
- Sirkulasi Harian CRUD with pagination, search, date/category/type/proof filters, proof upload, and responsive table/card views
- Kasbon CRUD with pagination, search, date/status/proof filters, paid/unpaid status control, proof upload, and responsive table/card views
- Month/year period picker with create-period flow and opening balance input
- Monthly lock/unlock workflow
- CSV import/seed script for June 2026 data
- Dark and light theme support

## Stack

- React 19 + Vite
- TypeScript
- CoreUI React
- Tailwind CSS utilities for domain views
- Express
- Prisma
- PostgreSQL
- Vitest

## Routes

- `/dashboard`
- `/sirkulasi`
- `/kasbon`

## Local Development

```bash
npm install
npm run db:generate
npm run db:local
npm run dev
```

The development server runs from `server.ts` and serves the Vite frontend with the API.

## Environment

Create `.env` from `.env.example` and set:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
PORT=3000
HOST=0.0.0.0
```

## Useful Commands

```bash
npm run lint
npm run test
npm run build
npm run seed:lkh:june
npm run seed:lkh:periods
```

For database-backed tests:

```bash
npm run test:db
```

## Production Redeploy Notes

Production is deployed through Coolify. Build output includes compiled seed runners and the Jan-Jun 2026 CSV seed files under `dist/lkh-seed-data`.

Before reseeding production, create a PostgreSQL backup under `/home/hosting/backup/skynet-lkh/`.

Recommended production sequence after Coolify redeploy:

```bash
npm run db:migrate
npm run seed:auth:prod
npm run seed:lkh:periods:prod
```

`seed:lkh:periods:prod` applies the corrected Jan-Jun 2026 source-of-truth CSV profiles and replaces existing seeded ledger/kasbon rows for those months.

Expected Jan-Jun verification:

| Month | Penerimaan | Pengeluaran | Saldo Akhir | Kasbon | Saldo Tunai |
| --- | ---: | ---: | ---: | ---: | ---: |
| Jan | 35,092,622 | 30,161,005 | 4,931,617 | 4,897,500 | 34,117 |
| Feb | 35,907,617 | 32,166,912 | 3,740,705 | 3,057,000 | 683,705 |
| Mar | 30,936,820 | 25,810,320 | 5,126,500 | 4,756,500 | 370,000 |
| Apr | 31,986,499 | 24,020,269 | 7,966,230 | 6,395,600 | 1,570,630 |
| May | 35,418,130 | 30,234,169 | 5,183,961 | 3,585,500 | 1,598,461 |
| Jun | 28,962,661 | 24,536,120 | 4,426,541 | 4,312,500 | 114,041 |
