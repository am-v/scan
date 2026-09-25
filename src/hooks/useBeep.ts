import { useCallback, useRef } from 'react';

/**
 * Returns a `beep()` function that plays a short professional beep
 * using the Web Audio API. No external files required.
 */
export function useBeep() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      // Resume if suspended (autoplay policy)
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1046, ctx.currentTime); // C6
      oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available; silently ignore
    }
  }, []);

  return beep;
}
