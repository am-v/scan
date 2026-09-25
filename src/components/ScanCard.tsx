import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { ScanItem } from '../types/scanner';
import { formatTime } from '../utils/time';

interface ScanCardProps {
  item: ScanItem;
  isCopied: boolean;
  onCopy: (id: string) => void;
}

export function ScanCard({ item, isCopied, onCopy }: ScanCardProps) {
  const [localCopied, setLocalCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.value);
      setLocalCopied(true);
      onCopy(item.id);
      setTimeout(() => setLocalCopied(false), 1500);
    } catch {
      // Fallback: select the text
    }
  }, [item.id, item.value, onCopy]);

  const copied = isCopied || localCopied;

  const cardTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 30 };

  return (
    <motion.article
      className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      aria-label={`Scanned ${item.format}: ${item.value}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={cardTransition}
      layout
    >
      {/* Header: format badge + timestamp */}
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-neutral-950 px-2 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-white dark:bg-neutral-100 dark:text-neutral-950">
          {item.format}
        </span>
        <time
          className="font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-500"
          dateTime={item.timestamp.toISOString()}
        >
          {formatTime(item.timestamp)}
        </time>
      </div>

      {/* Value */}
      <p
        className="break-all font-mono text-base font-medium leading-snug text-neutral-950 select-text dark:text-neutral-50"
        title={item.value}
      >
        {item.value}
      </p>

      {/* Footer: copy button */}
      <div className="flex justify-end">
        <motion.button
          className={[
            'rounded-lg border px-3 py-1 text-[0.8125rem] font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100',
            copied
              ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400'
              : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-950 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-50',
          ].join(' ')}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : `Copy ${item.value} to clipboard`}
          whileTap={shouldReduceMotion ? {} : { scale: 0.93 }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.12 }}
              >
                ✓ Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.12 }}
              >
                📋 Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.article>
  );
}
