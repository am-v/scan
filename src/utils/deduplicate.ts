/**
 * Tracks recently detected barcode values to prevent duplicate entries.
 * If the same value+format combination is seen within `windowMs` milliseconds,
 * it is considered a duplicate.
 */
export class DeduplicateCache {
  private readonly cache = new Map<string, number>();
  private readonly windowMs: number;

  constructor(windowMs = 3000) {
    this.windowMs = windowMs;
  }

  /**
   * Returns true if this value+format combination is a duplicate (seen recently).
   * Otherwise records it and returns false.
   */
  isDuplicate(value: string, format: string): boolean {
    const key = `${format}::${value}`;
    const now = Date.now();
    const last = this.cache.get(key);
    if (last !== undefined && now - last < this.windowMs) {
      return true;
    }
    this.cache.set(key, now);
    this.prune(now);
    return false;
  }

  private prune(now: number): void {
    for (const [key, ts] of this.cache.entries()) {
      if (now - ts >= this.windowMs * 2) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
