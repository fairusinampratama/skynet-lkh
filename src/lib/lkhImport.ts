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
  'perjalanan bisnis': 'Perjalanan Bisnis',
  'rumah tangga': 'Rumah Tangga',
  sangu: 'Sangu',
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

export function parseJuneLedgerCsv(csv: string, tools: ParserTools): LkhImportResult {
  const rows = tools.parseCsv(csv);
  const headerIndex = rows.findIndex((row) => (row[0] || '').trim().toLowerCase() === 'tanggal');
  if (headerIndex < 0) throw new Error('Header Tanggal tidak ditemukan.');

  let openingBalance = 0;
  let currentDate = '';
  let currentProof = '';
  let stoppedAtLine: number | null = null;
  const warnings: string[] = [];
  const ledgerRows: LkhImportRow[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const parsedDate = tools.parseIndonesianDate(row[0] || '', 2026);
    if (parsedDate) currentDate = parsedDate;
    if ((row[1] || '').trim()) currentProof = row[1].trim();

    const rawDescription = (row[2] || '').trim().replace(/\s+/g, ' ');
    const rawCategory = (row[3] || '').trim();
    const income = tools.parseAmount(row[4]);
    const expense = tools.parseAmount(row[5]);
    const balance = tools.parseAmount(row[6]);
    const hasBalanceCell = Boolean((row[6] || '').trim());
    const isZeroFooterRow = !parsedDate && !rawDescription && !rawCategory && !income && !expense && hasBalanceCell;

    if (isZeroFooterRow && ledgerRows.length > 0) {
      stoppedAtLine = line;
      break;
    }

    if (rawDescription.toLowerCase() === 'saldo awal') {
      openingBalance = income || balance;
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
      id: `seed-lkh-2026-06-${String(line).padStart(4, '0')}`,
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
    openingBalance,
    rows: ledgerRows,
    totalIncome,
    totalExpense,
    closingBalance: openingBalance + totalIncome - totalExpense,
    stoppedAtLine,
    warnings
  };
}

export function parseJuneCashAdvances(csv: string, tools: ParserTools): LkhCashAdvanceSeed[] {
  const rows = tools.parseCsv(csv);
  const sectionIndex = rows.findIndex((row) => (row[2] || '').trim().toLowerCase().replace(/\s+/g, ' ') === 'kasbone karyawan');
  if (sectionIndex < 0) return [];

  const advances: LkhCashAdvanceSeed[] = [];
  let currentPerson = '';
  let currentDate = '';
  let groupStartLine = 0;
  let details: string[] = [];
  let total = 0;

  const flush = () => {
    if (!currentPerson || !details.length || !total) return;
    advances.push({
      id: `seed-kasbon-2026-06-${slug(currentPerson)}`,
      rowNumber: groupStartLine,
      date: currentDate || '2026-06-01',
      person: titleCase(currentPerson),
      description: details.join('; '),
      amount: total,
      status: 'UNPAID'
    });
  };

  for (let i = sectionIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 1;
    const date = tools.parseIndonesianDate(row[1] || row[0] || '', 2026);
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
