import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
  flashSuccess: boolean;
  isPaused: boolean;
  onSelectCamera: (id: string) => void;
}

export function CameraView({
  videoRef,
  availableCameras,
  selectedCameraId,
  flashSuccess,
  isPaused,
  onSelectCamera,
}: CameraViewProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-2.5 p-4 md:p-0">
      {/* Video wrapper with Motion-driven flash success border */}
      <motion.div
        className="relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-black shadow-sm aspect-video dark:border-neutral-800"
        animate={
          shouldReduceMotion
            ? {}
            : flashSuccess
            ? {
                borderColor: 'rgb(34 197 94)',
                boxShadow: '0 0 0 3px rgba(34,197,94,0.4)',
              }
            : {
                borderColor: '',   // reset to CSS-controlled value
                boxShadow: 'none',
              }
        }
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="block h-full w-full object-cover"
          muted
          playsInline
          aria-label="Camera preview"
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

        {/* Animated scan line */}
        <div
          className="scan-line pointer-events-none absolute left-0 right-0 h-0.5"
          style={{
            background:
              'linear-gradient(to right, transparent 0%, rgba(34,197,94,0.6) 20%, rgba(34,197,94,0.9) 50%, rgba(34,197,94,0.6) 80%, transparent 100%)',
          }}
          aria-hidden="true"
        />
      </motion.div>

      {/* Camera selector */}
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
