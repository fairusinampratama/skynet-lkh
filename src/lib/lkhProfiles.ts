export type LkhColumnMap = {
  date: number;
  proofNo: number;
  description: number;
  category: number;
  income: number;
  expense: number;
  balance: number;
};

export type LkhReportedBalanceMode = 'auto' | 'side-panel' | 'footer';
export type LkhCashAdvanceMode = 'side-panel' | 'employee' | 'detailed' | 'loose-fallback';

export type LkhPeriodProfile = {
  key: string;
  year: number;
  month: number;
  fileName: string;
  columns: LkhColumnMap;
  openingBalanceFallback?: number;
  stopLabels: string[];
  reportedBalanceMode: LkhReportedBalanceMode;
  cashAdvanceModes: LkhCashAdvanceMode[];
  expected?: {
    openingBalance?: number;
    ledgerRows?: number;
    totalIncome?: number;
    totalExpense?: number;
    closingBalance?: number;
    reportedClosingBalance?: number;
    reportedCashAdvanceTotal?: number;
    reportedCashOnHand?: number;
    cashAdvanceRows?: number;
    cashAdvanceTotal?: number;
  };
};

const standardColumns: LkhColumnMap = {
  date: 0,
  proofNo: 1,
  description: 2,
  category: 3,
  income: 4,
  expense: 5,
  balance: 6
};

const standardStopLabels = ['rincian kas bon', 'kasbone karyawan', 'kategori', 'grand total'];
const standardCashAdvanceModes: LkhCashAdvanceMode[] = ['side-panel', 'employee', 'detailed', 'loose-fallback'];

export const LKH_PERIOD_PROFILES: LkhPeriodProfile[] = [
  {
    key: '2026-01',
    year: 2026,
    month: 1,
    fileName: 'LKH SKYNET PERIODE 2026 - Copy of JANUARI.csv',
    columns: standardColumns,
    stopLabels: standardStopLabels,
    reportedBalanceMode: 'auto',
    cashAdvanceModes: standardCashAdvanceModes,
    expected: {
      openingBalance: 0,
      ledgerRows: 409,
      totalIncome: 35092622,
      totalExpense: 30161005,
      closingBalance: 4931617,
      reportedCashAdvanceTotal: 4897500,
      reportedCashOnHand: 34117,
      cashAdvanceRows: 58,
      cashAdvanceTotal: 4897500
    }
  },
  {
    key: '2026-02',
    year: 2026,
    month: 2,
    fileName: 'LKH SKYNET PERIODE 2026 - FEBRUARI (1).csv',
    columns: standardColumns,
    stopLabels: standardStopLabels,
    reportedBalanceMode: 'auto',
    cashAdvanceModes: standardCashAdvanceModes,
    expected: {
      openingBalance: 34117,
      ledgerRows: 375,
      totalIncome: 35819000,
      totalExpense: 32112412,
      closingBalance: 3740705,
      reportedCashAdvanceTotal: 3057000,
      reportedCashOnHand: 683705,
      cashAdvanceRows: 53,
      cashAdvanceTotal: 3057000
    }
  },
  {
    key: '2026-03',
    year: 2026,
    month: 3,
    fileName: 'LKH SKYNET PERIODE 2026 - MARET (1).csv',
    columns: standardColumns,
    stopLabels: standardStopLabels,
    reportedBalanceMode: 'auto',
    cashAdvanceModes: standardCashAdvanceModes,
    expected: {
      openingBalance: 683705,
      ledgerRows: 292,
      totalIncome: 29749000,
      totalExpense: 25763120,
      closingBalance: 4669585,
      reportedCashAdvanceTotal: 4756500,
      reportedCashOnHand: -86915,
      cashAdvanceRows: 53,
      cashAdvanceTotal: 4756500
    }
  },
  {
    key: '2026-04',
    year: 2026,
    month: 4,
    fileName: 'LKH SKYNET PERIODE 2026 - APRIL (1).csv',
    columns: standardColumns,
    stopLabels: standardStopLabels,
    reportedBalanceMode: 'auto',
    cashAdvanceModes: standardCashAdvanceModes,
    expected: {
      openingBalance: 370000,
      ledgerRows: 393,
      totalIncome: 31561000,
      totalExpense: 23964770,
      closingBalance: 7966230,
      reportedCashAdvanceTotal: 6395600,
      reportedCashOnHand: 1570630,
      cashAdvanceRows: 74,
      cashAdvanceTotal: 6395600
    }
  },
  {
    key: '2026-05',
    year: 2026,
    month: 5,
    fileName: 'LKH SKYNET PERIODE 2026 - MEI (1).csv',
    columns: standardColumns,
    stopLabels: standardStopLabels,
    reportedBalanceMode: 'auto',
    cashAdvanceModes: standardCashAdvanceModes,
    expected: {
      openingBalance: 0,
      ledgerRows: 430,
      totalIncome: 35347630,
      totalExpense: 30165369,
      closingBalance: 5182261,
      reportedClosingBalance: 5182261,
      reportedCashAdvanceTotal: 3585500,
      reportedCashOnHand: 1596761,
      cashAdvanceRows: 39,
      cashAdvanceTotal: 3585500
    }
  },
  {
    key: '2026-06',
    year: 2026,
    month: 6,
    fileName: 'LKH SKYNET PERIODE 2026 - JUNI (3).csv',
    columns: standardColumns,
    stopLabels: standardStopLabels,
    reportedBalanceMode: 'auto',
    cashAdvanceModes: standardCashAdvanceModes,
    expected: {
      openingBalance: 1596761,
      ledgerRows: 345,
      totalIncome: 27365900,
      totalExpense: 24536120,
      closingBalance: 4426541,
      reportedClosingBalance: 4426541,
      reportedCashAdvanceTotal: 4312500,
      reportedCashOnHand: 114041,
      cashAdvanceRows: 1,
      cashAdvanceTotal: 1213900
    }
  }
];

export const lkhPeriodKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`;

export function getLkhPeriodProfile(year: number, month: number) {
  const key = lkhPeriodKey(year, month);
  return LKH_PERIOD_PROFILES.find((profile) => profile.key === key) || null;
}

export function requireLkhPeriodProfile(year: number, month: number) {
  const profile = getLkhPeriodProfile(year, month);
  if (!profile) throw new Error(`Profil konversi LKH ${lkhPeriodKey(year, month)} belum tersedia.`);
  return profile;
}
