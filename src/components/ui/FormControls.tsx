"use client";

import { type ReactNode } from "react";
import { Search, X } from "lucide-react";

// ─── SearchInput ────────────────────────────────────
type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({ value, onChange, placeholder = "Buscar...", className = "" }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── FilterSelect ────────────────────────────────────
type FilterOption = { value: string; label: string };

type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel?: string;
  className?: string;
};

export function FilterSelect({ value, onChange, options, allLabel = "Todos", className = "" }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-sm rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500 bg-white ${className}`}
    >
      <option value="">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── EmptyState ────────────────────────────────────
type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="p-12 text-center text-gray-500">
      <div className="mx-auto w-12 h-12 text-gray-300 mb-4 flex items-center justify-center">{icon}</div>
      <p className="text-lg font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── SubmitButton ────────────────────────────────────
type SubmitButtonProps = {
  children: ReactNode;
  pending?: boolean;
  className?: string;
};

export function SubmitButton({ children, pending, className = "" }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {pending ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Guardando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
