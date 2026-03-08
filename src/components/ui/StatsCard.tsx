'use client';

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, change, changeType = 'neutral', icon }: StatsCardProps) {
  const changeColor = changeType === 'positive' ? 'text-emerald-400' : changeType === 'negative' ? 'text-red-400' : 'text-zinc-400';
  return (
    <div className="p-6 rounded-2xl bg-[#12121a] border border-[#1a1a24] hover:border-[#2a2a34] transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {change && <span className={`text-sm ${changeColor}`}>{change}</span>}
    </div>
  );
}
