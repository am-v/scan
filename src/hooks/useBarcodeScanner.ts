import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserMultiFormatReader,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from '@zxing/library';
import type { CameraPermission, ScanItem } from '../types/scanner';
import { DeduplicateCache } from '../utils/deduplicate';
import { useBeep } from './useBeep';

const SUPPORTED_FORMATS = [
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODABAR,
  BarcodeFormat.ITF,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.PDF_417,
];

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
hints.set(DecodeHintType.TRY_HARDER, true);

export interface UseBarcodeScanner {
  permission: CameraPermission;
  isScanning: boolean;
  isPaused: boolean;
  scannedItems: ScanItem[];
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
  flashSuccess: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  selectCamera: (deviceId: string) => void;
  togglePause: () => void;
  clearItems: () => void;
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const [permission, setPermission] = useState<CameraPermission>('idle');
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScanItem[]>([]);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [flashSuccess, setFlashSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dedupeRef = useRef(new DeduplicateCache(3000));
  const isPausedRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const beep = useBeep();

  // Sync isPaused state → ref for use inside rAF loop
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const flashBorder = useCallback(() => {
    setFlashSuccess(true);
    setTimeout(() => setFlashSuccess(false), 400);
  }, []);

  const startScanning = useCallback(
    (stream: MediaStream) => {
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      void video.play();

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader(hints);
      }

      // Lazy-create offscreen canvas for decoding
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      const ctx2d = canvas.getContext('2d', { willReadFrequently: true });

      const tick = () => {
        if (isPausedRef.current || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx2d?.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const result = readerRef.current!.decodeFromCanvas(canvas);
          const value = result.getText();
          const format = BarcodeFormat[result.getBarcodeFormat()] ?? 'Unknown';

          if (!dedupeRef.current.isDuplicate(value, format)) {
            const item: ScanItem = {
              id: crypto.randomUUID(),
              value,
              format,
              timestamp: new Date(),
            };
            setScannedItems((prev) => [item, ...prev]);
            beep();
            flashBorder();
          }
        } catch (e) {
          // NotFoundException is expected when no barcode in frame
          if (!(e instanceof NotFoundException)) {
            // suppress other decode errors
          }
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      video.onloadedmetadata = () => {
        animFrameRef.current = requestAnimationFrame(tick);
        setIsScanning(true);
      };
    },
    [beep, flashBorder]
  );

  const openStream = useCallback(
    async (deviceId?: string) => {
      stopStream();

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      startScanning(stream);
    },
    [stopStream, startScanning]
  );

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission('unsupported');
      return;
    }

    try {
      // First, request with environment facing to trigger permission prompt
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      // Enumerate cameras once we have permission
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');

      if (cameras.length === 0) {
        initialStream.getTracks().forEach((t) => t.stop());
        setPermission('no-camera');
        return;
      }

      setAvailableCameras(cameras);
      setPermission('granted');

      // Prefer rear camera on mobile
      const rearCamera = cameras.find(
        (c) =>
          /back|rear|environment/i.test(c.label) && !/ultra|wide|tele/i.test(c.label)
      );
      const preferred = rearCamera ?? cameras[0];
      const preferredId = preferred?.deviceId ?? '';
      setSelectedCameraId(preferredId);

      // Stop the initial stream and open with preferred camera
      initialStream.getTracks().forEach((t) => t.stop());
      await openStream(preferredId || undefined);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermission('denied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setPermission('no-camera');
        } else {
          setPermission('denied');
        }
      }
    }
  }, [openStream]);

  const selectCamera = useCallback(
    (deviceId: string) => {
      setSelectedCameraId(deviceId);
      setIsScanning(false);
      void openStream(deviceId);
    },
    [openStream]
  );

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const clearItems = useCallback(() => {
    setScannedItems([]);
    dedupeRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    permission,
    isScanning,
    isPaused,
    scannedItems,
    availableCameras,
    selectedCameraId,
    flashSuccess,
    videoRef,
    startCamera,
    selectCamera,
    togglePause,
    clearItems,
  };
}
