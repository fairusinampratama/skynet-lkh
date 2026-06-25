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
import { parseJuneCashAdvances, parseJuneLedgerCsv } from '../src/lib/lkhImport';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const csvPath = path.resolve(process.cwd(), 'LKH SKYNET PERIODE 2026 - JUNI.csv');
const prisma = new PrismaClient();
const colors = ['#2563eb', '#0f766e', '#ca8a04', '#dc2626', '#f97316', '#eab308', '#0891b2', '#7c3aed', '#9333ea', '#059669', '#0284c7', '#64748b'];

async function main() {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseJuneLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate });
  const cashAdvances = parseJuneCashAdvances(csv, { parseCsv, parseAmount, parseIndonesianDate });
  const monthId = 'lkh-2026-06';
  const categories = [...new Set(parsed.rows.map((row) => `${row.categoryKind}:${row.categoryName}`))];

  console.log('LKH June 2026 seed');
  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    csv: path.basename(csvPath),
    openingBalance: parsed.openingBalance,
    rows: parsed.rows.length,
    totalIncome: parsed.totalIncome,
    totalExpense: parsed.totalExpense,
    closingBalance: parsed.closingBalance,
    reportedClosingBalance: parsed.reportedClosingBalance,
    reportedCashAdvanceTotal: parsed.reportedCashAdvanceTotal,
    reportedCashOnHand: parsed.reportedCashOnHand,
    stoppedAtLine: parsed.stoppedAtLine,
    cashAdvances: cashAdvances.length,
    cashAdvanceTotal: cashAdvances.reduce((sum, item) => sum + item.amount, 0),
    categories: categories.length,
    warnings: parsed.warnings
  }, null, 2));

  console.log('\nNormalization samples:');
  for (const row of parsed.rows.filter((item) => item.rawDescription !== item.description).slice(0, 12)) {
    console.log(`- line ${row.rowNumber}: ${row.rawDescription} -> ${row.description}`);
  }

  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    await Promise.all(DEFAULT_CATEGORIES.map((category) => tx.category.upsert({
      where: { id: category.id },
      create: category,
      update: category
    })));

    await tx.month.upsert({
      where: { year_month: { year: 2026, month: 6 } },
      create: {
        id: monthId,
        year: 2026,
        month: 6,
        label: `${MONTH_NAMES[5]} 2026`,
        openingBalance: parsed.openingBalance,
        reportedClosingBalance: parsed.reportedClosingBalance,
        reportedCashAdvanceTotal: parsed.reportedCashAdvanceTotal,
        reportedCashOnHand: parsed.reportedCashOnHand,
        status: 'DRAFT'
      },
      update: {
        openingBalance: parsed.openingBalance,
        reportedClosingBalance: parsed.reportedClosingBalance,
        reportedCashAdvanceTotal: parsed.reportedCashAdvanceTotal,
        reportedCashOnHand: parsed.reportedCashOnHand
      }
    });

    const categoryByKey = new Map<string, { id: string }>();
    let colorIndex = 0;
    for (const row of parsed.rows) {
      const key = `${row.categoryKind}:${row.categoryName}`;
      if (categoryByKey.has(key)) continue;
      const categoryId = `cat-${row.categoryKind.toLowerCase()}-${slug(row.categoryName)}`;
      const category = await tx.category.upsert({
        where: { id: categoryId },
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
          spreadsheetBalance: row.balance || null,
          dashboardIncluded: row.dashboardIncluded,
          spreadsheetSection: row.sectionIndex,
          source: 'spreadsheet-seed'
        },
        update: {
          date: new Date(row.date),
          proofNo: row.proofNo,
          description: row.description,
          categoryId: category.id,
          type: row.type,
          amount: row.amount,
          spreadsheetBalance: row.balance || null,
          dashboardIncluded: row.dashboardIncluded,
          spreadsheetSection: row.sectionIndex,
          source: 'spreadsheet-seed'
        }
      });
    }

    await tx.ledgerEntry.deleteMany({
      where: {
        monthId,
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
        id: { notIn: seenCashAdvanceIds }
      }
    });
  }, { timeout: 30000 });

  console.log(`\nApplied ${parsed.rows.length} June ledger rows and ${cashAdvances.length} kasbon rows.`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
