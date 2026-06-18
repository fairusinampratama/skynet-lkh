import type { CategoryKind, EntryType } from '../types';

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
}

export interface LkhImportResult {
  year: number;
  month: number;
  openingBalance: number;
  rows: LkhImportRow[];
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
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

type PeriodProfile = {
  openingBalanceFallback?: number;
};

const PERIOD_PROFILES: Record<string, PeriodProfile> = {
  '2026-05': { openingBalanceFallback: 1570630 }
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

export function parseLkhLedgerCsv(csv: string, tools: ParserTools, options: LkhPeriodOptions): LkhImportResult {
  const rows = tools.parseCsv(csv);
  const hasHeader = rows.some((row) => (row[0] || '').trim().toLowerCase() === 'tanggal' && (row[2] || '').trim().toLowerCase() === 'keterangan');
  if (!hasHeader) throw new Error('Header Tanggal tidak ditemukan.');

  const profile = PERIOD_PROFILES[periodKey(options.year, options.month)] || {};
  let openingBalance = 0;
  let currentDate = '';
  let currentProof = '';
  let nextSectionStartDate = '';
  let stoppedAtLine: number | null = null;
  let inLedger = false;
  const warnings: string[] = [];
  const ledgerRows: LkhImportRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const firstCell = (row[0] || '').trim().toLowerCase();
    const rawDescription = (row[2] || '').trim().replace(/\s+/g, ' ');
    const descriptionLabel = rawDescription.toLowerCase().replace(/\s+/g, ' ');
    const periodStartDate = parsePeriodStartDate(row[0] || '', tools, options.year);
    if (periodStartDate) nextSectionStartDate = periodStartDate;

    if (firstCell === 'tanggal' && (row[2] || '').trim().toLowerCase() === 'keterangan') {
      inLedger = true;
      currentDate = nextSectionStartDate;
      currentProof = '';
      continue;
    }

    if (!inLedger) continue;

    if (
      descriptionLabel === 'rincian kas bon' ||
      descriptionLabel === 'kasbone karyawan' ||
      descriptionLabel === 'kategori' ||
      descriptionLabel === 'grand total'
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

    const parsedDate = tools.parseIndonesianDate(row[0] || '', options.year);
    if (parsedDate) currentDate = parsedDate;
    if ((row[1] || '').trim()) currentProof = row[1].trim();

    const rawCategory = (row[3] || '').trim();
    const income = tools.parseAmount(row[4]);
    const expense = tools.parseAmount(row[5]);
    const balance = tools.parseAmount(row[6]);
    const hasBalanceCell = Boolean((row[6] || '').trim());
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

    const type: EntryType = income || expense < 0 ? 'INCOME' : 'EXPENSE';
    const amount = income || Math.abs(expense);
    const categoryName = normalizeCategory(rawCategory, type);
    const description = normalizeDescription(rawDescription);

    ledgerRows.push({
      id: `seed-lkh-${periodKey(options.year, options.month)}-${String(line).padStart(4, '0')}`,
      rowNumber: line,
      date: currentDate,
      proofNo: currentProof || null,
      description,
      rawDescription,
      categoryName,
      categoryKind: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      type,
      amount,
      balance
    });
  }

  const totalIncome = ledgerRows.filter((row) => row.type === 'INCOME').reduce((sum, row) => sum + row.amount, 0);
  const totalExpense = ledgerRows.filter((row) => row.type === 'EXPENSE').reduce((sum, row) => sum + row.amount, 0);

  return {
    year: options.year,
    month: options.month,
    openingBalance,
    rows: ledgerRows,
    totalIncome,
    totalExpense,
    closingBalance: openingBalance + totalIncome - totalExpense,
    stoppedAtLine,
    warnings
  };
}

export function parseLkhCashAdvances(csv: string, tools: ParserTools, options: LkhPeriodOptions): LkhCashAdvanceSeed[] {
  const rows = tools.parseCsv(csv);
  const employeeSectionIndex = rows.findIndex((row) => (row[2] || '').trim().toLowerCase().replace(/\s+/g, ' ') === 'kasbone karyawan');
  const advances: LkhCashAdvanceSeed[] = [];

  if (employeeSectionIndex >= 0) {
    advances.push(...parseEmployeeCashAdvances(rows, employeeSectionIndex, tools, options));
  }

  for (let i = 0; i < rows.length; i++) {
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

      const date = tools.parseIndonesianDate(row[0] || '', options.year);
      if (date) currentDate = date;
      const description = (row[2] || '').trim().replace(/\s+/g, ' ');
      const lowerDescription = description.toLowerCase();
      const amount = tools.parseAmount(row[5] || row[4] || row[3]);
      if (!description && !amount && !date) continue;
      if (!amount || !/\b(kas\s*bon|kasbon|cash\s*bone|cashbone|kasbone)\b/i.test(lowerDescription)) continue;

      const person = inferCashAdvancePerson(description);
      advances.push({
        id: `seed-kasbon-${periodKey(options.year, options.month)}-${String(line).padStart(4, '0')}`,
        rowNumber: line,
        date: currentDate || `${options.year}-${String(options.month).padStart(2, '0')}-01`,
        person,
        description: normalizeDescription(description),
        amount,
        status: 'UNPAID'
      });
    }
  }

  return advances;
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
