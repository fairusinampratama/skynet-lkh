import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Filter, HandCoins, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { IconButton, MutedButton, PrimaryButton } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Fields';
import { Panel } from '../../components/ui/Panel';
import { rupiah } from '../../lib/format';
import { CashAdvance, CashAdvanceFilters, CashAdvanceMeta, CashAdvanceStatus } from '../../types';

type KasbonFormState = { date: string; person: string; description: string; amount: string };
type KasbonEditState = KasbonFormState & { status: CashAdvanceStatus };

const emptyFilters: CashAdvanceFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  status: '',
  proof: 'all'
};

export function KasbonView({
  locked,
  busy,
  form,
  items,
  filters,
  meta,
  loading,
  onChange,
  onSave,
  onToggle,
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
  form: KasbonFormState;
  items: CashAdvance[];
  filters: CashAdvanceFilters;
  meta: CashAdvanceMeta;
  loading: boolean;
  onChange: (value: KasbonFormState) => void;
  onSave: () => void;
  onToggle: (item: CashAdvance) => void;
  onUpdate: (id: string, form: KasbonEditState) => Promise<void>;
  onDelete: (id: string) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
  onFiltersChange: (filters: CashAdvanceFilters) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  return (
    <Panel title="Kasbon" subtitle="Input, filter, bukti, dan status pelunasan kasbon." icon={<HandCoins size={18} />}>
      <KasbonForm locked={locked} busy={busy} form={form} onChange={onChange} onSave={onSave} />
      <KasbonFiltersBar filters={filters} limit={meta.limit} onFiltersChange={onFiltersChange} onLimitChange={onLimitChange} />
      <KasbonBrowser
        items={items}
        locked={locked}
        busy={busy}
        loading={loading}
        meta={meta}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onUploadProof={onUploadProof}
        onDeleteProof={onDeleteProof}
        onPageChange={onPageChange}
      />
    </Panel>
  );
}

function KasbonForm({
  locked,
  busy,
  form,
  onChange,
  onSave
}: {
  locked: boolean;
  busy: boolean;
  form: KasbonFormState;
  onChange: (value: KasbonFormState) => void;
  onSave: () => void;
}) {
  return (
    <div className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/70 md:grid-cols-2 xl:grid-cols-[140px_180px_minmax(220px,1fr)] 2xl:grid-cols-[140px_180px_minmax(180px,1fr)_160px_auto]">
      <TextField disabled={locked} type="date" value={form.date} onChange={(e) => onChange({ ...form, date: e.target.value })} />
      <TextField disabled={locked} placeholder="Nama" value={form.person} onChange={(e) => onChange({ ...form, person: e.target.value })} />
      <TextField disabled={locked} placeholder="Keterangan" value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} />
      <TextField disabled={locked} placeholder="Nominal" value={form.amount} onChange={(e) => onChange({ ...form, amount: e.target.value })} />
      <PrimaryButton disabled={locked || busy} onClick={onSave}>
        <Plus size={16} />
        Tambah
      </PrimaryButton>
    </div>
  );
}

function KasbonFiltersBar({
  filters,
  limit,
  onFiltersChange,
  onLimitChange
}: {
  filters: CashAdvanceFilters;
  limit: number;
  onFiltersChange: (filters: CashAdvanceFilters) => void;
  onLimitChange: (limit: number) => void;
}) {
  const update = (next: Partial<CashAdvanceFilters>) => onFiltersChange({ ...filters, ...next });

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900/80">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-200">
        <Filter size={16} />
        Cari dan Filter
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_140px] 2xl:grid-cols-[minmax(220px,1.4fr)_150px_150px_140px_145px_110px_auto]">
        <TextField placeholder="Cari nama atau keterangan" value={filters.search} onChange={(e) => update({ search: e.target.value })} />
        <TextField type="date" value={filters.dateFrom} onChange={(e) => update({ dateFrom: e.target.value })} />
        <TextField type="date" value={filters.dateTo} onChange={(e) => update({ dateTo: e.target.value })} />
        <SelectField value={filters.status} onChange={(e) => update({ status: e.target.value as CashAdvanceFilters['status'] })}>
          <option value="">Semua status</option>
          <option value="UNPAID">Belum lunas</option>
          <option value="PAID">Lunas</option>
        </SelectField>
        <SelectField value={filters.proof} onChange={(e) => update({ proof: e.target.value as CashAdvanceFilters['proof'] })}>
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

function KasbonBrowser({
  items,
  locked,
  busy,
  loading,
  meta,
  onToggle,
  onUpdate,
  onDelete,
  onUploadProof,
  onDeleteProof,
  onPageChange
}: {
  items: CashAdvance[];
  locked: boolean;
  busy: boolean;
  loading: boolean;
  meta: CashAdvanceMeta;
  onToggle: (item: CashAdvance) => void;
  onUpdate: (id: string, form: KasbonEditState) => Promise<void>;
  onDelete: (id: string) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
  onPageChange: (page: number) => void;
}) {
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState<KasbonEditState | null>(null);
  const [preview, setPreview] = useState<CashAdvance | null>(null);

  const startEdit = (item: CashAdvance) => {
    setEditingId(item.id);
    setEditForm({
      date: item.date,
      person: item.person,
      description: item.description,
      amount: String(item.amount),
      status: item.status
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

  const confirmDelete = (item: CashAdvance) => {
    if (window.confirm(`Hapus kasbon "${item.description}"?`)) onDelete(item.id);
  };

  return (
    <>
      {loading && <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">Memuat data kasbon...</div>}

      <div className="mt-4 hidden min-w-0 overflow-x-auto overscroll-x-contain rounded-md border border-slate-200 dark:border-white/10 md:block">
        <table className="w-full min-w-[920px] table-fixed text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="w-[92px] px-3 py-3">Tanggal</th>
              <th className="w-[120px] px-3 py-3">Nama</th>
              <th className="px-3 py-3">Keterangan</th>
              <th className="w-[115px] px-3 py-3 text-right">Nominal</th>
              <th className="w-[135px] px-3 py-3">Status</th>
              <th className="w-[100px] px-3 py-3">Bukti</th>
              <th className="sticky right-0 z-20 w-[86px] bg-slate-100 px-3 py-3 text-right shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.75)] dark:bg-slate-950">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {items.map((item) => (
              <KasbonTableRow
                key={item.id}
                item={item}
                editForm={editingId === item.id ? editForm : null}
                locked={locked}
                busy={busy}
                onEditFormChange={setEditForm}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onToggle={onToggle}
                onDelete={confirmDelete}
                onPreview={setPreview}
                onUploadProof={onUploadProof}
                onDeleteProof={onDeleteProof}
              />
            ))}
            {!items.length && <tr><td colSpan={7} className="px-3 py-12 text-center font-bold text-slate-400">Tidak ada kasbon sesuai filter.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:hidden">
        {items.map((item) => (
          <KasbonMobileCard
            key={item.id}
            item={item}
            editForm={editingId === item.id ? editForm : null}
            locked={locked}
            busy={busy}
            onEditFormChange={setEditForm}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onToggle={onToggle}
            onDelete={confirmDelete}
            onPreview={setPreview}
            onUploadProof={onUploadProof}
            onDeleteProof={onDeleteProof}
          />
        ))}
        {!items.length && <div className="rounded-md border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-bold text-slate-400 dark:border-white/10">Tidak ada kasbon sesuai filter.</div>}
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} disabled={loading} />
      {preview && <ProofPreview item={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function KasbonTableRow({
  item,
  editForm,
  locked,
  busy,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  onPreview,
  onUploadProof,
  onDeleteProof
}: {
  item: CashAdvance;
  editForm: KasbonEditState | null;
  locked: boolean;
  busy: boolean;
  onEditFormChange: (form: KasbonEditState) => void;
  onStartEdit: (item: CashAdvance) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: (item: CashAdvance) => void;
  onDelete: (item: CashAdvance) => void;
  onPreview: (item: CashAdvance) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  const isEditing = Boolean(editForm);

  return (
    <tr className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70">
      <td className="px-3 py-3 align-top font-mono text-xs text-slate-500 dark:text-slate-400">
        {editForm ? <TextField type="date" value={editForm.date} onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })} /> : item.date}
      </td>
      <td className="break-words px-3 py-3 align-top font-black">
        {editForm ? <TextField value={editForm.person} onChange={(e) => onEditFormChange({ ...editForm, person: e.target.value })} /> : item.person}
      </td>
      <td className="break-words px-3 py-3 align-top font-semibold">
        {editForm ? <TextField value={editForm.description} onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })} /> : item.description}
      </td>
      <td className="px-3 py-3 align-top text-right font-mono font-bold">
        {editForm ? <TextField value={editForm.amount} onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })} /> : rupiah(item.amount)}
      </td>
      <td className="px-3 py-3 align-top">
        {editForm ? (
          <SelectField value={editForm.status} onChange={(e) => onEditFormChange({ ...editForm, status: e.target.value as CashAdvanceStatus })}>
            <option value="UNPAID">Belum lunas</option>
            <option value="PAID">Lunas</option>
          </SelectField>
        ) : <StatusButton item={item} locked={locked || busy} onToggle={onToggle} />}
      </td>
      <td className="px-3 py-3 align-top">
        <ProofActions item={item} locked={locked || busy} onPreview={onPreview} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </td>
      <td className="sticky right-0 bg-white px-3 py-3 align-top shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.75)] dark:bg-slate-900">
        <RowActions
          isEditing={isEditing}
          locked={locked}
          busy={busy}
          onStartEdit={() => onStartEdit(item)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(item)}
        />
      </td>
    </tr>
  );
}

function KasbonMobileCard({
  item,
  editForm,
  locked,
  busy,
  onEditFormChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  onPreview,
  onUploadProof,
  onDeleteProof
}: {
  item: CashAdvance;
  editForm: KasbonEditState | null;
  locked: boolean;
  busy: boolean;
  onEditFormChange: (form: KasbonEditState) => void;
  onStartEdit: (item: CashAdvance) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: (item: CashAdvance) => void;
  onDelete: (item: CashAdvance) => void;
  onPreview: (item: CashAdvance) => void;
  onUploadProof: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  if (editForm) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="grid gap-2">
          <TextField type="date" value={editForm.date} onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })} />
          <TextField placeholder="Nama" value={editForm.person} onChange={(e) => onEditFormChange({ ...editForm, person: e.target.value })} />
          <TextField placeholder="Keterangan" value={editForm.description} onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })} />
          <TextField placeholder="Nominal" value={editForm.amount} onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })} />
          <SelectField value={editForm.status} onChange={(e) => onEditFormChange({ ...editForm, status: e.target.value as CashAdvanceStatus })}>
            <option value="UNPAID">Belum lunas</option>
            <option value="PAID">Lunas</option>
          </SelectField>
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
          <div className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">{item.date}</div>
          <div className="mt-1 break-words text-sm font-black">{item.person}</div>
          <div className="mt-1 break-words text-sm font-semibold text-slate-600 dark:text-slate-300">{item.description}</div>
        </div>
        <RowActions
          isEditing={false}
          locked={locked}
          busy={busy}
          onStartEdit={() => onStartEdit(item)}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={() => onDelete(item)}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <AmountBox label="Nominal" value={rupiah(item.amount)} />
        <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-950/70">
          <div className="text-[11px] font-black uppercase text-slate-400">Status</div>
          <div className="mt-1"><StatusButton item={item} locked={locked || busy} onToggle={onToggle} /></div>
        </div>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <ProofActions item={item} locked={locked || busy} onPreview={onPreview} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
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

function StatusButton({ item, locked, onToggle }: { item: CashAdvance; locked: boolean; onToggle: (item: CashAdvance) => void }) {
  return (
    <button
      disabled={locked}
      onClick={() => onToggle(item)}
      className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-black disabled:cursor-not-allowed disabled:opacity-50 ${item.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}
    >
      <CheckCircle2 size={14} />
      {item.status === 'PAID' ? 'Lunas' : 'Belum Lunas'}
    </button>
  );
}

function AmountBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2 dark:bg-slate-950/70">
      <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-sm font-black text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function Pagination({ meta, disabled, onPageChange }: { meta: CashAdvanceMeta; disabled: boolean; onPageChange: (page: number) => void }) {
  const start = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = meta.total ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const pages = getVisiblePages(meta.page, meta.totalPages);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
      <div className="font-bold text-slate-500 dark:text-slate-400">
        Menampilkan {start}-{end} dari {meta.total} kasbon
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
  item,
  locked,
  onPreview,
  onUpload,
  onDeleteProof
}: {
  item: CashAdvance;
  locked: boolean;
  onPreview: (item: CashAdvance) => void;
  onUpload: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {item.proofImageUrl ? (
        <>
          <button onClick={() => onPreview(item)} className="inline-flex h-9 w-12 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
            <img src={item.proofImageUrl} alt={item.proofImageName || 'Bukti kasbon'} className="h-full w-full object-cover" />
          </button>
          <IconButton onClick={() => onPreview(item)}><Eye size={15} /></IconButton>
          <IconButton disabled={locked} onClick={() => onDeleteProof(item.id)}><X size={15} /></IconButton>
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
            if (file) onUpload(item.id, file);
            event.target.value = '';
          }}
        />
      </label>
    </div>
  );
}

function ProofPreview({ item, onClose }: { item: CashAdvance; onClose: () => void }) {
  if (!item.proofImageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-4 shadow-2xl dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-black">Bukti Kasbon</div>
            <div className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">{item.proofImageName || item.description}</div>
          </div>
          <MutedButton onClick={onClose}><X size={16} /> Tutup</MutedButton>
        </div>
        <img src={item.proofImageUrl} alt={item.proofImageName || 'Bukti kasbon'} className="max-h-[75vh] w-full rounded-md object-contain" />
      </div>
    </div>
  );
}
