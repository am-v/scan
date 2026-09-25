import { useState, useCallback } from 'react';
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

  const handleCopy = useCallback((id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1500);
  }, []);

  // ─── Idle / Start screen ──────────────────────────────────────────────────
  if (permission === 'idle') {
    return (
      <div className="app">
        <main className="start-screen">
          <div className="start-card">
            <div className="logo-mark" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="4" height="28" rx="1" fill="currentColor" />
                <rect x="9" y="6" width="2" height="28" rx="1" fill="currentColor" />
                <rect x="14" y="6" width="4" height="28" rx="1" fill="currentColor" />
                <rect x="21" y="6" width="2" height="28" rx="1" fill="currentColor" />
                <rect x="26" y="6" width="6" height="28" rx="1" fill="currentColor" />
                <rect x="35" y="6" width="3" height="28" rx="1" fill="currentColor" />
              </svg>
            </div>
            <h1 className="app-title">Barcode Scanner</h1>
            <p className="app-subtitle">Scan UPC, EAN, QR, Code128 and more</p>
            <button className="start-btn" onClick={startCamera} autoFocus>
              Start Camera
            </button>
            <p className="supported-formats">
              Supports: UPC-A · UPC-E · EAN-13 · EAN-8 · Code 128 · Code 39 · Code 93 ·
              Codabar · ITF · QR Code · Data Matrix · Aztec · PDF417
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ─── Error states ──────────────────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <div className="app">
        <main className="error-screen">
          <div className="error-card">
            <div className="error-icon" aria-hidden="true">🚫</div>
            <h2 className="error-title">Camera access required</h2>
            <p className="error-msg">Camera permission is required to scan codes.</p>
            <button className="start-btn" onClick={startCamera}>
              Open Camera Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (permission === 'no-camera') {
    return (
      <div className="app">
        <main className="error-screen">
          <div className="error-card">
            <div className="error-icon" aria-hidden="true">📷</div>
            <h2 className="error-title">No camera detected</h2>
            <p className="error-msg">No camera device detected.</p>
          </div>
        </main>
      </div>
    );
  }

  if (permission === 'unsupported') {
    return (
      <div className="app">
        <main className="error-screen">
          <div className="error-card">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h2 className="error-title">Browser not supported</h2>
            <p className="error-msg">Your browser does not support camera access.</p>
          </div>
        </main>
      </div>
    );
  }

  // ─── Scanning UI ──────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title-sm">Barcode Scanner</h1>
        {!isScanning && (
          <span className="status-badge status-badge--loading" aria-live="polite">
            Starting…
          </span>
        )}
        {isScanning && !isPaused && (
          <span className="status-badge status-badge--active" aria-live="polite">
            ● Live
          </span>
        )}
        {isScanning && isPaused && (
          <span className="status-badge status-badge--paused" aria-live="polite">
            ⏸ Paused
          </span>
        )}
      </header>

      <main className="scanner-layout">
        <section className="camera-col" aria-label="Camera preview">
          <CameraView
            videoRef={videoRef}
            availableCameras={availableCameras}
            selectedCameraId={selectedCameraId}
            flashSuccess={flashSuccess}
            isPaused={isPaused}
            onSelectCamera={selectCamera}
          />
        </section>

        <section className="results-col" aria-label="Scan results">
          <Toolbar
            isPaused={isPaused}
            itemCount={scannedItems.length}
            items={scannedItems}
            onTogglePause={togglePause}
            onClearAll={clearItems}
          />

          <div className="results-list" role="list" aria-label="Scanned barcodes">
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
    </div>
  );
}
