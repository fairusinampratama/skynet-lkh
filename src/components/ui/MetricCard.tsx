import { ReactNode } from 'react';

export function MetricCard({
  icon,
  label,
  value,
  detail,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'emerald' | 'blue' | 'rose' | 'amber';
}) {
  const tones = {
    emerald: 'from-emerald-500/18 to-emerald-500/5 text-emerald-600 dark:text-emerald-300',
    blue: 'from-blue-500/18 to-blue-500/5 text-blue-600 dark:text-blue-300',
    rose: 'from-rose-500/18 to-rose-500/5 text-rose-600 dark:text-rose-300',
    amber: 'from-amber-500/22 to-amber-500/5 text-amber-600 dark:text-amber-300'
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br ${tones[tone]}`}>{icon}</div>
      <div className="mt-4 text-[11px] font-black uppercase text-slate-400">{label}</div>
      <div className="mt-1 break-words font-mono text-2xl font-black text-slate-950 dark:text-white">{value}</div>
      <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  );
}
