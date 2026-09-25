import { useState, useCallback } from 'react';
import type { ScanItem } from '../types/scanner';
import { formatTime } from '../utils/time';

interface ScanCardProps {
  item: ScanItem;
  isCopied: boolean;
  onCopy: (id: string) => void;
}

export function ScanCard({ item, isCopied, onCopy }: ScanCardProps) {
  const [localCopied, setLocalCopied] = useState(false);

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

  return (
    <article className="scan-card" aria-label={`Scanned ${item.format}: ${item.value}`}>
      <div className="scan-card-header">
        <span className="format-badge">{item.format}</span>
        <time className="scan-time" dateTime={item.timestamp.toISOString()}>
          {formatTime(item.timestamp)}
        </time>
      </div>
      <p className="scan-value" title={item.value}>
        {item.value}
      </p>
      <div className="scan-card-footer">
        <button
          className={`copy-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : `Copy ${item.value} to clipboard`}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
    </article>
  );
}
