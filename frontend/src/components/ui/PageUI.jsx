/**
 * Shared page UI primitives — AdminUsers-style cards, tables, toolbars.
 * Light + dark via ThemeContext (html.dark + Tailwind dark: classes).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Loader2 } from 'lucide-react';

/* ── Tokens ─────────────────────────────────────────────────── */
export const fieldClass =
  'w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 focus:border-indigo-400 dark:focus:border-indigo-500 transition-shadow';

export const surfaceClass =
  'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgb(15_23_42/0.04),0_8px_24px_rgb(15_23_42/0.04)] dark:shadow-black/30';

export const surfaceSoftClass =
  'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_1px_3px_rgb(15_23_42/0.04)] dark:shadow-black/30';

export const pageBgClass =
  'min-h-full bg-[#f4f6fb] dark:bg-slate-950 transition-colors';

export const btnPrimaryClass =
  'h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 dark:shadow-indigo-900/40 hover:from-indigo-500 hover:to-violet-500 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

export const btnSecondaryClass =
  'h-11 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed';

export const btnGhostClass =
  'w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 shadow-sm flex items-center justify-center transition-colors shrink-0';

export const thClass =
  'px-5 sm:px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider';

export const tdClass = 'px-5 sm:px-6 py-3.5 text-sm';

export const labelClass =
  'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

/* ── Page shell ─────────────────────────────────────────────── */
export function PageShell({ children, className = '', flush = false }) {
  return (
    <div
      className={`space-y-5 ${pageBgClass} ${
        flush ? '-m-6 p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Header ─────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function RefreshButton({ onClick, loading = false, title = 'Refresh' }) {
  return (
    <button type="button" onClick={onClick} title={title} className={btnGhostClass}>
      <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
    </button>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-400',
  bar = 'from-indigo-400 via-violet-400 to-fuchsia-500',
  delay = 0,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`relative ${surfaceClass} p-5 overflow-hidden ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 tracking-tight tabular-nums">
            {value}
          </p>
          {subtitle != null && subtitle !== '' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}
          >
            <Icon size={20} strokeWidth={1.75} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Surface / panel card ───────────────────────────────────── */
export function SurfaceCard({ children, className = '', padding = true, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${surfaceSoftClass} ${padding ? 'p-4 sm:p-5' : 'overflow-hidden'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div
      className={`px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions}
    </div>
  );
}

/* ── Alert banner ───────────────────────────────────────────── */
export function AlertBanner({
  icon: Icon,
  title,
  children,
  tone = 'rose',
  className = '',
}) {
  const tones = {
    rose: 'border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    amber:
      'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    emerald:
      'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    indigo:
      'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
  };
  const iconTone = {
    rose: 'text-rose-500 dark:text-rose-400',
    amber: 'text-amber-500 dark:text-amber-400',
    emerald: 'text-emerald-500 dark:text-emerald-400',
    indigo: 'text-indigo-500 dark:text-indigo-400',
  };
  return (
    <div
      className={`flex gap-3 items-start rounded-2xl border px-4 py-3.5 ${tones[tone] || tones.rose} ${className}`}
    >
      {Icon && <Icon size={18} className={`${iconTone[tone] || iconTone.rose} shrink-0 mt-0.5`} />}
      <div className="min-w-0">
        {title && <p className="text-sm font-bold">{title}</p>}
        {children && (
          <div className={`text-sm mt-0.5 opacity-90 ${title ? '' : ''}`}>{children}</div>
        )}
      </div>
    </div>
  );
}

/* ── Search field ───────────────────────────────────────────── */
export function SearchField({
  value,
  onChange,
  placeholder = 'Search…',
  label,
  className = '',
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && <label className={labelClass}>{label}</label>}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${fieldClass} pl-10 pr-4`}
        />
      </div>
    </div>
  );
}

export function SelectField({ label, value, onChange, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className={labelClass}>{label}</label>}
      <select value={value} onChange={onChange} className={fieldClass}>
        {children}
      </select>
    </div>
  );
}

/* ── Table helpers ──────────────────────────────────────────── */
export function DataTable({ children, minWidth = '800px', className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead>
      <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, className = '' }) {
  return <th className={`${thClass} ${className}`}>{children}</th>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>;
}

export function Tr({ children, className = '', ...rest }) {
  return (
    <tr
      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableEmpty({ icon: Icon, title, subtitle, colSpan = 6 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        {Icon && <Icon size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />}
        <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        {subtitle && (
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">{subtitle}</p>
        )}
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5, colSpan = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i}>
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      </td>
    </tr>
  ));
}

export function TableFooter({ children }) {
  return (
    <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/30">
      {children}
    </div>
  );
}

/* ── Loading / empty ────────────────────────────────────────── */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-spin" />
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="py-14 text-center px-4">
      {Icon && <Icon size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />}
      <p className="text-slate-500 dark:text-slate-400 font-medium">{title}</p>
      {subtitle && (
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm mx-auto">
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ── Status / role badges ───────────────────────────────────── */
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
        active
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
          : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700/50'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function SoftBadge({ children, color = 'slate', className = '' }) {
  const map = {
    slate:
      'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    indigo:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700/50',
    amber:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50',
    emerald:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700/50',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700/50',
    orange:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700/50',
    violet:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-700/50',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-700/50',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${map[color] || map.slate} ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Tabs ───────────────────────────────────────────────────── */
export function PillTabs({ tabs, value, onChange, counts }) {
  return (
    <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
      {tabs.map((tab) => {
        const key = typeof tab === 'string' ? tab : tab.key;
        const label = typeof tab === 'string' ? tab : tab.label;
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              active
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {label}
            {counts && counts[key] != null && key !== 'All' && key !== 'all' && (
              <span className="ml-1.5 opacity-70">({counts[key]})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Primary action button ──────────────────────────────────── */
export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`${btnPrimaryClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button type="button" className={`${btnSecondaryClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
