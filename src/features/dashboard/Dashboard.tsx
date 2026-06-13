import { ReactNode } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, CircleDollarSign, WalletCards } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricCard } from '../../components/ui/MetricCard';
import { Month, Summary } from '../../types';
import { rupiah } from '../../lib/format';

export function Dashboard({ summary, month, outstandingCount }: { summary: Summary; month: Month | null; outstandingCount: number }) {
  return (
    <div className="grid min-w-0 gap-5">
      <section className="grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard icon={<WalletCards size={19} />} label="Saldo Tersedia" value={rupiah(summary.closingBalance)} detail="Saldo akhir bulan berjalan" tone="emerald" />
        <MetricCard icon={<ArrowUpCircle size={19} />} label="Penerimaan" value={rupiah(summary.totalIncome + summary.openingBalance)} detail="Termasuk saldo awal" tone="blue" />
        <MetricCard icon={<ArrowDownCircle size={19} />} label="Pengeluaran" value={rupiah(summary.totalExpense)} detail={`${summary.ledgerCount} transaksi ledger`} tone="rose" />
        <MetricCard icon={<CircleDollarSign size={19} />} label="Kasbon Aktif" value={rupiah(summary.outstandingKasbon)} detail={`${outstandingCount} belum lunas`} tone="amber" />
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-black"><CalendarDays size={18} /> Tren Harian</div>
          <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{month?.label || 'Belum ada bulan'}</span>
        </div>
        <ChartFrame empty={!summary.byDay.length} message="Belum ada data transaksi harian. Tambahkan transaksi di Sirkulasi Harian untuk melihat tren.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => rupiah(Number(value))} />
              <Bar dataKey="expense" fill="#e11d48" name="Pengeluaran" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" fill="#059669" name="Penerimaan" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        </section>

        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-2 font-black"><ArrowDownCircle size={18} /> Pengeluaran Kategori</div>
        <ChartFrame empty={!summary.byCategory.length} message="Belum ada pengeluaran berkategori untuk bulan ini.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.byCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => rupiah(Number(value))} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {summary.byCategory.map((_, index) => <Cell key={index} fill={['#2563eb', '#0f766e', '#f97316', '#7c3aed', '#dc2626'][index % 5]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        </section>
      </div>
    </div>
  );
}

function ChartFrame({ empty, message, children }: { empty: boolean; message: string; children: ReactNode }) {
  return (
    <div className="h-80 min-w-0">
      {empty ? (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-500">
          {message}
        </div>
      ) : children}
    </div>
  );
}
