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
```

For database-backed tests:

```bash
npm run test:db
```
