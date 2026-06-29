import type { CategoryKind, EntryType } from '../types';
import { requireLkhPeriodProfile, type LkhPeriodProfile } from './lkhProfiles';

export interface LkhImportRow {
  id: string;
  rowNumber: number;
  date: string;
  proofNo: string | null;
  description: string;
  rawDescription: string;
  categoryName: string;
  categoryKind: CategoryKind;
  type: EntryType;
  amount: number;
  balance: number;
  sectionIndex: number;
  dashboardIncluded: boolean;
}

export interface LkhImportResult {
  year: number;
  month: number;
  openingBalance: number;
  rows: LkhImportRow[];
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  reportedClosingBalance: number | null;
  reportedCashAdvanceTotal: number | null;
  reportedCashOnHand: number | null;
  stoppedAtLine: number | null;
  warnings: string[];
}

export interface LkhCashAdvanceSeed {
  id: string;
  rowNumber: number;
  date: string;
  person: string;
  description: string;
  amount: number;
  status: 'UNPAID';
}

type ParserTools = {
  parseCsv: (input: string) => string[][];
  parseAmount: (value: unknown) => number;
  parseIndonesianDate: (value: string, fallbackYear: number) => string | null;
};

export type LkhPeriodOptions = {
  year: number;
  month: number;
};

const PROTECTED_TERMS = ['BBM', 'ODP', 'ODC', 'ATK', 'COD', 'IDPEL', 'IKR', 'CS', 'RT', 'RW', 'PUPR', 'PGS', 'HTB'];

const CATEGORY_ALIASES: Record<string, string> = {
  atk: 'ATK',
  amplop: 'Amplop',
  'dana masuk': 'Dana Masuk',
  diskon: 'Diskon',
  fee: 'Fee',
  'fee sales': 'Fee Sales',
  gaji: 'Gaji',
  konsumsi: 'Konsumsi',
  'konsumsi kantor': 'Konsumsi Kantor',
  'lain-lain': 'Lain-Lain',
  'listrik kantor': 'Listrik Kantor',
  'listrik server': 'Listrik Server',
  material: 'Material',
  ongkir: 'Ongkir',
  'perawatan alat': 'Perawatan Alat',
  'perawatan aset kantor': 'Perawatan Aset Kantor',
  'perawatan kendaraan': 'Perawatan Kendaraan',
  'perawatan kendaraan ': 'Perawatan Kendaraan',
  'perjalanan bisnis': 'Perjalanan Bisnis',
  'perjalanan dinas': 'Perjalanan Bisnis',
  pulsa: 'Pulsa',
  'rumah tangga': 'Rumah Tangga',
  sangu: 'Sangu',
  sampah: 'Lain-Lain',
  'sampah ktr': 'Lain-Lain',
  jasa: 'Lain-Lain',
  tukang: 'Lain-Lain',
  'ikr lawang': 'IKR Lawang',
  'listrik polaman': 'Listrik Polaman',
  'listrik server sentul': 'Listrik Server Sentul',
  'listrik server lawang': 'Listrik Server Lawang',
  'cicilan motor': 'Cicilan Motor',
  etol: 'E-Toll',
  qurban: 'Qurban',
  transportasi: 'Transportasi'
};

const phraseReplacements: Array<[RegExp, string]> = [
  [/\bBi\b/gi, 'Biaya'],
  [/\bmaintace\b/gi, 'maintenance'],
  [/\bmaintance\b/gi, 'maintenance'],
  [/\bteam\b/gi, 'tim'],
  [/\bclipp\b/gi, 'clip'],
  [/\bsticker\b/gi, 'stiker'],
  [/\bvynil\b/gi, 'vinil'],
  [/\bsolasi\b/gi, 'isolasi'],
  [/\bspliter\b/gi, 'splitter'],
  [/\bjanset\b/gi, 'genset'],
  [/\betol\b/gi, 'e-toll'],
  [/\bongkir\b/gi, 'ongkos kirim'],
  [/\bkasbone\b/gi, 'kasbon'],
  [/\bcashbone\b/gi, 'kasbon']
];

const titleCase = (value: string) => value
  .toLowerCase()
  .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const periodKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

function resolveProfile(options: LkhPeriodOptions | LkhPeriodProfile): LkhPeriodProfile {
  if ('columns' in options) return options;
  return requireLkhPeriodProfile(options.year, options.month);
}

export function normalizeCategory(value: string, type: EntryType) {
  const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();
  if (type === 'INCOME' && (!normalized || normalized === 'dana masuk')) return 'Dana Masuk';
  return CATEGORY_ALIASES[normalized] || titleCase(normalized || 'Lain-Lain');
}

export function normalizeDescription(value: string) {
  let description = value.trim().replace(/\s+/g, ' ');
  for (const [pattern, replacement] of phraseReplacements) {
    description = description.replace(pattern, replacement);
  }
  description = description.replace(/\s+([,.)])/g, '$1').replace(/([(@])\s+/g, '$1');
  description = description.charAt(0).toUpperCase() + description.slice(1);
  for (const term of PROTECTED_TERMS) {
    description = description.replace(new RegExp(`\\b${term}\\b`, 'gi'), term);
  }
  return description;
}

export function parseLkhLedgerCsv(csv: string, tools: ParserTools, options: LkhPeriodOptions | LkhPeriodProfile): LkhImportResult {
  const profile = resolveProfile(options);
  const columns = profile.columns;
  const rows = tools.parseCsv(csv);
  const hasHeader = rows.some((row) => (row[columns.date] || '').trim().toLowerCase() === 'tanggal' && (row[columns.description] || '').trim().toLowerCase() === 'keterangan');
  if (!hasHeader) throw new Error('Header Tanggal tidak ditemukan.');

  let openingBalance = 0;
  let currentDate = '';
  let currentProof = '';
  let nextSectionStartDate = '';
  let stoppedAtLine: number | null = null;
  let inLedger = false;
  let currentSectionIndex = 0;
  const warnings: string[] = [];
  const ledgerRows: LkhImportRow[] = [];
  const reportedBalances = extractReportedBalances(rows, tools, profile);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const firstCell = (row[columns.date] || '').trim().toLowerCase();
    const rawDescription = (row[columns.description] || '').trim().replace(/\s+/g, ' ');
    const descriptionLabel = rawDescription.toLowerCase().replace(/\s+/g, ' ');
    const periodStartDate = parsePeriodStartDate(row[columns.date] || '', tools, profile.year);
    if (periodStartDate) nextSectionStartDate = periodStartDate;

    if (firstCell === 'tanggal' && (row[columns.description] || '').trim().toLowerCase() === 'keterangan') {
      inLedger = true;
      currentSectionIndex += 1;
      currentDate = nextSectionStartDate;
      currentProof = '';
      continue;
    }

    if (!inLedger) continue;

    if (
      profile.stopLabels.includes(descriptionLabel)
    ) {
      inLedger = false;
      stoppedAtLine = stoppedAtLine || line;
      continue;
    }

    if (row.some((cell) => String(cell || '').trim().toLowerCase() === 'grand total') && !rawDescription) {
      inLedger = false;
      stoppedAtLine = stoppedAtLine || line;
      continue;
    }

    const parsedDate = tools.parseIndonesianDate(row[columns.date] || '', profile.year);
    if (parsedDate) currentDate = parsedDate;
    if ((row[columns.proofNo] || '').trim()) currentProof = row[columns.proofNo].trim();

    const rawCategory = (row[columns.category] || '').trim();
    const income = tools.parseAmount(row[columns.income]);
    const expense = tools.parseAmount(row[columns.expense]);
    const balance = tools.parseAmount(row[columns.balance]);
    const hasBalanceCell = Boolean((row[columns.balance] || '').trim());
    const isAmountFooterRow = !rawDescription && !rawCategory && (income || expense || hasBalanceCell);

    if (isAmountFooterRow && ledgerRows.length > 0) {
      inLedger = false;
      stoppedAtLine = stoppedAtLine || line;
      continue;
    }

    if (rawDescription.toLowerCase() === 'saldo awal') {
      openingBalance = income || balance || profile.openingBalanceFallback || openingBalance;
      continue;
    }

    if (!rawDescription && !income && !expense) continue;
    if (!currentDate) {
      warnings.push(`Baris ${line}: tanggal tidak dapat ditentukan.`);
      continue;
    }
    if (!income && !expense) {
      warnings.push(`Baris ${line}: nominal kosong, dilewati.`);
      continue;
    }

    const type: EntryType = income ? 'INCOME' : 'EXPENSE';
    const amount = income || expense;
    const categoryName = normalizeCategory(rawCategory, type);
    const description = normalizeDescription(rawDescription);

    ledgerRows.push({
      id: `seed-lkh-${periodKey(profile.year, profile.month)}-${String(line).padStart(4, '0')}`,
      rowNumber: line,
      date: currentDate,
      proofNo: currentProof || null,
      description,
      rawDescription,
      categoryName,
      categoryKind: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      type,
      amount,
      balance,
      sectionIndex: currentSectionIndex,
      dashboardIncluded: true
    });
  }

  const dashboardSectionIndex = ledgerRows.reduce((max, row) => Math.max(max, row.sectionIndex), 0);
  for (const row of ledgerRows) {
    row.dashboardIncluded = row.sectionIndex === dashboardSectionIndex;
  }

  const dashboardRows = ledgerRows.filter((row) => row.dashboardIncluded);
  const totalIncome = dashboardRows.filter((row) => row.type === 'INCOME').reduce((sum, row) => sum + row.amount, 0);
  const totalExpense = dashboardRows.filter((row) => row.type === 'EXPENSE').reduce((sum, row) => sum + row.amount, 0);

  return {
    year: profile.year,
    month: profile.month,
    openingBalance,
    rows: ledgerRows,
    totalIncome,
    totalExpense,
    closingBalance: openingBalance + totalIncome - totalExpense,
    reportedClosingBalance: reportedBalances.reportedClosingBalance,
    reportedCashAdvanceTotal: reportedBalances.reportedCashAdvanceTotal,
    reportedCashOnHand: reportedBalances.reportedCashOnHand,
    stoppedAtLine,
    warnings
  };
}

function extractReportedBalances(rows: string[][], tools: ParserTools, profile: LkhPeriodProfile) {
  if (profile.reportedBalanceMode !== 'footer') {
    const sidePanelBalances = extractSidePanelReportedBalances(rows, tools);
    if (sidePanelBalances) return sidePanelBalances;
  }

  if (profile.reportedBalanceMode === 'side-panel') {
    return {
      reportedClosingBalance: null,
      reportedCashAdvanceTotal: null,
      reportedCashOnHand: null
    };
  }

  for (let i = rows.length - 3; i >= 0; i--) {
    const closing = spreadsheetFooterAmount(rows[i], tools);
    const cashAdvance = spreadsheetFooterAmount(rows[i + 1], tools);
    const cashOnHand = spreadsheetFooterAmount(rows[i + 2], tools);
    if (closing === null || cashAdvance === null || cashOnHand === null) continue;

    return {
      reportedClosingBalance: closing,
      reportedCashAdvanceTotal: cashAdvance,
      reportedCashOnHand: cashOnHand
    };
  }

  return {
    reportedClosingBalance: null,
    reportedCashAdvanceTotal: null,
    reportedCashOnHand: null
  };
}

function extractSidePanelReportedBalances(rows: string[][], tools: ParserTools) {
  for (let i = 0; i < rows.length - 2; i++) {
    const closing = tools.parseAmount(rows[i]?.[16]);
    const cashAdvance = tools.parseAmount(rows[i + 1]?.[16]);
    const cashOnHand = tools.parseAmount(rows[i + 2]?.[16]);
    if (!closing || !cashAdvance) continue;
    if (closing - cashAdvance !== cashOnHand) continue;

    return {
      reportedClosingBalance: closing,
      reportedCashAdvanceTotal: cashAdvance,
      reportedCashOnHand: cashOnHand
    };
  }

  return null;
}

function spreadsheetFooterAmount(row: string[] | undefined, tools: ParserTools) {
  if (!row) return null;
  if ((row[0] || '').trim() || (row[1] || '').trim()) return null;

  const label = footerLabel(row);
  if (label && !label.includes('saldo tunai')) return null;
  if ((row[3] || '').trim()) return null;

  const value = tools.parseAmount(row[5] || row[6] || row[4]);
  return value ? value : null;
}

function footerLabel(row: string[] | undefined) {
  return (row?.[2] || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseLkhCashAdvances(csv: string, tools: ParserTools, options: LkhPeriodOptions | LkhPeriodProfile): LkhCashAdvanceSeed[] {
  const profile = resolveProfile(options);
  const rows = tools.parseCsv(csv);
  const employeeSectionIndex = rows.findIndex((row) => (row[2] || '').trim().toLowerCase().replace(/\s+/g, ' ') === 'kasbone karyawan');
  const detailedSectionIndexes = rows.flatMap((row, index) => (row[2] || '').trim().toLowerCase().replace(/\s+/g, ' ') === 'rincian kas bon' ? [index] : []);
  const advances: LkhCashAdvanceSeed[] = [];

  if (profile.cashAdvanceModes.includes('side-panel')) {
    advances.push(...parseSidePanelCashAdvances(rows, tools, profile));
  }

  if (profile.cashAdvanceModes.includes('employee') && employeeSectionIndex >= 0) {
    advances.push(...parseEmployeeCashAdvances(rows, employeeSectionIndex, tools, profile));
  }

  const detailedSectionIndex = detailedSectionIndexes.at(-1) ?? -1;
  if (profile.cashAdvanceModes.includes('detailed')) {
    for (let i = 0; i < rows.length; i++) {
      if (i !== detailedSectionIndex) continue;
      const label = (rows[i][2] || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (label !== 'rincian kas bon') continue;

      let currentDate = '';
      for (let j = i + 1; j < rows.length; j++) {
        const row = rows[j];
        const line = j + 1;
        const rowLabel = (row[2] || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (rowLabel === 'rincian kas bon' || rowLabel === 'kasbone karyawan') break;
        if ((row[0] || '').trim().toLowerCase() === 'tanggal') continue;
        if ((row[0] || '').includes('Laporan Kas Harian')) break;
        if (row.some((cell) => String(cell || '').trim().toLowerCase() === 'grand total')) break;

        const date = tools.parseIndonesianDate(row[0] || '', profile.year);
        if (date) currentDate = date;
        const description = (row[2] || '').trim().replace(/\s+/g, ' ');
        const amount = tools.parseAmount(row[5] || row[4] || row[3]);
        if (!description && !amount && !date) continue;
        if (isCashAdvanceFooterLabel(description) || !amount || amount <= 0 || !description) continue;

        const person = inferCashAdvancePerson(description);
        advances.push({
          id: `seed-kasbon-${periodKey(profile.year, profile.month)}-${String(line).padStart(4, '0')}`,
          rowNumber: line,
          date: currentDate || `${profile.year}-${String(profile.month).padStart(2, '0')}-01`,
          person,
          description: normalizeDescription(description),
          amount,
          status: 'UNPAID'
        });
      }
    }
  }

  if (profile.cashAdvanceModes.includes('loose-fallback') && !detailedSectionIndexes.length && employeeSectionIndex < 0) {
    advances.push(...parseLooseCashAdvances(rows, tools, profile));
  }

  return advances;
}

function parseSidePanelCashAdvances(rows: string[][], tools: ParserTools, options: LkhPeriodOptions) {
  const advances: LkhCashAdvanceSeed[] = [];
  const headerIndex = rows.findIndex((row) => row.some((cell) => String(cell || '').trim().toLowerCase().replace(/\s+/g, ' ') === 'rincian kas bon'));
  if (headerIndex < 0) return advances;

  let currentDate = '';
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const date = tools.parseIndonesianDate(row[11] || '', options.year);
    if (date) currentDate = date;

    const description = (row[13] || '').trim().replace(/\s+/g, ' ');
    const amount = tools.parseAmount(row[16]);
    if (!description && !amount && !date) continue;
    if (!description && amount) continue;
    if (!description || !amount || amount <= 0) continue;

    advances.push({
      id: `seed-kasbon-${periodKey(options.year, options.month)}-side-${String(line).padStart(4, '0')}`,
      rowNumber: line,
      date: currentDate || `${options.year}-${String(options.month).padStart(2, '0')}-01`,
      person: inferCashAdvancePerson(description),
      description: normalizeDescription(description),
      amount,
      status: 'UNPAID'
    });
  }

  return advances;
}

function parseLooseCashAdvances(rows: string[][], tools: ParserTools, options: LkhPeriodOptions) {
  const advances: LkhCashAdvanceSeed[] = [];
  const startIndex = rows.findIndex((row) => (
    !(row[0] || '').trim() &&
    !(row[1] || '').trim() &&
    !(row[2] || '').trim() &&
    !(row[3] || '').trim() &&
    Boolean((row[4] || '').trim()) &&
    Boolean((row[5] || '').trim()) &&
    Boolean((row[6] || '').trim())
  ));
  if (startIndex < 0) return advances;

  let currentDate = '';
  for (let i = startIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const rowLabel = (row[2] || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (rowLabel === 'kategori' || rowLabel === 'grand total' || rowLabel === 'kasbone karyawan') break;
    if (spreadsheetFooterAmount(row, tools) !== null) break;

    const date = tools.parseIndonesianDate(row[0] || '', options.year);
    if (date) currentDate = date;
    const description = (row[2] || '').trim().replace(/\s+/g, ' ');
    const amount = tools.parseAmount(row[5] || row[4] || row[3]);
    if (!description && !amount && !date) continue;
    if (isCashAdvanceFooterLabel(description) || !description || !amount || amount <= 0) continue;

    advances.push({
      id: `seed-kasbon-${periodKey(options.year, options.month)}-${String(line).padStart(4, '0')}`,
      rowNumber: line,
      date: currentDate || `${options.year}-${String(options.month).padStart(2, '0')}-01`,
      person: inferCashAdvancePerson(description),
      description: normalizeDescription(description),
      amount,
      status: 'UNPAID'
    });
  }

  return advances;
}

function isCashAdvanceFooterLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').includes('saldo tunai');
}

function parseEmployeeCashAdvances(rows: string[][], sectionIndex: number, tools: ParserTools, options: LkhPeriodOptions) {
  const advances: LkhCashAdvanceSeed[] = [];
  let currentPerson = '';
  let currentDate = '';
  let groupStartLine = 0;
  let details: string[] = [];
  let total = 0;

  const flush = () => {
    if (!currentPerson || !details.length || !total) return;
    advances.push({
      id: `seed-kasbon-${periodKey(options.year, options.month)}-${slug(currentPerson)}`,
      rowNumber: groupStartLine,
      date: currentDate || `${options.year}-${String(options.month).padStart(2, '0')}-01`,
      person: titleCase(currentPerson),
      description: details.join('; '),
      amount: total,
      status: 'UNPAID'
    });
  };

  for (let i = sectionIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const date = tools.parseIndonesianDate(row[1] || row[0] || '', options.year);
    const description = (row[2] || '').trim().replace(/\s+/g, ' ');
    const amount = tools.parseAmount(row[3] || row[5]);
    const isPersonHeader = description && !date && !amount && row.every((cell, index) => index === 2 || !String(cell || '').trim());

    if (isPersonHeader) {
      flush();
      currentPerson = description;
      currentDate = '';
      groupStartLine = line;
      details = [];
      total = 0;
      continue;
    }

    if (!description && !amount && !date) continue;
    if (!currentPerson || !description || !amount) continue;
    if (date) currentDate = date;
    details.push(normalizeDescription(description));
    total += amount;
  }

  flush();
  return advances;
}

function inferCashAdvancePerson(description: string) {
  const cleaned = description
    .replace(/\b(kas\s*bon|kasbon|cash\s*bone|cashbone|kasbone|bensin|sangu)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const personWords = words.filter((word) => !/^\d/.test(word)).slice(0, 2);
  return titleCase(personWords.join(' ') || 'Karyawan');
}

function parsePeriodStartDate(value: string, tools: ParserTools, fallbackYear: number) {
  const match = value.trim().toLowerCase().match(/^periode\s+(\d{1,2})\s*[-–—]\s*\d{1,2}\s+([a-z]+)\s+(\d{4})/);
  if (!match) return '';
  return tools.parseIndonesianDate(`${match[1]}-${match[2]}-${match[3]}`, fallbackYear) || '';
}

export function parseJuneLedgerCsv(csv: string, tools: ParserTools): LkhImportResult {
  return parseLkhLedgerCsv(csv, tools, { year: 2026, month: 6 });
}

export function parseJuneCashAdvances(csv: string, tools: ParserTools): LkhCashAdvanceSeed[] {
  return parseLkhCashAdvances(csv, tools, { year: 2026, month: 6 });
}
