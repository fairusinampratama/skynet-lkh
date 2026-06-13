import { ReactNode } from 'react';
import { HandCoins, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Table2, WalletCards } from 'lucide-react';

type Tab = 'ledger' | 'kasbon' | 'dashboard';

export function Sidebar({
  collapsed,
  tab,
  onTabChange,
  onToggleCollapsed
}: {
  collapsed: boolean;
  tab: Tab;
  onTabChange: (value: Tab) => void;
  onToggleCollapsed: () => void;
}) {
  return (
    <aside className="border-b border-white/10 bg-slate-950 text-white lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className={`flex h-full flex-col gap-5 p-4 transition-all ${collapsed ? 'lg:items-center lg:px-3' : ''}`}>
        <div className={`flex items-center rounded-lg border border-white/10 bg-white/5 p-3 ${collapsed ? 'lg:flex-col lg:justify-center lg:gap-3' : 'gap-3'}`}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-slate-950">
              <WalletCards size={24} />
            </div>
            <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
              <h1 className="text-lg font-black">LKH SkyNet</h1>
              <p className="truncate text-xs font-semibold text-slate-400">Finance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/10 hover:text-white lg:inline-flex"
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className={`grid gap-2 ${collapsed ? 'lg:w-full' : ''}`}>
          <NavButton collapsed={collapsed} active={tab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => onTabChange('dashboard')} />
          <NavButton collapsed={collapsed} active={tab === 'ledger'} icon={<Table2 size={18} />} label="Sirkulasi Harian" onClick={() => onTabChange('ledger')} />
          <NavButton collapsed={collapsed} active={tab === 'kasbon'} icon={<HandCoins size={18} />} label="Kasbon" onClick={() => onTabChange('kasbon')} />
        </nav>
      </div>
    </aside>
  );
}

function NavButton({ collapsed, active, icon, label, onClick }: { collapsed: boolean; active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-extrabold transition ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
    >
      {icon}
      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
      {collapsed && (
        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-40 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-xl shadow-slate-950/30 transition group-hover:opacity-100 group-focus-visible:opacity-100 lg:block">
          {label}
        </span>
      )}
    </button>
  );
}
