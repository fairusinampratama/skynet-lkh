import { useState } from 'react';
import { Filter, HandCoins, Plus, X } from 'lucide-react';
import { MutedButton, PrimaryButton } from '../../components/ui/Button';
import { SelectField, TextField } from '../../components/ui/Fields';
import { Panel } from '../../components/ui/Panel';
import {
  DataTableShell,
  EmptyTableState,
  InlineEditActions,
  MobileEmptyState,
  MobileStat,
  MoneyCell,
  ProofCell,
  RowActions,
  StatusPill,
  TablePagination
} from '../../components/ui/DataTable';
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
      <KasbonFiltersBar filters={filters} onFiltersChange={onFiltersChange} />
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
        onLimitChange={onLimitChange}
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
    <div className="grid min-w-0 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-slate-950/70 md:grid-cols-2 xl:grid-cols-[140px_180px_minmax(220px,1fr)] 2xl:grid-cols-[140px_180px_minmax(180px,1fr)_160px_auto]">
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
  onFiltersChange
}: {
  filters: CashAdvanceFilters;
  onFiltersChange: (filters: CashAdvanceFilters) => void;
}) {
  const update = (next: Partial<CashAdvanceFilters>) => onFiltersChange({ ...filters, ...next });
  const activeFilters = [
    filters.search && 'Pencarian',
    filters.dateFrom && 'Dari tanggal',
    filters.dateTo && 'Sampai tanggal',
    filters.status && 'Status',
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
      <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_140px] 2xl:grid-cols-[minmax(220px,1.4fr)_150px_150px_140px_145px_auto]">
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
  onPageChange,
  onLimitChange
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
  onLimitChange: (limit: number) => void;
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

      <DataTableShell>
        <table className="w-full min-w-[1040px] table-fixed text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="w-[105px] px-3 py-2.5">Tanggal</th>
              <th className="w-[150px] px-3 py-2.5">Nama</th>
              <th className="w-[260px] px-3 py-2.5">Keterangan</th>
              <th className="w-[132px] px-3 py-2.5 text-right">Nominal</th>
              <th className="w-[150px] px-3 py-2.5">Status</th>
              <th className="w-[170px] px-3 py-2.5">Bukti</th>
              <th className="sticky right-0 z-20 w-[96px] bg-slate-100 px-3 py-2.5 text-right shadow-[-10px_0_16px_-16px_rgba(15,23,42,0.9)] dark:bg-slate-950">Aksi</th>
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
            {!items.length && <EmptyTableState colSpan={7} message="Tidak ada kasbon sesuai filter." />}
          </tbody>
        </table>
      </DataTableShell>

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
        {!items.length && <MobileEmptyState message="Tidak ada kasbon sesuai filter." />}
      </div>

      <TablePagination meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} disabled={loading} itemLabel="kasbon" />
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
    <tr className="bg-white transition hover:bg-emerald-50/50 dark:bg-slate-900 dark:hover:bg-emerald-500/5">
      <td className="px-3 py-2.5 align-top font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
        {editForm ? <TextField type="date" value={editForm.date} onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })} /> : item.date}
      </td>
      <td className="break-words px-3 py-2.5 align-top font-black leading-snug">
        {editForm ? <TextField value={editForm.person} onChange={(e) => onEditFormChange({ ...editForm, person: e.target.value })} /> : item.person}
      </td>
      <td className="break-words px-3 py-2.5 align-top font-semibold leading-snug">
        {editForm ? <TextField value={editForm.description} onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })} /> : item.description}
      </td>
      <td className="px-3 py-2.5 align-top text-right">
        {editForm ? <TextField value={editForm.amount} onChange={(e) => onEditFormChange({ ...editForm, amount: e.target.value })} /> : <MoneyCell value={rupiah(item.amount)} />}
      </td>
      <td className="px-3 py-2.5 align-top">
        {editForm ? (
          <SelectField value={editForm.status} onChange={(e) => onEditFormChange({ ...editForm, status: e.target.value as CashAdvanceStatus })}>
            <option value="UNPAID">Belum lunas</option>
            <option value="PAID">Lunas</option>
          </SelectField>
        ) : <StatusButton item={item} locked={locked || busy} onToggle={onToggle} />}
      </td>
      <td className="px-3 py-2.5 align-top">
        <ProofCell id={item.id} proofImageUrl={item.proofImageUrl} proofImageName={item.proofImageName} alt="Bukti kasbon" locked={locked || busy} onPreview={() => onPreview(item)} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </td>
      <td className="sticky right-0 bg-white px-3 py-2.5 align-top shadow-[-10px_0_16px_-16px_rgba(15,23,42,0.9)] dark:bg-slate-900">
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
        <InlineEditActions busy={busy} onCancel={onCancelEdit} onSave={onSaveEdit} />
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
        <MobileStat label="Nominal"><MoneyCell value={rupiah(item.amount)} /></MobileStat>
        <MobileStat label="Status"><StatusButton item={item} locked={locked || busy} onToggle={onToggle} /></MobileStat>
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <ProofCell id={item.id} proofImageUrl={item.proofImageUrl} proofImageName={item.proofImageName} alt="Bukti kasbon" locked={locked || busy} onPreview={() => onPreview(item)} onUpload={onUploadProof} onDeleteProof={onDeleteProof} />
      </div>
    </div>
  );
}

function StatusButton({ item, locked, onToggle }: { item: CashAdvance; locked: boolean; onToggle: (item: CashAdvance) => void }) {
  return <StatusPill status={item.status} disabled={locked} onClick={() => onToggle(item)} />;
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
