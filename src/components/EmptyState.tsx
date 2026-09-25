export function EmptyState() {
  return (
    <div className="empty-state" aria-label="No scanned items">
      <div className="empty-icon" aria-hidden="true">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Barcode icon */}
          <rect x="4" y="10" width="4" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="11" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="16" y="10" width="4" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="23" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="28" y="10" width="6" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="37" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
          <rect x="42" y="10" width="2" height="28" rx="1" fill="currentColor" opacity="0.7" />
        </svg>
      </div>
      <p className="empty-title">No codes scanned yet</p>
      <p className="empty-subtitle">Point your camera at any supported barcode.</p>
    </div>
  );
}
