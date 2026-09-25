import { motion, useReducedMotion } from 'motion/react';
import type { ScanItem } from '../types/scanner';
import { exportCsv } from '../utils/exportCsv';

interface ToolbarProps {
  isPaused: boolean;
  itemCount: number;
  items: ScanItem[];
  onTogglePause: () => void;
  onClearAll: () => void;
}

export function Toolbar({ isPaused, itemCount, items, onTogglePause, onClearAll }: ToolbarProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleExport = () => {
    if (items.length === 0) return;
    exportCsv(items);
  };

  const tapProps = shouldReduceMotion ? {} : { whileTap: { scale: 0.95 } };

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 max-sm:flex-col max-sm:items-start"
      role="toolbar"
      aria-label="Scan controls"
    >
      {/* Title + count badge */}
      <h2 className="flex items-center gap-2 text-[0.9375rem] font-semibold text-neutral-950 dark:text-neutral-50">
        Scanned Items
        {itemCount > 0 && (
          <motion.span
            className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-neutral-950 px-1.5 text-xs font-bold text-white dark:bg-neutral-100 dark:text-neutral-950"
            aria-label={`${itemCount} items`}
            layout={!shouldReduceMotion}
          >
            {itemCount}
          </motion.span>
        )}
      </h2>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 max-sm:w-full">
        {/* Pause / Resume */}
        <motion.button
          className="flex-1 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-neutral-950 transition-colors hover:border-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-100 sm:flex-none"
          onClick={onTogglePause}
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Resume scanning' : 'Pause scanning'}
          {...tapProps}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </motion.button>

        {/* Export CSV */}
        <motion.button
          className="flex-1 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-neutral-950 transition-colors hover:border-neutral-300 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-100 sm:flex-none"
          onClick={handleExport}
          disabled={itemCount === 0}
          aria-label="Export scanned items as CSV"
          {...tapProps}
        >
          ↓ Export CSV
        </motion.button>

        {/* Clear All — red-tinted danger style */}
        <motion.button
          className="flex-1 whitespace-nowrap rounded-lg border border-red-300 bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-red-700 transition-colors hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-red-800 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 dark:focus-visible:ring-neutral-100 sm:flex-none"
          onClick={onClearAll}
          disabled={itemCount === 0}
          aria-label="Clear all scanned items"
          {...tapProps}
        >
          ✕ Clear All
        </motion.button>
      </div>
    </div>
  );
}
