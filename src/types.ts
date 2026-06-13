export type MonthStatus = 'DRAFT' | 'LOCKED' | 'ARCHIVED';
export type EntryType = 'INCOME' | 'EXPENSE';
export type CategoryKind = 'INCOME' | 'EXPENSE';
export type CashAdvanceStatus = 'UNPAID' | 'PAID';

export interface Month {
  id: string;
  label: string;
  year: number;
  month: number;
  openingBalance: number;
  status: MonthStatus;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
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
  category: Category;
  type: EntryType;
  amount: number;
  runningBalance: number;
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
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  outstandingKasbon: number;
  outstandingKasbonCount: number;
  byCategory: Array<{ name: string; amount: number }>;
  byDay: Array<{ date: string; income: number; expense: number }>;
}
