import { useState } from 'react';
import { Filter, Plus, Table2, X } from 'lucide-react';
import { PrimaryButton, MutedButton } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Fields';
import { Panel } from '../../components/ui/Panel';
import {
  CategoryPill,
  DataTableShell,
  EmptyTableState,
  InlineEditActions,
  MobileEmptyState,
  MobileStat,
  MoneyCell,
  ProofCell,
  RowActions,
  TablePagination
} from '../../components/ui/DataTable';
import { rupiah } from '../../lib/format';
import { Category, EntryType, LedgerEntry, LedgerFilters, LedgerMeta } from '../../types';

type LedgerFormState = { date: string; proofNo: string; description: string; categoryId: string; type: EntryType; amount: string };

const emptyFilters: LedgerFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  categoryId: '',
  type: '',
  proof: 'all'
};

export function LedgerView({
  locked,
  busy,
  form,
  entryCategories,
  filterCategories,
  entries,
  filters,
  meta,
  loading,
  onChange,
  onSave,
  onUpdate,
  onDelete,
  onUploadProof,
  onDeleteProof,
  onFiltersChange,
  onPageChange,
  onLimitChange
}: {
  locked: boolean;
  busy: boolean;
  form: LedgerFormState;
  entryCategories: Category[];
  filterCategories: Category[];
  entries: LedgerEntry[];
  filters: LedgerFilters;
  meta: LedgerMeta;
  loading: boolean;
  onChange: (value: LedgerFormState) => void;
  onSave: () => void;
  onUpdate: (id: string, form: LedgerFormState) => Promise<void>;
  onDelete: (id: string) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
  onFiltersChange: (filters: LedgerFilters) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <Panel title="Sirkulasi Harian" subtitle="Input dan monitor transaksi kas harian dengan saldo otomatis." icon={<Table2 size={18} />}>
      <LedgerForm locked={locked} busy={busy} form={form} categories={entryCategories} onChange={onChange} onSave={onSave} />
      <LedgerFiltersBar
        filters={filters}
        categories={filterCategories}
        onFiltersChange={onFiltersChange}
      />
      <LedgerBrowser
        entries={entries}
        categories={filterCategories}
        locked={locked}
        busy={busy}
        loading={loading}
        meta={meta}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onUploadProof={onUploadProof}
        onDeleteProof={onDeleteProof}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </Panel>
  );
}

function LedgerForm({
  locked,
  busy,
  form,
  categories,
  onChange,
  onSave
}: {
  locked: boolean;
  busy: boolean;
  form: LedgerFormState;
  categories: Category[];
  onChange: (value: LedgerFormState) => void;
  onSave: () => void;
}) {
  return (
    <div className="grid min-w-0 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-slate-950/70 md:grid-cols-2 xl:grid-cols-[130px_110px_minmax(220px,1fr)_180px] 2xl:grid-cols-[130px_110px_minmax(180px,1fr)_180px_120px_145px_auto]">
      <TextField disabled={locked} type="date" value={form.date} onChange={(e) => onChange({ ...form, date: e.target.value })} />
      <TextField disabled={locked} placeholder="No bukti" value={form.proofNo} onChange={(e) => onChange({ ...form, proofNo: e.target.value })} />
      <TextField disabled={locked} placeholder="Keterangan" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <SelectField disabled={locked} value={form.categoryId} onChange={(e) => onChange({ ...form, categoryId: e.target.value })}>
        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
      </SelectField>
      <SelectField disabled={locked} value={form.type} onChange={(e) => onChange({ ...form, type: e.target.value as EntryType })}>
        <option value="EXPENSE">Keluar</option>
        <option value="INCOME">Masuk</option>
      </SelectField>
      <TextField disabled={locked} placeholder="Nominal" value={form.amount} onChange={(e) => onChange({ ...form, amount: e.target.value })} />
      <PrimaryButton disabled={locked || busy} onClick={onSave}>
        <Plus size={16} />
        Tambah
      </PrimaryButton>
    </div>
  );
}

function LedgerFiltersBar({
  filters,
  categories,
  onFiltersChange
}: {
  filters: LedgerFilters;
  categories: Category[];
  onFiltersChange: (filters: LedgerFilters) => void;
}) {
  const update = (next: Partial<LedgerFilters>) => onFiltersChange({ ...filters, ...next });
  const activeFilters = [
    filters.search && 'Pencarian',
    filters.dateFrom && 'Dari tanggal',
    filters.dateTo && 'Sampai tanggal',
    filters.categoryId && 'Kategori',
    filters.type && 'Tipe',
    filters.proof !== 'all' && 'Bukti'
  ].filter(Boolean);

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-xs dark:border-white/10 dark:bg-slate-900/80">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
          <Filter size={14} />
          Cari dan Filter
        </div>
        <div className="text-xs font-bold text-slate-400">
          {activeFilters.length ? `${activeFilters.length} filter aktif` : 'Tidak ada filter aktif'}
        </div>
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_180px] 2xl:grid-cols-[minmax(220px,1.4fr)_150px_150px_180px_130px_145px_auto]">
        <TextField placeholder="Cari no bukti, keterangan, kategori" value={filters.search} onChange={(e) => update({ search: e.target.value })} />
        <TextField type="date" value={filters.dateFrom} onChange={(e) => update({ dateFrom: e.target.value })} />
        <TextField type="date" value={filters.dateTo} onChange={(e) => update({ dateTo: e.target.value })} />
        <SelectField value={filters.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
          <option value="">Semua kategori</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </SelectField>
        <SelectField value={filters.type} onChange={(e) => update({ type: e.target.value as '' | EntryType })}>
          <option value="">Semua tipe</option>
          <option value="INCOME">Masuk</option>
          <option value="EXPENSE">Keluar</option>
        </SelectField>
        <SelectField value={filters.proof} onChange={(e) => update({ proof: e.target.value as LedgerFilters['proof'] })}>
          <option value="all">Semua bukti</option>
          <option value="with">Ada bukti</option>
          <option value="without">Tanpa bukti</option>
        </SelectField>
        <MutedButton className="w-full xl:w-auto" onClick={() => onFiltersChange(emptyFilters)}>
          Reset
        </MutedButton>
      </div>
    </div>
  );
}

function LedgerBrowser({
  entries,
  categories,
  locked,
  busy,
  loading,
  meta,
  onUpdate,
  onDelete,
  onUploadProof,
  onDeleteProof,
  onPageChange,
  onLimitChange
}: {
  entries: LedgerEntry[];
  categories: Category[];
  locked: boolean;
  busy: boolean;
  loading: boolean;
  meta: LedgerMeta;
  onUpdate: (id: string, form: LedgerFormState) => Promise<void>;
  onDelete: (id: string) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState<LedgerFormState | null>(null);
  const [preview, setPreview] = useState<LedgerEntry | null>(null);

  const startEdit = (entry: LedgerEntry) => {
    setEditingId(entry.id);
    setEditForm({
      date: entry.date,
      proofNo: entry.proofNo || '',
      description: entry.description,
      categoryId: entry.categoryId,
      type: entry.type,
      amount: String(entry.amount)
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;
    await onUpdate(editingId, editForm);
    cancelEdit();
  };

  const confirmDelete = (entry: LedgerEntry) => {
    if (window.confirm(`Hapus transaksi "${entry.description}"?`)) onDelete(entry.id);
  };

  return (
    <>
      {loading && <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">Memuat data transaksi...</div>}

      <DataTableShell>
        <table className="w-full min-w-[1160px] table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="w-[105px] px-3 py-2.5">Tanggal</th>
              <th className="w-[92px] px-3 py-2.5">No Bukti</th>
              <th className="w-[260px] px-3 py-2.5">Keterangan</th>
              <th className="w-[150px] px-3 py-2.5">Kategori</th>
              <th className="w-[128px] px-3 py-2.5 text-right">Nominal</th>
              <th className="w-[132px] px-3 py-2.5 text-right">Saldo</th>
              <th className="w-[170px] px-3 py-2.5">Bukti</th>
              <th className="sticky right-0 z-20 w-[96px] bg-slate-100 px-3 py-2.5 text-right shadow-[-10px_0_16px_-16px_rgba(15,23,42,0.9)] dark:bg-slate-950">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {entries.map((entry) => (
              <LedgerTableRow
                key={entry.id}
                entry={entry}
                categories={categories}
                editForm={editingId === entry.id ? editForm : null}
                locked={locked}
                busy={busy}
                onEditFormChange={setEditForm}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onDelete={confirmDelete}
                onPreview={setPreview}
                onUploadProof={onUploadProof}
                onDeleteProof={onDeleteProof}
              />
            ))}
            {!entries.length && <EmptyTableState colSpan={8} message="Tidak ada transaksi sesuai filter." />}
          </tbody>
        </table>
      </DataTableShell>

      <div className="mt-4 grid gap-3 md:hidden">
        {entries.map((entry) => (
          <LedgerMobileCard
            key={entry.id}
            entry={entry}
            categories={categories}
            editForm={editingId === entry.id ? editForm : null}
            locked={locked}
            busy={busy}
            onEditFormChange={setEditForm}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onDelete={confirmDelete}
            onPreview={setPreview}
            onUploadProof={onUploadProof}
            onDeleteProof={onDeleteProof}
          />
        ))}
        {!entries.length && <MobileEmptyState message="Tidak ada transaksi sesuai filter." />}
      </div>

      <TablePagination meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} disabled={loading} itemLabel="transaksi" />
      {preview && <ProofPreview entry={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function LedgerTableRow({
  entry,
  categories,
  editForm,
  locked,
  busy,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onPreview,
  onUploadProof,
  onDeleteProof
}: {
  entry: LedgerEntry;
  categories: Category[];
  editForm: LedgerFormState | null;
  locked: boolean;
  busy: boolean;
  onEditFormChange: (form: LedgerFormState) => void;
  onStartEdit: (entry: LedgerEntry) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (entry: LedgerEntry) => void;
  onPreview: (entry: LedgerEntry) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  const isEditing = Boolean(editForm);

  return (
    <tr className="bg-white transition hover:bg-emerald-50/50 dark:bg-slate-900 dark:hover:bg-emerald-500/5">
      <td className="px-3 py-2.5 align-top font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
        {editForm ? <TextField type="date" value={editForm.date} onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })} /> : entry.date}
      </td>
      <td className="px-3 py-2.5 align-top font-mono text-[11px] font-black text-slate-600 dark:text-slate-300">
        {editForm ? <TextField value={editForm.proofNo} onChange={(e) => onEditFormChange({ ...editForm, proofNo: e.target.value })} /> : entry.proofNo || '-'}
      </td>
      <td className="break-words px-3 py-2.5 align-top font-semibold leading-snug">
        {editForm ? <TextField value={editForm.description} onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })} /> : entry.description}
      </td>
      <td className="px-3 py-2.5 align-top">
        {editForm ? (
          <SelectField value={editForm.categoryId} onChange={(e) => onEditFormChange({ ...editForm, categoryId: e.target.value })}>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </SelectField>
        ) : <CategoryBadge entry={entry} />}
      </td>
      <td className="px-3 py-2.5 align-top text-right">
        {editForm ? (
          <div className="grid gap-1.5">
            <SelectField value={editForm.type} onChange={(e) => onEditFormChange({ ...editForm, type: e.target.value as EntryType })}>
              <option value="EXPENSE">Keluar</option>
              <option value="INCOME">Masuk</option>
            </SelectField>
            <TextField value={editForm.amount} onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })} />
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <MoneyCell value={rupiah(entry.amount)} tone={entry.type === 'INCOME' ? 'income' : 'expense'} />
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${entry.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'}`}>
              {entry.type === 'INCOME' ? 'Masuk' : 'Keluar'}
            </span>
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 align-top text-right"><MoneyCell value={rupiah(entry.runningBalance)} /></td>
      <td className="px-3 py-2.5 align-top">
        <ProofCell id={entry.id} proofImageUrl={entry.proofImageUrl} proofImageName={entry.proofImageName} alt="Bukti transaksi" locked={locked || busy} onPreview={() => onPreview(entry)} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </td>
      <td className="sticky right-0 bg-white px-3 py-2.5 align-top shadow-[-10px_0_16px_-16px_rgba(15,23,42,0.9)] dark:bg-slate-900">
        <RowActions
          isEditing={isEditing}
          locked={locked}
          busy={busy}
          onStartEdit={() => onStartEdit(entry)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(entry)}
        />
      </td>
    </tr>
  );
}

function LedgerMobileCard({
  entry,
  categories,
  editForm,
  locked,
  busy,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onPreview,
  onUploadProof,
  onDeleteProof
}: {
  entry: LedgerEntry;
  categories: Category[];
  editForm: LedgerFormState | null;
  locked: boolean;
  busy: boolean;
  onEditFormChange: (form: LedgerFormState) => void;
  onStartEdit: (entry: LedgerEntry) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (entry: LedgerEntry) => void;
  onPreview: (entry: LedgerEntry) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  if (editForm) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="grid gap-2">
          <TextField type="date" value={editForm.date} onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })} />
          <TextField placeholder="No bukti" value={editForm.proofNo} onChange={(e) => onEditFormChange({ ...editForm, proofNo: e.target.value })} />
          <TextField placeholder="Keterangan" value={editForm.description} onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })} />
          <SelectField value={editForm.categoryId} onChange={(e) => onEditFormChange({ ...editForm, categoryId: e.target.value })}>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-2">
            <SelectField value={editForm.type} onChange={(e) => onEditFormChange({ ...editForm, type: e.target.value as EntryType })}>
              <option value="EXPENSE">Keluar</option>
              <option value="INCOME">Masuk</option>
            </SelectField>
            <TextField placeholder="Nominal" value={editForm.amount} onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })} />
          </div>
        </div>
        <InlineEditActions busy={busy} onCancel={onCancelEdit} onSave={onSaveEdit} />
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{entry.date} {entry.proofNo ? `| ${entry.proofNo}` : ''}</div>
          <div className="mt-1 break-words text-sm font-black">{entry.description}</div>
          <div className="mt-2"><CategoryBadge entry={entry} /></div>
        </div>
        <RowActions
          isEditing={false}
          locked={locked}
          busy={busy}
          onStartEdit={() => onStartEdit(entry)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(entry)}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <MobileStat label="Nominal">
          <MoneyCell value={rupiah(entry.amount)} tone={entry.type === 'INCOME' ? 'income' : 'expense'} />
        </MobileStat>
        <MobileStat label="Saldo">
          <MoneyCell value={rupiah(entry.runningBalance)} />
        </MobileStat>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <ProofCell id={entry.id} proofImageUrl={entry.proofImageUrl} proofImageName={entry.proofImageName} alt="Bukti transaksi" locked={locked || busy} onPreview={() => onPreview(entry)} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </div>
    </div>
  );
}

function CategoryBadge({ entry }: { entry: LedgerEntry }) {
  return <CategoryPill>{entry.category.name}</CategoryPill>;
}

function ProofPreview({ entry, onClose }: { entry: LedgerEntry; onClose: () => void }) {
  if (!entry.proofImageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-4 shadow-2xl dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-black">Bukti Transaksi</div>
            <div className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{entry.proofImageName || entry.description}</div>
          </div>
          <MutedButton onClick={onClose}><X size={16} /> Tutup</MutedButton>
        </div>
        <img src={entry.proofImageUrl} alt={entry.proofImageName || 'Bukti transaksi'} className="max-h-[75vh] w-full rounded-md object-contain" />
      </div>
    </div>
  );
}
