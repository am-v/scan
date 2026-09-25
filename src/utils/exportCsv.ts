import type { ScanItem } from '../types/scanner';
import { formatISO } from './time';

/**
 * Generates and triggers download of a CSV file from scanned items.
 * Columns: timestamp, format, value
 */
export function exportCsv(items: ScanItem[]): void {
  const header = 'timestamp,format,value';
  const rows = items.map((item) => {
    const ts = formatISO(item.timestamp);
    const fmt = item.format.replace(/,/g, ' ');
    const val = item.value.includes(',') ? `"${item.value.replace(/"/g, '""')}"` : item.value;
    return `${ts},${fmt},${val}`;
  });

  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `barcode-scan-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
