import React, { useState, useCallback, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { X, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getBadgeByImageUrl } from '../../../../services/badgeGeneratorService';
import { setCheckinStatus } from '../../../../services/checkinService';
import { useAuth } from '../../../../hooks/useAuth';
import { Event } from '../../../../types';
import { getEvent } from '../../../../services/eventService';

interface BadgerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanStatus = 'idle' | 'scanning' | 'error' | 'checking_in' | 'checked_in';

const Badger: React.FC<BadgerProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string>('');
  const [badgeUrl, setBadgeUrl] = useState<string>('');
  const [eventName, setEventName] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');

  // Keep last successfully processed QR text to avoid duplicate processing
  const lastProcessedValueRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const resetState = () => {
    setScanStatus('idle');
    setError('');
    setBadgeUrl('');
    setEventName('');
    setParticipantName('');
    lastProcessedValueRef.current = null;
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleValidScan = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();

      // Avoid re-processing the exact same value while the modal is open
      if (!text || text === lastProcessedValueRef.current) {
        return;
      }

      // Once we decide to process it, remember it
      lastProcessedValueRef.current = text;

      try {
        setScanStatus('scanning');
        setError('');

        if (!text.startsWith('http')) {
          throw new Error('QR code does not contain a valid URL.');
        }

        setBadgeUrl(text);

        const badge = await getBadgeByImageUrl(text);
        if (!badge) {
          throw new Error('No badge found for this QR code.');
        }

        setParticipantName(badge.participantName);

        let eventTitle = '';
        try {
          const event: Event | null = await getEvent(badge.eventId);
          eventTitle = event?.name || '';
        } catch {
          eventTitle = '';
        }
        setEventName(eventTitle);

        if (!currentUser?.id) {
          throw new Error('You must be logged in to record check-in.');
        }

        setScanStatus('checking_in');

        await setCheckinStatus(
          currentUser.id,
          badge.eventId,
          badge.formSubmissionId,
          'done',
          currentUser.id,
          undefined,
          null,
          'All Days'
        );

        setScanStatus('checked_in');
      } catch (err: any) {
        // Allow a new scan attempt if something went wrong
        lastProcessedValueRef.current = null;
        console.error('Badger scan error:', err);
        setError(err?.message || 'Failed to process QR code.');
        setScanStatus('error');
      }
    },
    [currentUser]
  );

  // Start / stop camera and QR scanning when the modal is open
  useEffect(() => {
    if (!isOpen) {
      // Stop any active stream when modal closes
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

    const startCameraAndScanner = async () => {
      try {
        setError('');
        setScanStatus('idle');

        const constraints: MediaStreamConstraints = {
          video: {
            // Prefer environment/back camera on devices that support it,
            // but fall back gracefully.
            facingMode: { ideal: 'environment' },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            // Ignore play errors; browser may auto-play anyway.
          });
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setError('Unable to access canvas for QR scanning.');
          return;
        }

        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) {
            return;
          }

          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);
            if (code && code.data) {
              handleValidScan(code.data);
            }
          } catch {
            // Ignore decode errors during scanning loop
          }
        }, 500);
      } catch (err: any) {
        console.error('Badger camera error:', err);
        const name = err?.name;
        if (name === 'NotAllowedError') {
          setError('Camera access was denied. Please allow camera permissions and try again.');
        } else if (name === 'NotFoundError') {
          setError('No camera device was found.');
        } else {
          setError('Unable to access the camera. Please check your device settings.');
        }
        setScanStatus('error');
      }
    };

    startCameraAndScanner();

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
  }, [isOpen, handleValidScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Camera size={18} className="text-indigo-600" />
              Badger - QR Check-in
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Point your camera at a participant badge QR code to validate check-in.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto">
          {/* Scanner */}
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-black/80 aspect-[4/3] flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>
            <p className="text-xs text-slate-500">
              Ensure the QR code is well lit and fully visible inside the frame.
            </p>
          </div>

          {/* Result / Status */}
          <div className="space-y-4">
            {/* Status */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
              {scanStatus === 'checked_in' ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : scanStatus === 'error' ? (
                <AlertCircle className="text-red-600" size={20} />
              ) : scanStatus === 'checking_in' ? (
                <Loader2 className="text-indigo-600 animate-spin" size={20} />
              ) : (
                <Camera className="text-slate-500" size={20} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {scanStatus === 'idle' && 'Ready to scan'}
                  {scanStatus === 'scanning' && 'QR code detected. Processing...'}
                  {scanStatus === 'checking_in' && 'Recording check-in...'}
                  {scanStatus === 'checked_in' && 'Check-in recorded successfully.'}
                  {scanStatus === 'error' && 'Unable to process QR code.'}
                </p>
                {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
              </div>
            </div>

            {/* Badge info */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Scan Result
              </h3>
              {badgeUrl ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Event</p>
                    <p className="text-sm text-slate-900">
                      {eventName || <span className="text-slate-400 italic">Unknown event</span>}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Full Name</p>
                    <p className="text-sm text-slate-900">
                      {participantName || <span className="text-slate-400 italic">Unknown participant</span>}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Badge URL</p>
                    <p className="text-[11px] text-slate-500 break-all">{badgeUrl}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  No QR code scanned yet. Point your camera at a participant badge QR code.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resetState}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Reset scanner
              </button>
              {scanStatus === 'checked_in' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Badger;
