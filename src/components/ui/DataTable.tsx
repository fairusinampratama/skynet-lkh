import { ChangeEvent, ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileImage,
  ImagePlus,
  Pencil,
  Save,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { SelectField } from './Fields';

export type TableMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function DataTableShell({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 hidden min-w-0 overflow-x-auto overscroll-x-contain rounded-md border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 md:block">
      {children}
    </div>
  );
}

export function EmptyTableState({ message, colSpan }: { message: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14">
        <div className="flex min-h-36 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center dark:border-white/10 dark:bg-slate-950/60">
          <FileImage className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <div className="text-sm font-black text-slate-500 dark:text-slate-300">{message}</div>
          <div className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Ubah filter atau tambahkan data baru.</div>
        </div>
      </td>
    </tr>
  );
}

export function MobileEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-white/10 dark:bg-slate-950/60">
      <FileImage className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
      <div className="text-sm font-black text-slate-500 dark:text-slate-300">{message}</div>
      <div className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">Ubah filter atau tambahkan data baru.</div>
    </div>
  );
}

export function TablePagination({
  meta,
  disabled,
  itemLabel,
  onPageChange,
  onLimitChange
}: {
  meta: TableMeta;
  disabled: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const start = meta.total ? (meta.page - 1) * meta.limit + 1 : 0;
  const end = meta.total ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const pages = getVisiblePages(meta.page, meta.totalPages);

  const goTo = (page: number) => {
    if (disabled || page < 1 || page > meta.totalPages || page === meta.page) return;
    onPageChange(page);
  };

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="font-bold text-slate-500 dark:text-slate-400">
          Menampilkan <span className="font-mono text-slate-800 dark:text-slate-100">{start}-{end}</span> dari{' '}
          <span className="font-mono text-slate-800 dark:text-slate-100">{meta.total}</span> {itemLabel}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-black uppercase text-slate-400">Baris</span>
            <SelectField className="h-8 w-24 text-xs" value={String(meta.limit)} onChange={(event) => onLimitChange(Number(event.target.value))} disabled={disabled}>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </SelectField>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <PageIconButton title="Halaman pertama" disabled={disabled || meta.page <= 1} onClick={() => goTo(1)}>
              <ChevronsLeft size={16} />
            </PageIconButton>
            <PageIconButton title="Halaman sebelumnya" disabled={disabled || meta.page <= 1} onClick={() => goTo(meta.page - 1)}>
              <ChevronLeft size={16} />
            </PageIconButton>
            {pages.map((page, index) => page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="flex h-8 min-w-8 items-center justify-center text-xs font-black text-slate-400">...</span>
            ) : (
              <button
                key={page}
                disabled={disabled || page === meta.page}
                onClick={() => goTo(page)}
                className={`h-8 min-w-8 rounded-md border px-2 text-xs font-black transition disabled:cursor-default ${
                  page === meta.page
                    ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300'
                }`}
              >
                {page}
              </button>
            ))}
            <PageIconButton title="Halaman berikutnya" disabled={disabled || meta.page >= meta.totalPages} onClick={() => goTo(meta.page + 1)}>
              <ChevronRight size={16} />
            </PageIconButton>
            <PageIconButton title="Halaman terakhir" disabled={disabled || meta.page >= meta.totalPages} onClick={() => goTo(meta.totalPages)}>
              <ChevronsRight size={16} />
            </PageIconButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageIconButton({ title, disabled, onClick, children }: { title: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
    >
      {children}
    </button>
  );
}

function getVisiblePages(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    return previous && page - previous > 1 ? ['ellipsis', page] : [page];
  });
}

export function CategoryPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-black leading-snug text-slate-600 dark:bg-white/10 dark:text-slate-200">
      <span className="min-w-0 whitespace-normal break-words">{children}</span>
    </span>
  );
}

export function StatusPill({ status, disabled, onClick }: { status: 'PAID' | 'UNPAID'; disabled: boolean; onClick: () => void }) {
  const paid = status === 'PAID';
  return (
    <button
      title={paid ? 'Tandai belum lunas' : 'Tandai lunas'}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-black leading-snug transition disabled:cursor-not-allowed disabled:opacity-50 ${
        paid
          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300'
      }`}
    >
      <CheckCircle2 size={13} />
      <span className="whitespace-normal text-left">{paid ? 'Lunas' : 'Belum Lunas'}</span>
    </button>
  );
}

export function MoneyCell({ value, tone = 'default' }: { value: string; tone?: 'income' | 'expense' | 'default' }) {
  const toneClass = tone === 'income'
    ? 'text-emerald-600 dark:text-emerald-300'
    : tone === 'expense'
      ? 'text-rose-600 dark:text-rose-300'
      : 'text-slate-900 dark:text-slate-100';
  return <span className={`font-mono font-black tabular-nums ${toneClass}`}>{value}</span>;
}

export function MobileStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-slate-50 p-2 dark:bg-slate-950/70">
      <div className="text-[10px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 min-w-0 text-xs font-black">{children}</div>
    </div>
  );
}

export function RowActions({
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
    <div className="flex justify-end gap-1.5">
      {isEditing ? (
        <>
          <ActionButton title="Simpan" variant="success" disabled={busy} onClick={onSaveEdit}><Save size={14} /></ActionButton>
          <ActionButton title="Batal" variant="neutral" disabled={busy} onClick={onCancelEdit}><X size={14} /></ActionButton>
        </>
      ) : (
        <>
          <ActionButton title="Edit" variant="neutral" disabled={locked || busy} onClick={onStartEdit}><Pencil size={14} /></ActionButton>
          <ActionButton title="Hapus" variant="danger" disabled={locked || busy} onClick={onDelete}><Trash2 size={14} /></ActionButton>
        </>
      )}
    </div>
  );
}

function ActionButton({
  title,
  variant,
  disabled,
  onClick,
  children
}: {
  title: string;
  variant: 'neutral' | 'success' | 'danger';
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const variants = {
    neutral: 'border-slate-300 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300',
    success: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
    danger: 'border-slate-300 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300'
  };

  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white transition disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-950 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function InlineEditActions({ busy, onCancel, onSave }: { busy: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <button
        disabled={busy}
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <X size={14} />
        Batal
      </button>
      <button
        disabled={busy}
        onClick={onSave}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save size={14} />
        Simpan
      </button>
    </div>
  );
}

export function ProofCell({
  id,
  proofImageUrl,
  proofImageName,
  alt,
  locked,
  onPreview,
  onUpload,
  onDeleteProof
}: {
  id: string;
  proofImageUrl?: string | null;
  proofImageName?: string | null;
  alt: string;
  locked: boolean;
  onPreview: () => void;
  onUpload: (id: string, file: File) => Promise<void>;
  onDeleteProof: (id: string) => Promise<void>;
}) {
  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUpload(id, file);
    event.target.value = '';
  };

  if (!proofImageUrl) {
    return (
      <div className="flex max-w-[150px] items-center">
        <ProofUploadButton locked={locked} title="Tambah bukti" onChange={handleUpload} label="Bukti" full />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        title="Lihat bukti"
        onClick={onPreview}
        className="inline-flex h-8 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition hover:border-emerald-300 dark:border-white/10 dark:bg-slate-950"
      >
        <img src={proofImageUrl} alt={proofImageName || alt} className="h-full w-full object-cover" />
      </button>
      <ActionButton title="Lihat bukti" variant="neutral" onClick={onPreview}><Eye size={14} /></ActionButton>
      <ProofUploadButton locked={locked} title="Ganti bukti" onChange={handleUpload}>
        <Upload size={14} />
      </ProofUploadButton>
      <ActionButton title="Hapus bukti" variant="danger" disabled={locked} onClick={() => onDeleteProof(id)}><X size={14} /></ActionButton>
    </div>
  );
}

function ProofUploadButton({
  locked,
  title,
  onChange,
  label,
  full,
  children
}: {
  locked: boolean;
  title: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  full?: boolean;
  children?: ReactNode;
}) {
  return (
    <label
      title={title}
      aria-label={title}
      className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-1.5 text-[11px] font-black text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 ${full ? 'min-w-16 border-dashed px-2' : ''} ${
        locked ? 'pointer-events-none opacity-30' : 'cursor-pointer'
      }`}
    >
      {children}
      {label && <span className="whitespace-nowrap">{label}</span>}
      <input disabled={locked} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
    </label>
  );
}
