import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';

export function EmptyState() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center text-neutral-500 dark:text-neutral-500"
      aria-label="No scanned items"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2, duration: 0.3 }}
    >
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? {}
            : { opacity: [0.2, 0.35, 0.2] }
        }
        transition={
          shouldReduceMotion
            ? {}
            : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
        }
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Barcode icon */}
          <rect x="4"  y="10" width="4" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="11" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="16" y="10" width="4" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="23" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="28" y="10" width="6" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="37" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="42" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
        </svg>
      </motion.div>

      <p className="text-[0.9375rem] font-semibold text-neutral-600 dark:text-neutral-400">
        No codes scanned yet
      </p>
      <p className="max-w-[240px] text-sm text-neutral-500 dark:text-neutral-500">
        Point your camera at any supported barcode.
      </p>
    </motion.div>
  );
}
