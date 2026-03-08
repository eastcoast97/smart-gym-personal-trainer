'use client';

import React, { useState, KeyboardEvent } from 'react';

interface ListInputProps {
  label: string;
  name: string;
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
}

/**
 * ListInput — tag-style input for array fields.
 * Press Enter or comma to add a value; click × to remove.
 * Serializes to a JSON string when used in a regular <form> via a hidden input.
 */
export default function ListInput({ label, name, value, onChange, placeholder = 'Type and press Enter…', required, helpText }: ListInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const trimmed = draft.trim().replace(/,+$/, '');
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(v => v !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Hidden input carries the JSON-serialised array for standard form submissions */}
      <input type="hidden" name={name} value={JSON.stringify(value)} />

      <div className="min-h-[46px] flex flex-wrap gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a24] border border-[#2a2a34] focus-within:ring-2 focus-within:ring-sky-500/50 cursor-text"
        onClick={() => document.getElementById(`list-input-${name}`)?.focus()}>
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-sky-300/60 hover:text-sky-200 leading-none">×</button>
          </span>
        ))}
        <input
          id={`list-input-${name}`}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-white text-sm focus:outline-none placeholder-zinc-600"
        />
      </div>

      {helpText && <p className="mt-1 text-xs text-zinc-500">{helpText}</p>}
    </div>
  );
}
