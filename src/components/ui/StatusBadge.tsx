import React from 'react';

const colorMap: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'in-progress': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'in progress': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  new: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  open: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  contacted: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  proposal: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  negotiation: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function StatusBadge({ status, children }: { status: string; children?: React.ReactNode }) {
  const key = status.toLowerCase();
  const classes = colorMap[key] || colorMap.default;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      {children || status}
    </span>
  );
}
