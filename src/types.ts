export type MonthStatus = 'DRAFT' | 'LOCKED' | 'ARCHIVED';
export type EntryType = 'INCOME' | 'EXPENSE';
export type CategoryKind = 'INCOME' | 'EXPENSE';
export type CashAdvanceStatus = 'UNPAID' | 'PAID';
export type UserRole = 'ADMIN' | 'READER';

export interface Month {
  id: string;
  label: string;
  year: number;
  month: number;
  openingBalance: number;
  reportedClosingBalance?: number | null;
  reportedCashAdvanceTotal?: number | null;
  reportedCashOnHand?: number | null;
  status: MonthStatus;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  active: boolean;
}

export interface LedgerEntry {
  id: string;
  monthId: string;
  date: string;
  proofNo?: string | null;
  proofImagePath?: string | null;
  proofImageName?: string | null;
  proofImageMime?: string | null;
  proofImageSize?: number | null;
  proofImageUrl?: string | null;
  description: string;
  categoryId: string;
  category: Category | null;
  type: EntryType;
  amount: number;
  spreadsheetBalance?: number | null;
  dashboardIncluded?: boolean;
  spreadsheetSection?: number | null;
  runningBalance: number;
  source?: string;
  synthetic?: boolean;
}

export interface LedgerFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  categoryId: string;
  type: '' | EntryType;
  proof: 'all' | 'with' | 'without';
}

export interface LedgerMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CashAdvanceFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: '' | CashAdvanceStatus;
  proof: 'all' | 'with' | 'without';
}

export interface CashAdvanceMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CashAdvance {
  id: string;
  monthId: string;
  date: string;
  person: string;
  description: string;
  amount: number;
  status: CashAdvanceStatus;
  proofImagePath?: string | null;
  proofImageName?: string | null;
  proofImageMime?: string | null;
  proofImageSize?: number | null;
  proofImageUrl?: string | null;
}

export interface Summary {
  openingBalance: number;
  ledgerCount: number;
  dashboardLedgerCount?: number;
  totalIncome: number;
  totalExpense: number;
  computedIncome?: number;
  computedExpense?: number;
  incomeSource?: 'spreadsheet' | 'computed';
  expenseSource?: 'spreadsheet' | 'computed';
  closingBalance: number;
  computedClosingBalance?: number;
  balanceSource?: 'spreadsheet' | 'computed';
  cashOnHand?: number;
  reportedCashAdvanceTotal?: number | null;
  actualOutstandingKasbon?: number;
  cashAdvanceSource?: 'spreadsheet' | 'computed';
  cashOnHandSource?: 'spreadsheet' | 'computed';
  outstandingKasbon: number;
  outstandingKasbonCount: number;
  byCategory: Array<{ name: string; amount: number }>;
  byDay: Array<{ date: string; income: number; expense: number }>;
}
