import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_CATEGORIES,
  MONTH_NAMES,
  parseAmount,
  parseCsv,
  parseIndonesianDate,
  slug
} from '../server';
import { parseLkhCashAdvances, parseLkhLedgerCsv, type LkhImportResult } from '../src/lib/lkhImport';

type Period = { year: number; month: number; fileName: string };

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const prisma = new PrismaClient();
const colors = ['#2563eb', '#0f766e', '#ca8a04', '#dc2626', '#f97316', '#eab308', '#0891b2', '#7c3aed', '#9333ea', '#059669', '#0284c7', '#64748b'];

const PERIOD_FILES: Period[] = [
  { year: 2026, month: 1, fileName: 'LKH SKYNET PERIODE 2026 - JANUARI (1).csv' },
  { year: 2026, month: 2, fileName: 'LKH SKYNET PERIODE 2026 - FEBRUARI (1).csv' },
  { year: 2026, month: 3, fileName: 'LKH SKYNET PERIODE 2026 - MARET (1).csv' },
  { year: 2026, month: 4, fileName: 'LKH SKYNET PERIODE 2026 - APRIL (1).csv' },
  { year: 2026, month: 5, fileName: 'LKH SKYNET PERIODE 2026 - MEI (1).csv' },
  { year: 2026, month: 6, fileName: 'LKH SKYNET PERIODE 2026 - JUNI.csv' }
];

function selectedPeriods() {
  const monthArg = args.find((arg) => arg.startsWith('--months='));
  if (!monthArg) return PERIOD_FILES;
  const wanted = new Set(monthArg.replace('--months=', '').split(',').map((item) => item.trim()).filter(Boolean));
  return PERIOD_FILES.filter((period) => wanted.has(`${period.year}-${String(period.month).padStart(2, '0')}`));
}

function readPeriod(period: Period) {
  const csvPath = path.resolve(process.cwd(), period.fileName);
  const csv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseLkhLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate }, period);
  const cashAdvances = parseLkhCashAdvances(csv, { parseCsv, parseAmount, parseIndonesianDate }, period);
  return { period, csvPath, parsed, cashAdvances };
}

function printSummary(data: ReturnType<typeof readPeriod>) {
  const { period, parsed, cashAdvances, csvPath } = data;
  console.log(`\nLKH ${period.year}-${String(period.month).padStart(2, '0')} ${apply ? 'apply' : 'dry-run'}`);
  console.log(JSON.stringify({
    csv: path.basename(csvPath),
    openingBalance: parsed.openingBalance,
    rows: parsed.rows.length,
    totalIncome: parsed.totalIncome,
    totalExpense: parsed.totalExpense,
    closingBalance: parsed.closingBalance,
    stoppedAtLine: parsed.stoppedAtLine,
    cashAdvances: cashAdvances.length,
    cashAdvanceTotal: cashAdvances.reduce((sum, item) => sum + item.amount, 0),
    categories: new Set(parsed.rows.map((row) => `${row.categoryKind}:${row.categoryName}`)).size,
    warnings: parsed.warnings
  }, null, 2));
}

async function applyPeriod(parsed: LkhImportResult, cashAdvances: ReturnType<typeof parseLkhCashAdvances>) {
  const monthId = `lkh-${parsed.year}-${String(parsed.month).padStart(2, '0')}`;
  await prisma.$transaction(async (tx) => {
    for (const category of DEFAULT_CATEGORIES) {
      await tx.category.upsert({
        where: { name_kind: { name: category.name, kind: category.kind } },
        create: category,
        update: {
          name: category.name,
          kind: category.kind,
          color: category.color
        }
      });
    }

    await tx.month.upsert({
      where: { year_month: { year: parsed.year, month: parsed.month } },
      create: {
        id: monthId,
        year: parsed.year,
        month: parsed.month,
        label: `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`,
        openingBalance: parsed.openingBalance,
        status: 'DRAFT'
      },
      update: { openingBalance: parsed.openingBalance }
    });

    const categoryByKey = new Map<string, { id: string }>();
    let colorIndex = 0;
    for (const row of parsed.rows) {
      const key = `${row.categoryKind}:${row.categoryName}`;
      if (categoryByKey.has(key)) continue;
      const categoryId = `cat-${row.categoryKind.toLowerCase()}-${slug(row.categoryName)}`;
      const category = await tx.category.upsert({
        where: { name_kind: { name: row.categoryName, kind: row.categoryKind } },
        create: {
          id: categoryId,
          name: row.categoryName,
          kind: row.categoryKind,
          color: colors[colorIndex++ % colors.length]
        },
        update: {
          name: row.categoryName,
          kind: row.categoryKind
        }
      });
      categoryByKey.set(key, category);
    }

    const seenIds = parsed.rows.map((row) => row.id);
    for (const row of parsed.rows) {
      const category = categoryByKey.get(`${row.categoryKind}:${row.categoryName}`);
      if (!category) throw new Error(`Kategori tidak ditemukan untuk ${row.categoryName}`);
      await tx.ledgerEntry.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          monthId,
          date: new Date(row.date),
          proofNo: row.proofNo,
          description: row.description,
          categoryId: category.id,
          type: row.type,
          amount: row.amount,
          source: 'spreadsheet-seed'
        },
        update: {
          date: new Date(row.date),
          proofNo: row.proofNo,
          description: row.description,
          categoryId: category.id,
          type: row.type,
          amount: row.amount,
          source: 'spreadsheet-seed'
        }
      });
    }

    await tx.ledgerEntry.deleteMany({
      where: {
        monthId,
        source: 'spreadsheet-seed',
        id: { notIn: seenIds }
      }
    });

    const seenCashAdvanceIds = cashAdvances.map((item) => item.id);
    for (const item of cashAdvances) {
      await tx.cashAdvance.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          monthId,
          date: new Date(item.date),
          person: item.person,
          description: item.description,
          amount: item.amount,
          status: item.status
        },
        update: {
          date: new Date(item.date),
          person: item.person,
          description: item.description,
          amount: item.amount,
          status: item.status
        }
      });
    }

    await tx.cashAdvance.deleteMany({
      where: {
        monthId,
        id: { startsWith: `seed-kasbon-${parsed.year}-${String(parsed.month).padStart(2, '0')}-`, notIn: seenCashAdvanceIds }
      }
    });
  });
}

async function main() {
  const periods = selectedPeriods();
  if (!periods.length) throw new Error('Tidak ada periode yang cocok dengan --months.');
  const imports = periods.map(readPeriod);
  imports.forEach(printSummary);
  if (!apply) return;
  for (const item of imports) {
    await applyPeriod(item.parsed, item.cashAdvances);
    console.log(`Applied ${item.parsed.rows.length} ledger rows and ${item.cashAdvances.length} kasbon rows for ${item.period.year}-${String(item.period.month).padStart(2, '0')}.`);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
