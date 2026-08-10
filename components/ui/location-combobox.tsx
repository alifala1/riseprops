'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Property } from '@/types';
import { getRankedLocations } from '@/lib/locationUtils';
import { clsx } from 'clsx';

interface LocationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  existingProperties?: Property[];
  inputBase: string;
}

export default function LocationCombobox({
  value,
  onChange,
  existingProperties = [],
  inputBase,
}: LocationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute top 8 ranked locations matching input
  const suggestions = useMemo(() => {
    return getRankedLocations(existingProperties, value, 8);
  }, [existingProperties, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Type or select location..."
        className={inputBase}
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-56 overflow-y-auto py-1">
          {suggestions.map((loc) => {
            const isSelected = loc.toLowerCase() === value.trim().toLowerCase();
            return (
              <button
                key={loc}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur before click registers
                  onChange(loc);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full text-left px-3.5 py-2 text-sm transition-colors duration-150 flex items-center justify-between cursor-pointer',
                  isSelected
                    ? 'bg-brand-gold/15 text-brand-gold font-semibold'
                    : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <span>{loc}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
