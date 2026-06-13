'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps<T> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder: string;
  emptyText: string;
  searchFn: (term: string) => Promise<T[]>;
  renderItem: (item: T) => string;
  getKey: (item: T) => number;
  allowClear?: boolean;
  selectedLabel?: string;
}

export function SearchableSelect<T>({
  value,
  onChange,
  placeholder,
  emptyText,
  searchFn,
  renderItem,
  getKey,
  allowClear = true,
  selectedLabel,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [selectedItem, setSelectedItem] = useState<T | undefined>();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!value) {
      setSelectedItem(undefined);
      return;
    }
    if (!open) return;
    const match = results.find((r) => getKey(r) === value);
    if (match) setSelectedItem(match);
  }, [value, results, open, getKey]);

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchFn(term.trim());
      setResults(data);
      setHighlighted(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doSearch]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    onChange(getKey(item));
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItem(undefined);
    onChange(undefined);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[highlighted]) {
      e.preventDefault();
      handleSelect(results[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const triggerText = selectedItem
    ? renderItem(selectedItem)
    : value && selectedLabel
      ? selectedLabel
      : value
        ? `#${value}`
        : placeholder;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50',
          !selectedItem && 'text-muted-foreground',
        )}
      >
        <span className="flex-1 truncate text-left">{triggerText}</span>
        <span className="flex items-center gap-1 shrink-0">
          {allowClear && selectedItem && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="flex items-center justify-center rounded-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown className={cn('size-4 opacity-50 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {loading && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">Buscando...</div>
            )}
            {!loading && !search.trim() && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                Escribe para buscar
              </div>
            )}
            {!loading && search.trim() && results.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText}</div>
            )}
            {!loading && results.map((item, i) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlighted(i)}
                className={cn(
                  'flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-left',
                  highlighted === i ? 'bg-accent text-accent-foreground' : '',
                )}
              >
                {renderItem(item)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
