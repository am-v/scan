import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MultiFormatReader,
  BinaryBitmap,
  RGBLuminanceSource,
  HybridBinarizer,
  DecodeHintType,
  BarcodeFormat,
  NotFoundException,
} from '@zxing/library';
import type { CameraPermission, ScanItem } from '../types/scanner';
import { DeduplicateCache } from '../utils/deduplicate';
import { useBeep } from './useBeep';

export interface CodePoint { x: number; y: number }

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

const hints = new Map<DecodeHintType, unknown>();
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
  resultPoints: CodePoint[] | null;
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
  const [resultPoints, setResultPoints] = useState<CodePoint[] | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<MultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dedupeRef = useRef(new DeduplicateCache(3000));
  const isPausedRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctx2dRef = useRef<CanvasRenderingContext2D | null>(null);
  const resultClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOverlayUpdateRef = useRef(0);

  const beep = useBeep();

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (resultClearTimerRef.current) clearTimeout(resultClearTimerRef.current);
    setResultPoints(null);
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
        const r = new MultiFormatReader();
        r.setHints(hints);
        readerRef.current = r;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        ctx2dRef.current = canvasRef.current.getContext('2d', {
          willReadFrequently: true,
        });
      }

      const canvas = canvasRef.current;
      const ctx2d = ctx2dRef.current;
      const reader = readerRef.current;

      const tick = () => {
        if (isPausedRef.current || video.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        canvas.width = w;
        canvas.height = h;
        ctx2d?.drawImage(video, 0, 0, w, h);

        try {
          // RGBLuminanceSource is more reliable than HTMLCanvasElementLuminanceSource
          // especially for QR codes — we read raw RGBA pixel data and pack into Int32 ARGB.
          const imageData = ctx2d!.getImageData(0, 0, w, h);
          const rgba = imageData.data;
          const pixelCount = w * h;
          const int32 = new Int32Array(pixelCount);
          for (let i = 0; i < pixelCount; i++) {
            const r = rgba[i * 4];
            const g = rgba[i * 4 + 1];
            const b = rgba[i * 4 + 2];
            // Pack as 0xFFRRGGBB (ZXing ARGB int32)
            int32[i] = (0xFF000000 | (r << 16) | (g << 8) | b) | 0;
          }
          const luminanceSource = new RGBLuminanceSource(int32, w, h);
          const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

          // reset() clears internal reader state between frames — required for
          // reliable multi-format detection, especially QR codes.
          reader.reset();
          const result = reader.decode(binaryBitmap);

          const value = result.getText();
          const format = BarcodeFormat[result.getBarcodeFormat()] ?? 'Unknown';

          // Update bounding box overlay (throttled to avoid excessive re-renders)
          const pts = result.getResultPoints();
          const now = Date.now();
          if (pts?.length && now - lastOverlayUpdateRef.current > 150) {
            lastOverlayUpdateRef.current = now;
            setResultPoints(pts.map((p) => ({ x: p.getX(), y: p.getY() })));
            if (resultClearTimerRef.current) clearTimeout(resultClearTimerRef.current);
            resultClearTimerRef.current = setTimeout(() => setResultPoints(null), 1000);
          }

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
          // NotFoundException is normal — no barcode visible in this frame.
          // Other errors (ChecksumException, FormatException) are transient — suppress.
          if (!(e instanceof NotFoundException)) {
            // intentionally suppressed
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
      const initialStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');

      if (cameras.length === 0) {
        initialStream.getTracks().forEach((t) => t.stop());
        setPermission('no-camera');
        return;
      }

      setAvailableCameras(cameras);
      setPermission('granted');

      const rearCamera = cameras.find(
        (c) =>
          /back|rear|environment/i.test(c.label) &&
          !/ultra|wide|tele/i.test(c.label)
      );
      const preferred = rearCamera ?? cameras[0];
      const preferredId = preferred?.deviceId ?? '';
      setSelectedCameraId(preferredId);

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
    resultPoints,
    videoRef,
    startCamera,
    selectCamera,
    togglePause,
    clearItems,
  };
}
