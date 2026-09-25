import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { CameraView } from './components/CameraView';
import { ScanCard } from './components/ScanCard';
import { EmptyState } from './components/EmptyState';
import { Toolbar } from './components/Toolbar';

export default function App() {
  const {
    permission,
    isScanning,
    isPaused,
    scannedItems,
    availableCameras,
    selectedCameraId,
    flashSuccess,
    videoRef,
    startCamera,
    selectCamera,
    togglePause,
    clearItems,
  } = useBarcodeScanner();

  const [copiedId, setCopiedId] = useState<string>('');
  const shouldReduceMotion = useReducedMotion();

  const handleCopy = useCallback((id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1500);
  }, []);

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: 'easeOut' };

  const screenVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: shouldReduceMotion ? 0 : -8 },
  };

  // ─── Shared card used on start / error screens ────────────────────────────
  const CenteredCard = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-dvh items-center justify-center bg-white p-6 dark:bg-neutral-950">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-8 py-12 text-center shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        {children}
      </div>
    </div>
  );

  // ─── Idle / Start screen ──────────────────────────────────────────────────
  if (permission === 'idle') {
    return (
      <AnimatePresence mode="wait">
        <motion.main
          key="idle"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          <CenteredCard>
            <div className="text-neutral-950 opacity-85 dark:text-neutral-100" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2"  y="6" width="4" height="28" rx="1" fill="currentColor" />
                <rect x="9"  y="6" width="2" height="28" rx="1" fill="currentColor" />
                <rect x="14" y="6" width="4" height="28" rx="1" fill="currentColor" />
                <rect x="21" y="6" width="2" height="28" rx="1" fill="currentColor" />
                <rect x="26" y="6" width="6" height="28" rx="1" fill="currentColor" />
                <rect x="35" y="6" width="3" height="28" rx="1" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight leading-tight text-neutral-950 dark:text-neutral-50">
              Barcode Scanner
            </h1>
            <p className="text-[0.9375rem] text-neutral-600 dark:text-neutral-400 max-w-[280px]">
              Scan UPC, EAN, QR, Code128 and more
            </p>
            <motion.button
              className="mt-2 rounded-xl bg-neutral-950 px-8 py-3 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-100"
              onClick={startCamera}
              autoFocus
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            >
              Start Camera
            </motion.button>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 leading-relaxed max-w-xs">
              Supports: UPC-A · UPC-E · EAN-13 · EAN-8 · Code 128 · Code 39 · Code 93 ·
              Codabar · ITF · QR Code · Data Matrix · Aztec · PDF417
            </p>
          </CenteredCard>
        </motion.main>
      </AnimatePresence>
    );
  }

  // ─── Error states ──────────────────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <AnimatePresence mode="wait">
        <motion.main
          key="denied"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          <CenteredCard>
            <div className="text-4xl" aria-hidden="true">🚫</div>
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
              Camera access required
            </h2>
            <p className="text-[0.9375rem] text-neutral-600 dark:text-neutral-400">
              Camera permission is required to scan codes.
            </p>
            <motion.button
              className="mt-2 rounded-xl bg-neutral-950 px-8 py-3 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus-visible:ring-neutral-100"
              onClick={startCamera}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            >
              Open Camera Again
            </motion.button>
          </CenteredCard>
        </motion.main>
      </AnimatePresence>
    );
  }

  if (permission === 'no-camera') {
    return (
      <AnimatePresence mode="wait">
        <motion.main
          key="no-camera"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          <CenteredCard>
            <div className="text-4xl" aria-hidden="true">📷</div>
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
              No camera detected
            </h2>
            <p className="text-[0.9375rem] text-neutral-600 dark:text-neutral-400">
              No camera device detected.
            </p>
          </CenteredCard>
        </motion.main>
      </AnimatePresence>
    );
  }

  if (permission === 'unsupported') {
    return (
      <AnimatePresence mode="wait">
        <motion.main
          key="unsupported"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transition}
        >
          <CenteredCard>
            <div className="text-4xl" aria-hidden="true">⚠️</div>
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-neutral-50">
              Browser not supported
            </h2>
            <p className="text-[0.9375rem] text-neutral-600 dark:text-neutral-400">
              Your browser does not support camera access.
            </p>
          </CenteredCard>
        </motion.main>
      </AnimatePresence>
    );
  }

  // ─── Scanning UI ──────────────────────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="scanning"
        className="flex min-h-dvh flex-col bg-white dark:bg-neutral-950"
        variants={screenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
      >
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-white px-5 py-3.5 dark:border-neutral-800 dark:bg-neutral-950">
          <h1 className="flex-1 text-base font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
            Barcode Scanner
          </h1>

          {!isScanning && (
            <span
              className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              aria-live="polite"
            >
              Starting…
            </span>
          )}
          {isScanning && !isPaused && (
            <span
              className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-400"
              aria-live="polite"
            >
              ● Live
            </span>
          )}
          {isScanning && isPaused && (
            <span
              className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              aria-live="polite"
            >
              ⏸ Paused
            </span>
          )}
        </header>

        {/* Main layout */}
        <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col md:flex-row md:items-start md:gap-6 md:px-5 md:py-6">
          {/* Camera column — sticky on md+ */}
          <section
            className="w-full shrink-0 md:w-[400px] md:sticky md:top-[65px] lg:w-[460px]"
            aria-label="Camera preview"
          >
            <CameraView
              videoRef={videoRef}
              availableCameras={availableCameras}
              selectedCameraId={selectedCameraId}
              flashSuccess={flashSuccess}
              isPaused={isPaused}
              onSelectCamera={selectCamera}
            />
          </section>

          {/* Results column */}
          <section
            className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-0"
            aria-label="Scan results"
          >
            <Toolbar
              isPaused={isPaused}
              itemCount={scannedItems.length}
              items={scannedItems}
              onTogglePause={togglePause}
              onClearAll={clearItems}
            />

            <div role="list" aria-label="Scanned barcodes" className="flex flex-col gap-2.5">
              {scannedItems.length === 0 ? (
                <EmptyState />
              ) : (
                scannedItems.map((item) => (
                  <div key={item.id} role="listitem">
                    <ScanCard
                      item={item}
                      isCopied={copiedId === item.id}
                      onCopy={handleCopy}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </motion.div>
    </AnimatePresence>
  );
}
