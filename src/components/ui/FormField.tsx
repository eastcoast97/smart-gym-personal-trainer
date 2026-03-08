'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  error?: string;
}

export default function FormField({ label, name, type = 'text', value, onChange, placeholder, required, options, error }: FormFieldProps) {
  const inputClasses = 'w-full px-4 py-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50';

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-400 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
          rows={4} className={inputClasses} />
      ) : type === 'select' ? (
        <select id={name} name={name} value={value} onChange={onChange} required={required} className={inputClasses}>
          <option value="">Select...</option>
          {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input id={name} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
          className={inputClasses} />
      )}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
