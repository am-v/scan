import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { CodePoint } from '../hooks/useBarcodeScanner';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
  flashSuccess: boolean;
  isPaused: boolean;
  resultPoints: CodePoint[] | null;
  onSelectCamera: (id: string) => void;
}

/** Tailwind red-500 */
const RED = '#ef4444';
const RED_FILL = 'rgba(239,68,68,0.08)';
const CORNER_LEN = 14;
const PAD = 10;

/**
 * Draw a bounding-box with corner brackets around the detected code points.
 * Points are in video pixel space; we transform them to canvas (CSS) space
 * to account for the object-cover scaling.
 */
function drawOverlay(
  overlay: HTMLCanvasElement,
  video: HTMLVideoElement,
  pts: CodePoint[]
) {
  const ctx = overlay.getContext('2d');
  if (!ctx) return;

  // Match canvas to its CSS display size
  overlay.width = overlay.clientWidth;
  overlay.height = overlay.clientHeight;
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  if (!video.videoWidth || !video.videoHeight || pts.length < 2) return;

  // Compute the object-cover transform from video → canvas coordinates
  const scaleX = overlay.width / video.videoWidth;
  const scaleY = overlay.height / video.videoHeight;
  const scale = Math.max(scaleX, scaleY);
  const ox = (overlay.width - video.videoWidth * scale) / 2;
  const oy = (overlay.height - video.videoHeight * scale) / 2;

  const cx = (x: number) => x * scale + ox;
  const cy = (y: number) => y * scale + oy;

  const xs = pts.map((p) => cx(p.x));
  const ys = pts.map((p) => cy(p.y));
  const minX = Math.min(...xs) - PAD;
  const minY = Math.min(...ys) - PAD;
  const maxX = Math.max(...xs) + PAD;
  const maxY = Math.max(...ys) + PAD;
  const w = maxX - minX;
  const h = maxY - minY;

  // Semi-transparent fill
  ctx.fillStyle = RED_FILL;
  ctx.beginPath();
  ctx.roundRect(minX, minY, w, h, 4);
  ctx.fill();

  // Solid border
  ctx.strokeStyle = RED;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(minX, minY, w, h, 4);
  ctx.stroke();

  // Corner brackets (thicker)
  ctx.strokeStyle = RED;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const corners: [number, number, number, number, number, number][] = [
    // [startX, startY, cornerX, cornerY, endX, endY]
    [minX, minY + CORNER_LEN, minX, minY, minX + CORNER_LEN, minY],           // TL
    [maxX - CORNER_LEN, minY, maxX, minY, maxX, minY + CORNER_LEN],           // TR
    [maxX, maxY - CORNER_LEN, maxX, maxY, maxX - CORNER_LEN, maxY],           // BR
    [minX + CORNER_LEN, maxY, minX, maxY, minX, maxY - CORNER_LEN],           // BL
  ];

  for (const [x1, y1, cx2, cy2, x2, y2] of corners) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx2, cy2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

export function CameraView({
  videoRef,
  availableCameras,
  selectedCameraId,
  flashSuccess,
  isPaused,
  resultPoints,
  onSelectCamera,
}: CameraViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Redraw the bounding-box overlay whenever resultPoints changes
  useEffect(() => {
    const overlay = overlayRef.current;
    const video = videoRef.current;

    if (!overlay) return;

    if (!resultPoints || !video) {
      const ctx = overlay.getContext('2d');
      ctx?.clearRect(0, 0, overlay.width, overlay.height);
      return;
    }

    drawOverlay(overlay, video, resultPoints);
  }, [resultPoints, videoRef]);

  // Also redraw when the container resizes
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const ro = new ResizeObserver(() => {
      const overlay = overlayRef.current;
      const video = videoRef.current;
      if (!overlay || !video || !resultPoints) return;
      drawOverlay(overlay, video, resultPoints);
    });

    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [resultPoints, videoRef]);

  return (
    <div className="flex flex-col gap-2.5 p-4 md:p-0">
      {/* Video wrapper — Motion drives the flash success border */}
      <motion.div
        ref={wrapperRef}
        className="relative w-full aspect-video overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-sm dark:border-neutral-800"
        animate={
          shouldReduceMotion
            ? {}
            : flashSuccess
            ? { borderColor: RED, boxShadow: `0 0 0 3px rgba(239,68,68,0.35)` }
            : { borderColor: '', boxShadow: 'none' }
        }
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
      >
        {/* Live video feed */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="block h-full w-full object-cover"
          muted
          playsInline
          aria-label="Camera preview"
        />

        {/* Red bounding-box overlay canvas */}
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* Paused overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-sm font-medium text-white backdrop-blur-sm"
              aria-live="polite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
            >
              <span className="text-3xl">⏸</span>
              <span>Scanning paused</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Solid green scan line (replaces the gradient) */}
        <div
          className="scan-line pointer-events-none absolute left-0 right-0 h-0.5 bg-green-500"
          aria-hidden="true"
        />
      </motion.div>

      {/* Camera selector — shown only when multiple cameras available */}
      {availableCameras.length > 1 && (
        <div className="w-full">
          <label htmlFor="camera-select" className="sr-only">
            Select camera
          </label>
          <select
            id="camera-select"
            className="w-full cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 pr-8 text-sm text-neutral-950 transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:border-neutral-600 dark:focus-visible:ring-neutral-100"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
            value={selectedCameraId}
            onChange={(e) => onSelectCamera(e.target.value)}
            aria-label="Select camera"
          >
            {availableCameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
