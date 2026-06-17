import { ReactNode } from 'react';

export function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">{icon}</div>
          <div className="min-w-0">
            <h3 className="font-black leading-tight" style={{ fontSize: '1rem' }}>{title}</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="min-w-0 p-4">{children}</div>
    </section>
  );
}
