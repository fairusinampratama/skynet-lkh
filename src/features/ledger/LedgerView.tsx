import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Filter, ImagePlus, Pencil, Plus, Save, Table2, Trash2, X } from 'lucide-react';
import { PrimaryButton, IconButton, MutedButton } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Fields';
import { Panel } from '../../components/ui/Panel';
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
        limit={meta.limit}
        onFiltersChange={onFiltersChange}
        onLimitChange={onLimitChange}
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
    <div className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70 md:grid-cols-2 xl:grid-cols-[130px_110px_minmax(220px,1fr)_180px] 2xl:grid-cols-[130px_110px_minmax(180px,1fr)_180px_120px_145px_auto]">
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
  limit,
  onFiltersChange,
  onLimitChange
}: {
  filters: LedgerFilters;
  categories: Category[];
  limit: number;
  onFiltersChange: (filters: LedgerFilters) => void;
  onLimitChange: (limit: number) => void;
}) {
  const update = (next: Partial<LedgerFilters>) => onFiltersChange({ ...filters, ...next });

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/80">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
        <Filter size={16} />
        Cari dan Filter
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_180px] 2xl:grid-cols-[minmax(220px,1.4fr)_150px_150px_180px_130px_145px_110px_auto]">
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
        <SelectField value={String(limit)} onChange={(e) => onLimitChange(Number(e.target.value))}>
          <option value="25">25 baris</option>
          <option value="50">50 baris</option>
          <option value="100">100 baris</option>
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
  onPageChange
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

      <div className="mt-4 hidden min-w-0 overflow-x-auto overscroll-x-contain rounded-md border border-slate-200 dark:border-white/10 md:block">
        <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="w-[92px] px-3 py-3">Tanggal</th>
              <th className="w-[50px] px-3 py-3">No</th>
              <th className="px-3 py-3">Keterangan</th>
              <th className="w-[120px] px-3 py-3">Kategori</th>
              <th className="w-[105px] px-3 py-3 text-right">Masuk</th>
              <th className="w-[105px] px-3 py-3 text-right">Keluar</th>
              <th className="w-[115px] px-3 py-3 text-right">Saldo</th>
              <th className="w-[100px] px-3 py-3">Bukti</th>
              <th className="sticky right-0 z-20 w-[86px] bg-slate-100 px-3 py-3 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.75)] dark:bg-slate-950">Aksi</th>
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
            {!entries.length && <tr><td colSpan={9} className="px-3 py-12 text-center font-bold text-slate-400">Tidak ada transaksi sesuai filter.</td></tr>}
          </tbody>
        </table>
      </div>

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
        {!entries.length && <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-bold text-slate-400 dark:border-white/10">Tidak ada transaksi sesuai filter.</div>}
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} disabled={loading} />
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
    <tr className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70">
      <td className="px-3 py-3 align-top font-mono text-xs text-slate-500 dark:text-slate-400">
        {editForm ? <TextField type="date" value={editForm.date} onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })} /> : entry.date}
      </td>
      <td className="px-3 py-3 align-top font-bold">
        {editForm ? <TextField value={editForm.proofNo} onChange={(e) => onEditFormChange({ ...editForm, proofNo: e.target.value })} /> : entry.proofNo}
      </td>
      <td className="break-words px-3 py-3 align-top font-semibold">
        {editForm ? <TextField value={editForm.description} onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })} /> : entry.description}
      </td>
      <td className="px-3 py-3 align-top">
        {editForm ? (
          <SelectField value={editForm.categoryId} onChange={(e) => onEditFormChange({ ...editForm, categoryId: e.target.value })}>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </SelectField>
        ) : <CategoryBadge entry={entry} />}
      </td>
      <td className="px-3 py-3 align-top text-right font-mono text-emerald-600 dark:text-emerald-300">
        {editForm ? (
          <SelectField value={editForm.type} onChange={(e) => onEditFormChange({ ...editForm, type: e.target.value as EntryType })}>
            <option value="EXPENSE">Keluar</option>
            <option value="INCOME">Masuk</option>
          </SelectField>
        ) : entry.type === 'INCOME' ? rupiah(entry.amount) : ''}
      </td>
      <td className="px-3 py-3 align-top text-right font-mono text-rose-600 dark:text-rose-300">
        {editForm ? <TextField value={editForm.amount} onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })} /> : entry.type === 'EXPENSE' ? rupiah(entry.amount) : ''}
      </td>
      <td className="px-3 py-3 align-top text-right font-mono font-black">{rupiah(entry.runningBalance)}</td>
      <td className="px-3 py-3 align-top">
        <ProofActions entry={entry} locked={locked || busy} onPreview={onPreview} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </td>
      <td className="sticky right-0 bg-white px-3 py-3 align-top shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.75)] dark:bg-slate-900">
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
        <div className="mt-3 flex justify-end gap-2">
          <MutedButton disabled={busy} onClick={onCancelEdit}><X size={15} /> Batal</MutedButton>
          <PrimaryButton className="w-auto" disabled={busy} onClick={onSaveEdit}><Save size={15} /> Simpan</PrimaryButton>
        </div>
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
        <AmountBox label={entry.type === 'INCOME' ? 'Masuk' : 'Keluar'} value={rupiah(entry.amount)} tone={entry.type === 'INCOME' ? 'income' : 'expense'} />
        <AmountBox label="Saldo" value={rupiah(entry.runningBalance)} tone="balance" />
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <ProofActions entry={entry} locked={locked || busy} onPreview={onPreview} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </div>
    </div>
  );
}

function RowActions({
  isEditing,
  locked,
  busy,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete
}: {
  isEditing: boolean;
  locked: boolean;
  busy: boolean;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      {isEditing ? (
        <>
          <IconButton disabled={busy} onClick={onSaveEdit}><Save size={15} /></IconButton>
          <IconButton disabled={busy} onClick={onCancelEdit}><X size={15} /></IconButton>
        </>
      ) : (
        <>
          <IconButton disabled={locked || busy} onClick={onStartEdit}><Pencil size={15} /></IconButton>
          <IconButton disabled={locked || busy} onClick={onDelete}><Trash2 size={15} /></IconButton>
        </>
      )}
    </div>
  );
}

function CategoryBadge({ entry }: { entry: LedgerEntry }) {
  return <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{entry.category.name}</span>;
}

function AmountBox({ label, value, tone }: { label: string; value: string; tone: 'income' | 'expense' | 'balance' }) {
  const toneClass = tone === 'income' ? 'text-emerald-600 dark:text-emerald-300' : tone === 'expense' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100';
  return (
    <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-950/70">
      <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-sm font-black ${toneClass}`}>{value}</div>
    </div>
  );
}

function Pagination({ meta, disabled, onPageChange }: { meta: LedgerMeta; disabled: boolean; onPageChange: (page: number) => void }) {
  const start = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = meta.total ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const pages = getVisiblePages(meta.page, meta.totalPages);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      <div className="font-bold text-slate-500 dark:text-slate-400">
        Menampilkan {start}-{end} dari {meta.total} transaksi
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MutedButton disabled={disabled || meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft size={16} />
          Sebelumnya
        </MutedButton>
        {pages.map((page) => (
          <button
            key={page}
            disabled={disabled || page === meta.page}
            onClick={() => onPageChange(page)}
            className={`h-10 min-w-10 rounded-md border px-3 text-sm font-black transition disabled:cursor-default ${page === meta.page ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            {page}
          </button>
        ))}
        <MutedButton disabled={disabled || meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          Berikutnya
          <ChevronRight size={16} />
        </MutedButton>
      </div>
    </div>
  );
}

function getVisiblePages(current: number, total: number) {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

function ProofActions({
  entry,
  locked,
  onPreview,
  onUpload,
  onDeleteProof
}: {
  entry: LedgerEntry;
  locked: boolean;
  onPreview: (entry: LedgerEntry) => void;
  onUpload: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {entry.proofImageUrl ? (
        <>
          <button onClick={() => onPreview(entry)} className="inline-flex h-9 w-12 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
            <img src={entry.proofImageUrl} alt={entry.proofImageName || 'Bukti transaksi'} className="h-full w-full object-cover" />
          </button>
          <IconButton onClick={() => onPreview(entry)}><Eye size={15} /></IconButton>
          <IconButton disabled={locked} onClick={() => onDeleteProof(entry.id)}><X size={15} /></IconButton>
        </>
      ) : (
        <span className="text-xs font-bold text-slate-400">Belum ada</span>
      )}
      <label className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 ${locked ? 'pointer-events-none opacity-30' : 'cursor-pointer'}`}>
        <ImagePlus size={15} />
        <input
          disabled={locked}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(entry.id, file);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );
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
