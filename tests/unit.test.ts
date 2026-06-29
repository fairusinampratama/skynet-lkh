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
import { normalizeDescription, parseJuneCashAdvances, parseJuneLedgerCsv, parseLkhCashAdvances, parseLkhLedgerCsv } from '../src/lib/lkhImport';
import { LKH_PERIOD_PROFILES, requireLkhPeriodProfile } from '../src/lib/lkhProfiles';
import { validateCreateUserForm, validateKasbonForm, validateLedgerForm, validateLoginForm, validateProofFile } from '../src/lib/validation';

describe('LKH parsing helpers', () => {
  it('validates the auth password policy', () => {
    expect(validatePasswordPolicy('short1')).toBe('Password minimal 8 karakter.');
    expect(validatePasswordPolicy('password')).toBe('Password harus mengandung huruf dan angka.');
    expect(validatePasswordPolicy('Password1')).toBeNull();
  });

  it('returns field errors for shared form validators', () => {
    expect(validateLoginForm({ username: 'Bad User', password: '' }).fieldErrors).toMatchObject({
      username: 'Username harus 3-40 karakter dan hanya boleh huruf, angka, titik, underscore, atau strip.',
      password: 'Password wajib diisi.'
    });
    expect(validateCreateUserForm({ username: 'reader', name: 'A', role: 'OWNER', password: 'password' }).fieldErrors).toMatchObject({
      name: 'Nama pengguna harus 2-80 karakter.',
      role: 'Role pengguna tidak valid.',
      password: 'Password harus mengandung huruf dan angka.'
    });
    expect(validateLedgerForm({ date: '', description: '', categoryId: '', type: 'OTHER', amount: '0' }).fieldErrors).toMatchObject({
      date: 'Tanggal transaksi wajib valid.',
      description: 'Keterangan wajib diisi.',
      categoryId: 'Kategori wajib dipilih.',
      type: 'Tipe transaksi tidak valid.',
      amount: 'Nominal harus lebih dari 0.'
    });
    expect(validateKasbonForm({ date: '2026-06-01', person: '', description: '', amount: '-1' }).fieldErrors).toMatchObject({
      person: 'Nama wajib diisi.',
      description: 'Keterangan wajib diisi.',
      amount: 'Nominal kasbon harus lebih dari 0.'
    });
    expect(validateProofFile({ type: 'application/pdf', size: 1 }).fieldErrors).toMatchObject({
      proof: 'Format bukti harus JPG, PNG, atau WebP.'
    });
  });

  it('parses Indonesian and spreadsheet money formats', () => {
    expect(parseAmount(10000)).toBe(10000);
    expect(parseAmount('10,000')).toBe(10000);
    expect(parseAmount('Rp 10.000')).toBe(10000);
    expect(parseAmount('  87,500.00 ')).toBe(87500);
    expect(parseAmount('(86,915.00)')).toBe(-86915);
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

  it('computes running balance even when imported rows provide spreadsheet balances', () => {
    const ledger = computeLedger(month, [
      { id: '1', date: '2026-06-01', createdAt: '2026-06-01T01:00:00.000Z', type: 'INCOME', amount: 500, spreadsheetBalance: 1750, category },
      { id: '2', date: '2026-06-02', createdAt: '2026-06-02T02:00:00.000Z', type: 'EXPENSE', amount: 250, category },
      { id: '3', date: '2026-06-03', createdAt: '2026-06-03T03:00:00.000Z', type: 'EXPENSE', amount: 100, spreadsheetBalance: 1200, category }
    ]);
    expect(ledger.map((entry) => entry.runningBalance)).toEqual([1500, 1250, 1150]);
    expect(ledger[0].spreadsheetBalance).toBe(1750);
  });

  it('summarizes totals, categories, daily values, and kasbon', () => {
    const reportedMonth = {
      ...month,
      reportedClosingBalance: 9999,
      reportedCashAdvanceTotal: 8888,
      reportedCashOnHand: 7777
    };
    const ledger = computeLedger(reportedMonth, entries);
    const summary = summarize(reportedMonth, ledger, [{ status: 'UNPAID', amount: 400 }, { status: 'PAID', amount: 900 }]);
    expect(summary.totalIncome).toBe(1500);
    expect(summary.totalExpense).toBe(350);
    expect(summary.computedIncome).toBe(500);
    expect(summary.computedClosingBalance).toBe(1150);
    expect(summary.closingBalance).toBe(9999);
    expect(summary.actualOutstandingKasbon).toBe(400);
    expect(summary.outstandingKasbon).toBe(8888);
    expect(summary.cashOnHand).toBe(7777);
    expect(summary.balanceSource).toBe('spreadsheet');
    expect(summary.cashAdvanceSource).toBe('spreadsheet');
    expect(summary.cashOnHandSource).toBe('spreadsheet');
    expect(summary.byCategory).toEqual([{ name: 'transportasi', amount: 350 }]);
    expect(summary.byDay).toEqual([
      { date: '2026-06-01', income: 500, expense: 0 },
      { date: '2026-06-02', income: 0, expense: 350 }
    ]);
  });

  it('summarizes dashboard totals from every ledger row shown in sirkulasi', () => {
    const ledger = computeLedger(month, [
      { id: 'archive', date: '2026-06-01', createdAt: '2026-06-01T00:00:00.000Z', type: 'INCOME', amount: 999, category, dashboardIncluded: false },
      { id: 'income', date: '2026-06-02', createdAt: '2026-06-02T00:00:00.000Z', type: 'INCOME', amount: 500, category, dashboardIncluded: true },
      { id: 'discount', date: '2026-06-02', createdAt: '2026-06-02T01:00:00.000Z', type: 'EXPENSE', amount: -50, category, dashboardIncluded: true },
      { id: 'expense', date: '2026-06-03', createdAt: '2026-06-03T00:00:00.000Z', type: 'EXPENSE', amount: 250, category, dashboardIncluded: true }
    ]);
    const summary = summarize(month, ledger, []);
    expect(summary.ledgerCount).toBe(4);
    expect(summary.dashboardLedgerCount).toBe(4);
    expect(summary.totalIncome).toBe(2499);
    expect(summary.totalExpense).toBe(200);
    expect(summary.closingBalance).toBe(2299);
    expect(summary.balanceSource).toBe('computed');
    expect(summary.byCategory).toEqual([{ name: 'transportasi', amount: 200 }]);
  });
});

describe('LKH June CSV seed parser', () => {
  it('parses all available 2026 period CSV templates with period-specific cutoffs', () => {
    for (const item of LKH_PERIOD_PROFILES) {
      const csv = fs.readFileSync(item.fileName, 'utf8');
      const parsed = parseLkhLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate }, item);
      expect(parsed.openingBalance).toBe(item.expected?.openingBalance);
      expect(parsed.rows.length).toBe(item.expected?.ledgerRows);
      expect(parsed.rows.filter((row) => row.dashboardIncluded).length).toBe(item.expected?.ledgerRows);
      expect(parsed.totalIncome).toBe(item.expected?.totalIncome);
      expect(parsed.totalExpense).toBe(item.expected?.totalExpense);
      expect(parsed.closingBalance).toBe(item.expected?.closingBalance);
      expect(parsed.reportedClosingBalance).toBe(item.expected?.reportedClosingBalance ?? item.expected?.closingBalance);
      expect(parsed.reportedCashAdvanceTotal).toBe(item.expected?.reportedCashAdvanceTotal);
      expect(parsed.reportedCashOnHand).toBe(item.expected?.reportedCashOnHand);
      expect(parsed.warnings).toEqual([]);
      expect(parsed.rows.some((row) => row.description.toLowerCase() === 'saldo awal')).toBe(false);
      expect(parsed.rows.some((row) => row.description.toLowerCase().includes('rincian kas bon'))).toBe(false);
    }
  });

  it('splits a spreadsheet row containing both income and expense', () => {
    const profile = requireLkhPeriodProfile(2026, 5);
    const csv = fs.readFileSync(profile.fileName, 'utf8');
    const parsed = parseLkhLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate }, profile);
    expect(parsed.rows.filter((row) => row.rowNumber === 225)).toMatchObject([
      { id: 'seed-lkh-2026-05-0225', type: 'INCOME', amount: 1700, balance: 0 },
      { id: 'seed-lkh-2026-05-0225-expense', type: 'EXPENSE', amount: -1700, balance: 3587380 }
    ]);
  });

  it('fails clearly when a conversion profile does not exist', () => {
    const csv = fs.readFileSync(requireLkhPeriodProfile(2026, 6).fileName, 'utf8');
    expect(() => parseLkhLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate }, { year: 2027, month: 1 }))
      .toThrow('Profil konversi LKH 2027-01 belum tersedia.');
  });

  it('parses the full June ledger section and stops before footer rows', () => {
    const csv = fs.readFileSync(requireLkhPeriodProfile(2026, 6).fileName, 'utf8');
    const parsed = parseJuneLedgerCsv(csv, { parseCsv, parseAmount, parseIndonesianDate });
    expect(parsed.openingBalance).toBe(1596761);
    expect(parsed.rows.length).toBe(345);
    expect(parsed.rows.filter((row) => row.dashboardIncluded).length).toBe(345);
    expect(parsed.totalIncome).toBe(27365900);
    expect(parsed.totalExpense).toBe(24536120);
    expect(parsed.closingBalance).toBe(4426541);
    expect(parsed.reportedClosingBalance).toBe(4426541);
    expect(parsed.reportedCashAdvanceTotal).toBe(4312500);
    expect(parsed.reportedCashOnHand).toBe(114041);
    expect(parsed.stoppedAtLine).toBe(353);
    expect(parsed.warnings).toEqual([]);
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

  it('parses the June kasbon employee section without footer reconciliation rows', () => {
    const csv = fs.readFileSync(requireLkhPeriodProfile(2026, 6).fileName, 'utf8');
    const advances = parseJuneCashAdvances(csv, { parseCsv, parseAmount, parseIndonesianDate });
    expect(advances).toEqual([
      {
        id: 'seed-kasbon-2026-06-du-dida',
        rowNumber: 661,
        date: '2026-06-15',
        person: 'Du Dida',
        description: 'Bensin evalia sby; E-toll; Minuman snack; Makan siang; Parkir; Listrik; Bensin evalia; Bensin; Bu didamasuk; Dana masuk; Beli minyak -minyak; Op.pak budi batu; E-toll; Bensin evalia',
        amount: 1213900,
        status: 'UNPAID'
      },
    ]);
    expect(advances.reduce((sum, advance) => sum + advance.amount, 0)).toBe(1213900);
  });

  it('parses monthly kasbon detail rows without adding footer reconciliation rows', () => {
    for (const item of LKH_PERIOD_PROFILES) {
      const csv = fs.readFileSync(item.fileName, 'utf8');
      const advances = parseLkhCashAdvances(csv, { parseCsv, parseAmount, parseIndonesianDate }, item);
      expect(advances).toHaveLength(item.expected?.cashAdvanceRows);
      expect(advances.reduce((sum, advance) => sum + advance.amount, 0)).toBe(item.expected?.cashAdvanceTotal);
      expect(advances.every((advance) => advance.amount > 0)).toBe(true);
      expect(advances.some((advance) => advance.person === 'Rekonsiliasi')).toBe(false);
    }
  });
});
