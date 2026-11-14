import { useCallback, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

export type BadgeQrScanStatus = 'idle' | 'scanning' | 'error' | 'processing' | 'success';

interface UseBadgeQrScannerOptions {
  isActive: boolean;
  onScan: (rawText: string) => void | Promise<void>;
  onCameraError?: (message: string) => void;
}

/**
 * Camera + jsQR loop for badge check-in modals.
 */
export function useBadgeQrScanner({
  isActive,
  onScan,
  onCameraError,
}: UseBadgeQrScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastProcessedRef = useRef<string | null>(null);

  const resetProcessed = useCallback(() => {
    lastProcessedRef.current = null;
  }, []);

  const handleDecoded = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || text === lastProcessedRef.current) return;
      lastProcessedRef.current = text;
      await onScan(text);
    },
    [onScan]
  );

  useEffect(() => {
    if (!isActive) {
      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onCameraError?.('Unable to access canvas for QR scanning.');
          return;
        }

        scanIntervalRef.current = window.setInterval(() => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code?.data) void handleDecoded(code.data);
          } catch {
            /* decode loop */
          }
        }, 500);
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError') {
          onCameraError?.('Camera access was denied. Please allow camera permissions.');
        } else if (name === 'NotFoundError') {
          onCameraError?.('No camera device was found.');
        } else {
          onCameraError?.('Unable to access the camera.');
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, handleDecoded, onCameraError]);

  return { videoRef, resetProcessed };
}
