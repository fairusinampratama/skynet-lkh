import { ButtonHTMLAttributes, ReactNode } from 'react';

const primaryButtonClass = 'inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-xs font-black text-slate-950 shadow-sm shadow-emerald-950/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto';
const mutedButtonClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';
const iconButtonClass = 'inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryButton({ className = '', children, ...props }: ButtonProps) {
  return <button className={`${primaryButtonClass} ${className}`} {...props}>{children}</button>;
}

export function MutedButton({ className = '', children, ...props }: ButtonProps) {
  return <button className={`${mutedButtonClass} ${className}`} {...props}>{children}</button>;
}

export function IconButton({ className = '', children, ...props }: ButtonProps) {
  return <button className={`${iconButtonClass} ${className}`} {...props}>{children}</button>;
}
