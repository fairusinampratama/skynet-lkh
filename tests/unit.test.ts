import { describe, expect, it } from 'vitest';
import fs from 'fs';
import {
  computeLedger,
  parseAmount,
  parseCsv,
  parseIndonesianDate,
  slug,
  summarize,
  validatePasswordPolicy
} from '../server';
import { normalizeDescription, parseJuneCashAdvances, parseJuneLedgerCsv, parseLkhLedgerCsv } from '../src/lib/lkhImport';

describe('LKH parsing helpers', () => {
  it('validates the auth password policy', () => {
    expect(validatePasswordPolicy('short1')).toBe('Password minimal 8 karakter.');
    expect(validatePasswordPolicy('password')).toBe('Password harus mengandung huruf dan angka.');
    expect(validatePasswordPolicy('Password1')).toBeNull();
  });

  it('parses Indonesian and spreadsheet money formats', () => {
    expect(parseAmount(10000)).toBe(10000);
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('Rp 10.000')).toBe(10000);
    expect(parseAmount('  87,500.00 ')).toBe(87500);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('abc')).toBe(0);
  });

  it('parses Indonesian date labels used by the LKH sheet', () => {
    expect(parseIndonesianDate('02-juni', 2026)).toBe('2026-06-02');
    expect(parseIndonesianDate('03-JUNI', 2026)).toBe('2026-06-03');
    expect(parseIndonesianDate('6-Jun-26', 2026)).toBe('2026-06-06');
    expect(parseIndonesianDate('05/06', 2026)).toBe('2026-06-05');
    expect(parseIndonesianDate('1/20', 2026)).toBe('2026-01-20');
  });

  it('preserves quoted commas in CSV fields', () => {
    const rows = parseCsv('Tanggal,Keterangan\n02-juni,"bedali,randuagung"\n');
    expect(rows[1][1]).toBe('bedali,randuagung');
  });
});

describe('LKH calculations', () => {
  const month = { openingBalance: 1000 };
  const category = { name: 'transportasi' };
  const entries = [
    { id: '2', date: '2026-06-02', createdAt: '2026-06-02T02:00:00.000Z', type: 'EXPENSE', amount: 250, category },
    { id: '1', date: '2026-06-01', createdAt: '2026-06-01T01:00:00.000Z', type: 'INCOME', amount: 500, category },
    { id: '3', date: '2026-06-02', createdAt: '2026-06-02T03:00:00.000Z', type: 'EXPENSE', amount: 100, category }
  ];

  it('computes running balance in date/creation order', () => {
    const ledger = computeLedger(month, entries);
    expect(ledger.map((entry) => entry.runningBalance)).toEqual([1500, 1250, 1150]);
  });

  it('summarizes totals, categories, daily values, and kasbon', () => {
    const ledger = computeLedger(month, entries);
    const summary = summarize(month, ledger, [{ status: 'UNPAID', amount: 400 }, { status: 'PAID', amount: 900 }]);
    expect(summary.totalIncome).toBe(500);
    expect(summary.totalExpense).toBe(350);
    expect(summary.closingBalance).toBe(1150);
    expect(summary.outstandingKasbon).toBe(400);
    expect(summary.byCategory).toEqual([{ name: 'transportasi', amount: 350 }]);
    expect(summary.byDay).toEqual([
      { date: '2026-06-01', income: 500, expense: 0 },
      { date: '2026-06-02', income: 0, expense: 350 }
    ]);
  });
});

describe('LKH June CSV seed parser', () => {
  it('parses all available 2026 period CSV templates with period-specific cutoffs', () => {
    const cases = [
      { month: 1, file: 'LKH SKYNET PERIODE 2026 - JANUARI (1).csv', openingBalance: 0, rows: 408, totalIncome: 32976972, totalExpense: 30161005, closingBalance: 2815967, warnings: [] },
      { month: 2, file: 'LKH SKYNET PERIODE 2026 - FEBRUARI (1).csv', openingBalance: 34117, rows: 375, totalIncome: 35873500, totalExpense: 32166912, closingBalance: 3740705, warnings: [] },
      { month: 3, file: 'LKH SKYNET PERIODE 2026 - MARET (1).csv', openingBalance: 683705, rows: 292, totalIncome: 29796200, totalExpense: 25810320, closingBalance: 4669585, warnings: [] },
      { month: 4, file: 'LKH SKYNET PERIODE 2026 - APRIL (1).csv', openingBalance: 370000, rows: 393, totalIncome: 31620099, totalExpense: 24023869, closingBalance: 7966230, warnings: [] },
      { month: 5, file: 'LKH SKYNET PERIODE 2026 - MEI (1).csv', openingBalance: 1570630, rows: 430, totalIncome: 35418130, totalExpense: 30235869, closingBalance: 6752891, warnings: [] }
    ];

    for (const item of cases) {
      const csv = fs.readFileSync(item.file, 'utf8');
      const parsed = parseLkhLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate }, { year: 2026, month: item.month });
      expect(parsed.openingBalance).toBe(item.openingBalance);
      expect(parsed.rows.length).toBe(item.rows);
      expect(parsed.totalIncome).toBe(item.totalIncome);
      expect(parsed.totalExpense).toBe(item.totalExpense);
      expect(parsed.closingBalance).toBe(item.closingBalance);
      expect(parsed.warnings).toEqual(item.warnings);
      expect(parsed.rows.some((row) => row.description.toLowerCase() === 'saldo awal')).toBe(false);
      expect(parsed.rows.some((row) => row.description.toLowerCase().includes('rincian kas bon'))).toBe(false);
    }
  });

  it('parses the full June ledger section and stops before footer rows', () => {
    const csv = fs.readFileSync('LKH SKYNET PERIODE 2026 - JUNI.csv', 'utf8');
    const parsed = parseJuneLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate });
    expect(parsed.openingBalance).toBe(1596761);
    expect(parsed.rows.length).toBe(183);
    expect(parsed.totalIncome).toBe(12816700);
    expect(parsed.totalExpense).toBe(12266996);
    expect(parsed.closingBalance).toBe(2146465);
    expect(parsed.stoppedAtLine).toBe(192);
    expect(parsed.warnings).toEqual(['Baris 186: nominal kosong, dilewati.']);
    expect(parsed.rows[0]).toMatchObject({
      id: 'seed-lkh-2026-06-0008',
      date: '2026-06-02',
      proofNo: '1',
      categoryName: 'Transportasi',
      type: 'EXPENSE',
      amount: 15000
    });
  });

  it('normalizes conservative Indonesian wording', () => {
    expect(normalizeDescription('Bi BBM N 2110 maintace arjosari')).toBe('Biaya BBM N 2110 maintenance arjosari');
    expect(slug('Dana Masuk')).toBe('dana-masuk');
  });

  it('parses the June kasbon employee section', () => {
    const csv = fs.readFileSync('LKH SKYNET PERIODE 2026 - JUNI.csv', 'utf8');
    const advances = parseJuneCashAdvances(csv, { parseCsv, parseAmount, parseIndonesianDate });
    expect(advances).toEqual([
      {
        id: 'seed-kasbon-2026-06-du-dida',
        rowNumber: 595,
        date: '2026-06-15',
        person: 'Du Dida',
        description: 'Bensin evalia sby; E-toll; Minuman snack; Makan siang; Parkir; Listrik',
        amount: 589900,
        status: 'UNPAID'
      }
    ]);
  });
});
