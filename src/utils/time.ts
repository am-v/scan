/**
 * Formats a Date object to a localized time string HH:MM:SS
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Formats a Date object to ISO 8601 for CSV export
 */
export function formatISO(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
