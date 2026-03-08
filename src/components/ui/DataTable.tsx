'use client';

import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data, columns, onRowClick, searchable = true, searchPlaceholder = 'Search...', emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row => columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortDir, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder}
          className="w-full max-w-sm px-4 py-2 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50" />
      )}
      <div className="overflow-x-auto rounded-xl border border-[#1a1a24]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#12121a] text-zinc-400 text-left">
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 font-medium ${col.sortable !== false ? 'cursor-pointer hover:text-white select-none' : ''}`}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}>
                  {col.label} {sortKey === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a24]">
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500">{emptyMessage}</td></tr>
            ) : filtered.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)} className={`bg-[#0a0a0f] hover:bg-[#12121a] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-zinc-300">
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
