import { Lock, Moon, Plus, Sun, Unlock } from 'lucide-react';
import { MutedButton, PrimaryButton } from '../ui/Button';
import { SelectField, TextField } from '../ui/Fields';
import { Month } from '../../types';

const MONTH_OPTIONS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export function TopBar({
  month,
  periodYear,
  periodMonth,
  periodExists,
  periodsLoaded,
  openingBalance,
  busy,
  darkMode,
  onPeriodChange,
  onOpeningBalanceChange,
  onCreatePeriod,
  onToggleDarkMode,
  onToggleLock
}: {
  month: Month | null;
  periodYear: number;
  periodMonth: number;
  periodExists: boolean;
  periodsLoaded: boolean;
  openingBalance: string;
  busy: boolean;
  darkMode: boolean;
  onPeriodChange: (value: { year: number; month: number }) => void;
  onOpeningBalanceChange: (value: string) => void;
  onCreatePeriod: () => void;
  onToggleDarkMode: () => void;
  onToggleLock: () => void;
}) {
  const periodLabel = `${MONTH_OPTIONS[periodMonth - 1] || 'Periode'} ${periodYear}`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{periodLabel}</h2>
              <span className={`rounded px-2 py-1 text-[11px] font-black ${periodExists ? month?.status === 'DRAFT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                {!periodsLoaded ? 'MEMUAT' : periodExists ? month?.status || 'DRAFT' : 'BELUM DIBUAT'}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Sirkulasi harian, kasbon, saldo otomatis, dan rekap analitik bulanan.</p>
          </div>

          <div className="grid max-w-3xl min-w-0 gap-2 sm:grid-cols-[180px_120px] xl:grid-cols-[190px_120px]">
            <SelectField value={String(periodMonth)} onChange={(event) => onPeriodChange({ year: periodYear, month: Number(event.target.value) })}>
              {MONTH_OPTIONS.map((label, index) => (
                <option key={label} value={index + 1}>{label}</option>
              ))}
            </SelectField>
            <TextField type="number" value={periodYear} onChange={(event) => onPeriodChange({ year: Number(event.target.value), month: periodMonth })} />
          </div>

          {periodsLoaded && !periodExists && (
            <div className="grid max-w-3xl min-w-0 gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10 sm:grid-cols-[minmax(180px,1fr)_auto]">
              <TextField placeholder="Saldo awal" value={openingBalance} onChange={(event) => onOpeningBalanceChange(event.target.value)} />
              <PrimaryButton disabled={busy} onClick={onCreatePeriod}>
                <Plus size={16} />
                Buat Periode
              </PrimaryButton>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MutedButton onClick={onToggleDarkMode} title="Ganti tema">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light' : 'Dark'}
          </MutedButton>
          {month && (
            <MutedButton onClick={onToggleLock}>
              {month.status === 'DRAFT' ? <Lock size={16} /> : <Unlock size={16} />}
              {month.status === 'DRAFT' ? 'Lock' : 'Unlock'}
            </MutedButton>
          )}
        </div>
      </div>
    </header>
  );
}
