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
  const handleExport = () => {
    if (items.length === 0) return;
    exportCsv(items);
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Scan controls">
      <h2 className="results-title">
        Scanned Items
        {itemCount > 0 && (
          <span className="item-count" aria-label={`${itemCount} items`}>
            {itemCount}
          </span>
        )}
      </h2>
      <div className="toolbar-actions">
        <button
          className="toolbar-btn"
          onClick={onTogglePause}
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Resume scanning' : 'Pause scanning'}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          className="toolbar-btn"
          onClick={handleExport}
          disabled={itemCount === 0}
          aria-label="Export scanned items as CSV"
        >
          ↓ Export CSV
        </button>
        <button
          className="toolbar-btn toolbar-btn--danger"
          onClick={onClearAll}
          disabled={itemCount === 0}
          aria-label="Clear all scanned items"
        >
          ✕ Clear All
        </button>
      </div>
    </div>
  );
}
