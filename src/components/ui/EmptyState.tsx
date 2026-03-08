import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: string;
}

export default function EmptyState({ title, description, action, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-zinc-400 max-w-sm mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}
