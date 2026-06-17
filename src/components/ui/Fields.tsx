import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

const controlClass = 'h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400';
const darkControlClass = 'h-9 w-full min-w-0 rounded-md border border-white/10 bg-slate-900 px-3 text-xs font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  tone?: 'default' | 'dark';
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
  tone?: 'default' | 'dark';
};

export function TextField({ tone = 'default', className = '', ...props }: TextFieldProps) {
  const baseClass = tone === 'dark' ? darkControlClass : controlClass;
  return <input className={`${baseClass} ${className}`} {...props} />;
}

export function SelectField({ tone = 'default', className = '', children, ...props }: SelectFieldProps) {
  const baseClass = tone === 'dark' ? darkControlClass : controlClass;

  return (
    <div className="relative min-w-0">
      <select className={`${baseClass} appearance-none pr-10 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
