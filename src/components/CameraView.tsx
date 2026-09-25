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
  return (
    <div className="camera-section">
      <div className={`video-wrapper${flashSuccess ? ' flash-success' : ''}`}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="video-preview"
          muted
          playsInline
          aria-label="Camera preview"
        />
        {isPaused && (
          <div className="paused-overlay" aria-live="polite">
            <span className="paused-icon">⏸</span>
            <span>Scanning paused</span>
          </div>
        )}
        <div className="scan-line" aria-hidden="true" />
      </div>

      {availableCameras.length > 1 && (
        <div className="camera-select-wrapper">
          <label htmlFor="camera-select" className="visually-hidden">
            Select camera
          </label>
          <select
            id="camera-select"
            className="camera-select"
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
