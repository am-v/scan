export type CameraPermission = 'idle' | 'granted' | 'denied' | 'no-camera' | 'unsupported';

export type ScanItem = {
  id: string;
  value: string;
  format: string;
  timestamp: Date;
};
