import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { today } from '../lib/format';
import { CashAdvance, CashAdvanceFilters, CashAdvanceMeta, CashAdvanceStatus, Category, EntryType, LedgerEntry, LedgerFilters, LedgerMeta, Month, Summary } from '../types';

const emptySummary: Summary = {
  openingBalance: 0,
  ledgerCount: 0,
  totalIncome: 0,
  totalExpense: 0,
  closingBalance: 0,
  outstandingKasbon: 0,
  outstandingKasbonCount: 0,
  byCategory: [],
  byDay: []
};

const defaultLedgerFilters: LedgerFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  categoryId: '',
  type: '',
  proof: 'all'
};

const defaultMeta = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1
};

const defaultKasbonFilters: CashAdvanceFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  status: '',
  proof: 'all'
};

type LedgerFormState = { date: string; proofNo: string; description: string; categoryId: string; type: EntryType; amount: string };
type KasbonFormState = { date: string; person: string; description: string; amount: string };
type KasbonEditState = KasbonFormState & { status: CashAdvanceStatus };
type PeriodState = { year: number; month: number; openingBalance: string };

type LkhContextValue = {
  months: Month[];
  categories: Category[];
  activeMonthId: string;
  month: Month | null;
  periodsLoaded: boolean;
  periodForm: PeriodState;
  periodExists: boolean;
  summary: Summary;
  outstandingCount: number;
  ledger: LedgerEntry[];
  ledgerFilters: LedgerFilters;
  ledgerMeta: LedgerMeta;
  ledgerLoading: boolean;
  entryForm: LedgerFormState;
  entryCategories: Category[];
  cashAdvances: CashAdvance[];
  kasbonFilters: CashAdvanceFilters;
  kasbonMeta: CashAdvanceMeta;
  kasbonLoading: boolean;
  kasbonForm: KasbonFormState;
  busy: boolean;
  message: string;
  darkMode: boolean;
  locked: boolean;
  clearMessage: () => void;
  setEntryForm: (value: LedgerFormState) => void;
  setKasbonForm: (value: KasbonFormState) => void;
  setOpeningBalance: (value: string) => void;
  setDarkMode: (value: boolean | ((current: boolean) => boolean)) => void;
  changePeriod: (period: { year: number; month: number }) => void;
  createMonth: () => void;
  toggleLock: () => void;
  saveEntry: () => void;
  updateEntry: (id: string, form: LedgerFormState) => Promise<void>;
  deleteEntry: (id: string) => void;
  uploadEntryProof: (id: string, file: File) => Promise<void>;
  deleteEntryProof: (id: string) => Promise<void>;
  changeLedgerFilters: (filters: LedgerFilters) => void;
  changeLedgerPage: (page: number) => void;
  changeLedgerLimit: (limit: number) => void;
  saveKasbon: () => void;
  toggleKasbon: (item: CashAdvance) => void;
  updateKasbon: (id: string, form: KasbonEditState) => Promise<void>;
  deleteKasbon: (id: string) => void;
  uploadKasbonProof: (id: string, file: File) => Promise<void>;
  deleteKasbonProof: (id: string) => Promise<void>;
  changeKasbonFilters: (filters: CashAdvanceFilters) => void;
  changeKasbonPage: (page: number) => void;
  changeKasbonLimit: (limit: number) => void;
};

const LkhContext = createContext<LkhContextValue | null>(null);

const getInitialDarkMode = () => {
  const savedTheme = localStorage.getItem('lkh_theme');
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

export function LkhProvider({ children }: { children: ReactNode }) {
  const [months, setMonths] = useState<Month[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMonthId, setActiveMonthId] = useState('');
  const [month, setMonth] = useState<Month | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cashAdvances, setCashAdvances] = useState<CashAdvance[]>([]);
  const [periodsLoaded, setPeriodsLoaded] = useState(false);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [ledgerFilters, setLedgerFilters] = useState<LedgerFilters>(defaultLedgerFilters);
  const [ledgerMeta, setLedgerMeta] = useState<LedgerMeta>(defaultMeta);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [kasbonFilters, setKasbonFilters] = useState<CashAdvanceFilters>(defaultKasbonFilters);
  const [kasbonMeta, setKasbonMeta] = useState<CashAdvanceMeta>(defaultMeta);
  const [kasbonLoading, setKasbonLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [periodForm, setPeriodForm] = useState<PeriodState>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    openingBalance: ''
  });
  const [entryForm, setEntryForm] = useState<LedgerFormState>({
    date: today(),
    proofNo: '',
    description: '',
    categoryId: '',
    type: 'EXPENSE',
    amount: ''
  });
  const [kasbonForm, setKasbonForm] = useState<KasbonFormState>({
    date: today(),
    person: '',
    description: '',
    amount: ''
  });

  const incomeCategories = useMemo(() => categories.filter((cat) => cat.kind === 'INCOME'), [categories]);
  const expenseCategories = useMemo(() => categories.filter((cat) => cat.kind === 'EXPENSE'), [categories]);
  const entryCategories = entryForm.type === 'INCOME' ? incomeCategories : expenseCategories;
  const locked = month?.status !== 'DRAFT';
  const outstandingCount = summary.outstandingKasbonCount;
  const selectedPeriod = useMemo(
    () => months.find((item) => item.year === periodForm.year && item.month === periodForm.month) || null,
    [months, periodForm.year, periodForm.month]
  );
  const periodExists = Boolean(selectedPeriod || (month && month.year === periodForm.year && month.month === periodForm.month));

  const loadBootstrap = async () => {
    const data = await api('/api/bootstrap');
    setMonths(data.months);
    setCategories(data.categories);
    setPeriodsLoaded(true);
    const first = data.months[0];
    if (first && !activeMonthId) {
      setPeriodForm((current) => ({ ...current, year: first.year, month: first.month, openingBalance: '' }));
      setActiveMonthId(first.id);
    }
  };

  const loadMonth = async (id: string) => {
    if (!id) return;
    const data = await api(`/api/months/${id}/summary`);
    setMonth(data.month);
    setSummary(data.summary);
  };

  const loadLedger = async (id = activeMonthId, page = ledgerMeta.page, filters = ledgerFilters, limit = ledgerMeta.limit) => {
    if (!id) return;
    setLedgerLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (filters.search) params.set('search', filters.search);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.type) params.set('type', filters.type);
      if (filters.proof !== 'all') params.set('proof', filters.proof);
      const data = await api(`/api/months/${id}/ledger?${params.toString()}`);
      setLedger(data.ledger);
      setLedgerMeta({ page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages });
    } finally {
      setLedgerLoading(false);
    }
  };

  const loadKasbon = async (id = activeMonthId, page = kasbonMeta.page, filters = kasbonFilters, limit = kasbonMeta.limit) => {
    if (!id) return;
    setKasbonLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (filters.search) params.set('search', filters.search);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.status) params.set('status', filters.status);
      if (filters.proof !== 'all') params.set('proof', filters.proof);
      const data = await api(`/api/months/${id}/kasbon?${params.toString()}`);
      setCashAdvances(data.cashAdvances);
      setKasbonMeta({ page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages });
    } finally {
      setKasbonLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!activeMonthId) {
      setMonth(null);
      setLedger([]);
      setCashAdvances([]);
      setSummary(emptySummary);
      setLedgerMeta(defaultMeta);
      setKasbonMeta(defaultMeta);
      return;
    }
    loadMonth(activeMonthId).catch((error) => setMessage(error.message));
    setLedgerMeta(defaultMeta);
    setKasbonMeta(defaultMeta);
    loadLedger(activeMonthId, 1, ledgerFilters, defaultMeta.limit).catch((error) => setMessage(error.message));
    loadKasbon(activeMonthId, 1, kasbonFilters, defaultMeta.limit).catch((error) => setMessage(error.message));
  }, [activeMonthId]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.dataset.coreuiTheme = darkMode ? 'dark' : 'light';
    localStorage.setItem('lkh_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const category = entryCategories[0];
    if (category && !entryCategories.some((cat) => cat.id === entryForm.categoryId)) {
      setEntryForm((current) => ({ ...current, categoryId: category.id }));
    }
  }, [entryForm.type, categories]);

  useEffect(() => {
    if (!month) return;
    setPeriodForm((current) => ({ ...current, year: month.year, month: month.month, openingBalance: '' }));
  }, [month?.id]);

  const run = async (task: () => Promise<void>, success: string) => {
    setBusy(true);
    setMessage('');
    try {
      await task();
      setMessage(success);
    } catch (error: any) {
      setMessage(error.message || 'Operasi gagal.');
    } finally {
      setBusy(false);
    }
  };

  const createMonth = () => run(async () => {
    const data = await api('/api/months', {
      method: 'POST',
      body: JSON.stringify(periodForm)
    });
    await loadBootstrap();
    setActiveMonthId(data.month.id);
    setPeriodForm((current) => ({ ...current, openingBalance: '' }));
  }, 'Bulan LKH siap digunakan.');

  const changePeriod = (period: { year: number; month: number }) => {
    const nextYear = Number(period.year);
    const nextMonth = Number(period.month);
    if (!nextYear || nextMonth < 1 || nextMonth > 12) return;
    setMessage('');
    setPeriodForm((current) => ({ ...current, year: nextYear, month: nextMonth, openingBalance: '' }));
    const existing = months.find((item) => item.year === nextYear && item.month === nextMonth);
    setActiveMonthId(existing?.id || '');
  };

  const saveEntry = () => run(async () => {
    if (!activeMonthId) throw new Error('Pilih bulan LKH terlebih dahulu.');
    await api(`/api/months/${activeMonthId}/ledger`, { method: 'POST', body: JSON.stringify(entryForm) });
    setEntryForm((current) => ({ ...current, description: '', amount: '' }));
    await loadMonth(activeMonthId);
    await loadLedger(activeMonthId, 1);
  }, 'Transaksi sirkulasi harian tersimpan.');

  const updateEntry = (id: string, form: LedgerFormState) => run(async () => {
    await api(`/api/ledger/${id}`, { method: 'PUT', body: JSON.stringify(form) });
    await loadMonth(activeMonthId);
    await loadLedger();
  }, 'Transaksi diperbarui.');

  const deleteEntry = (id: string) => run(async () => {
    await api(`/api/ledger/${id}`, { method: 'DELETE' });
    await loadMonth(activeMonthId);
    const nextPage = ledger.length <= 1 && ledgerMeta.page > 1 ? ledgerMeta.page - 1 : ledgerMeta.page;
    await loadLedger(activeMonthId, nextPage);
  }, 'Transaksi dihapus.');

  const uploadEntryProof = (id: string, file: File) => run(async () => {
    const body = new FormData();
    body.append('proof', file);
    await api(`/api/ledger/${id}/proof`, { method: 'POST', body, headers: {} });
    await loadMonth(activeMonthId);
    await loadLedger();
  }, 'Bukti transaksi tersimpan.');

  const deleteEntryProof = (id: string) => run(async () => {
    await api(`/api/ledger/${id}/proof`, { method: 'DELETE' });
    await loadMonth(activeMonthId);
    await loadLedger();
  }, 'Bukti transaksi dihapus.');

  const saveKasbon = () => run(async () => {
    if (!activeMonthId) throw new Error('Pilih bulan LKH terlebih dahulu.');
    await api(`/api/months/${activeMonthId}/kasbon`, { method: 'POST', body: JSON.stringify(kasbonForm) });
    setKasbonForm((current) => ({ ...current, person: '', description: '', amount: '' }));
    await loadMonth(activeMonthId);
    await loadKasbon(activeMonthId, 1);
  }, 'Kasbon tersimpan.');

  const toggleKasbon = (item: CashAdvance) => run(async () => {
    await api(`/api/kasbon/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: item.status === 'PAID' ? 'UNPAID' : 'PAID' }) });
    await loadMonth(activeMonthId);
    await loadKasbon();
  }, 'Status kasbon diperbarui.');

  const updateKasbon = (id: string, form: KasbonEditState) => run(async () => {
    await api(`/api/kasbon/${id}`, { method: 'PUT', body: JSON.stringify(form) });
    await loadMonth(activeMonthId);
    await loadKasbon();
  }, 'Kasbon diperbarui.');

  const deleteKasbon = (id: string) => run(async () => {
    await api(`/api/kasbon/${id}`, { method: 'DELETE' });
    await loadMonth(activeMonthId);
    const nextPage = cashAdvances.length <= 1 && kasbonMeta.page > 1 ? kasbonMeta.page - 1 : kasbonMeta.page;
    await loadKasbon(activeMonthId, nextPage);
  }, 'Kasbon dihapus.');

  const uploadKasbonProof = (id: string, file: File) => run(async () => {
    const body = new FormData();
    body.append('proof', file);
    await api(`/api/kasbon/${id}/proof`, { method: 'POST', body, headers: {} });
    await loadMonth(activeMonthId);
    await loadKasbon();
  }, 'Bukti kasbon tersimpan.');

  const deleteKasbonProof = (id: string) => run(async () => {
    await api(`/api/kasbon/${id}/proof`, { method: 'DELETE' });
    await loadMonth(activeMonthId);
    await loadKasbon();
  }, 'Bukti kasbon dihapus.');

  const toggleLock = () => run(async () => {
    if (!month) return;
    await api(`/api/months/${month.id}`, { method: 'PATCH', body: JSON.stringify({ status: month.status === 'DRAFT' ? 'LOCKED' : 'DRAFT' }) });
    await loadMonth(month.id);
    await loadLedger(month.id);
    await loadKasbon(month.id);
    await loadBootstrap();
  }, month?.status === 'DRAFT' ? 'Bulan dikunci.' : 'Bulan dibuka kembali.');

  const value: LkhContextValue = {
    months,
    categories,
    activeMonthId,
    month,
    periodsLoaded,
    periodForm,
    periodExists,
    summary,
    outstandingCount,
    ledger,
    ledgerFilters,
    ledgerMeta,
    ledgerLoading,
    entryForm,
    entryCategories,
    cashAdvances,
    kasbonFilters,
    kasbonMeta,
    kasbonLoading,
    kasbonForm,
    busy,
    message,
    darkMode,
    locked,
    clearMessage: () => setMessage(''),
    setEntryForm,
    setKasbonForm,
    setOpeningBalance: (openingBalance) => setPeriodForm((current) => ({ ...current, openingBalance })),
    setDarkMode,
    changePeriod,
    createMonth,
    toggleLock,
    saveEntry,
    updateEntry,
    deleteEntry,
    uploadEntryProof,
    deleteEntryProof,
    changeLedgerFilters: (filters) => {
      setLedgerFilters(filters);
      loadLedger(activeMonthId, 1, filters, ledgerMeta.limit).catch((error) => setMessage(error.message));
    },
    changeLedgerPage: (page) => loadLedger(activeMonthId, page).catch((error) => setMessage(error.message)),
    changeLedgerLimit: (limit) => loadLedger(activeMonthId, 1, ledgerFilters, limit).catch((error) => setMessage(error.message)),
    saveKasbon,
    toggleKasbon,
    updateKasbon,
    deleteKasbon,
    uploadKasbonProof,
    deleteKasbonProof,
    changeKasbonFilters: (filters) => {
      setKasbonFilters(filters);
      loadKasbon(activeMonthId, 1, filters, kasbonMeta.limit).catch((error) => setMessage(error.message));
    },
    changeKasbonPage: (page) => loadKasbon(activeMonthId, page).catch((error) => setMessage(error.message)),
    changeKasbonLimit: (limit) => loadKasbon(activeMonthId, 1, kasbonFilters, limit).catch((error) => setMessage(error.message))
  };

  return <LkhContext.Provider value={value}>{children}</LkhContext.Provider>;
}

export function useLkh() {
  const context = useContext(LkhContext);
  if (!context) throw new Error('useLkh must be used inside LkhProvider.');
  return context;
}
