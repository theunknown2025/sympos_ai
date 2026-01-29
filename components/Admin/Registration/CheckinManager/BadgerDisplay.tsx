import React, { useState, useCallback, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { X, Camera, CheckCircle, AlertCircle, Loader2, Maximize2, Minimize2, User, Calendar, Info } from 'lucide-react';
import { getBadgeByImageUrl } from '../../../../services/badgeGeneratorService';
import { setCheckinStatus } from '../../../../services/checkinService';
import { useAuth } from '../../../../hooks/useAuth';
import { Event } from '../../../../types';
import { getEvent } from '../../../../services/eventService';

interface BadgerDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  eventName?: string;
}

type ScanStatus = 'idle' | 'scanning' | 'error' | 'checking_in' | 'checked_in';

const BadgerDisplay: React.FC<BadgerDisplayProps> = ({ isOpen, onClose, eventId, eventName: propEventName }) => {
  const { currentUser } = useAuth();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [error, setError] = useState<string>('');
  const [badgeUrl, setBadgeUrl] = useState<string>('');
  const [eventName, setEventName] = useState<string>(propEventName || '');
  const [participantName, setParticipantName] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [eventData, setEventData] = useState<Event | null>(null);

  // Keep last successfully processed QR text to avoid duplicate processing
  const lastProcessedValueRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load event data if eventId is provided
  useEffect(() => {
    const loadEventData = async () => {
      if (eventId && !propEventName) {
        try {
          const event = await getEvent(eventId);
          if (event) {
            setEventData(event);
            setEventName(event.name);
          }
        } catch (err) {
          console.error('Failed to load event data:', err);
        }
      }
    };

    if (isOpen && eventId) {
      loadEventData();
    }
  }, [isOpen, eventId, propEventName]);

  // Handle fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const resetState = () => {
    setScanStatus('idle');
    setError('');
    setBadgeUrl('');
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
          if (event) {
            eventTitle = event.name;
            setEventData(event);
          }
          if (!eventTitle) {
            eventTitle = eventName || '';
          }
        } catch {
          eventTitle = eventName || '';
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
        console.error('BadgerDisplay scan error:', err);
        setError(err?.message || 'Failed to process QR code.');
        setScanStatus('error');
      }
    },
    [currentUser, eventName]
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
        console.error('BadgerDisplay camera error:', err);
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
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
    >
      {/* Top Header with Event Title and Controls */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Camera className="text-indigo-400" size={28} />
            {eventName || 'QR Check-in Scanner'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Scan participant badges to record check-ins
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Close"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        {/* Left Side - QR Scanner */}
        <div className="flex flex-col space-y-4">
          {/* Instructions */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-indigo-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-300 mb-2">How to Use the Badger</h3>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>Ensure the participant's badge is clearly visible</li>
                  <li>Position the QR code within the camera frame</li>
                  <li>Keep the badge steady and well-lit</li>
                  <li>The system will automatically detect and process the QR code</li>
                  <li>Wait for confirmation before scanning the next participant</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Scanner Video */}
          <div className="flex-1 rounded-lg overflow-hidden border-2 border-slate-700 bg-black/90 shadow-2xl relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            {/* Scanning overlay indicator */}
            {scanStatus === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-indigo-600/90 rounded-lg px-6 py-3 flex items-center gap-3">
                  <Loader2 className="animate-spin text-white" size={24} />
                  <span className="text-white font-medium">Processing QR code...</span>
                </div>
              </div>
            )}
            {scanStatus === 'checking_in' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-indigo-600/90 rounded-lg px-6 py-3 flex items-center gap-3">
                  <Loader2 className="animate-spin text-white" size={24} />
                  <span className="text-white font-medium">Recording check-in...</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              {scanStatus === 'checked_in' ? (
                <CheckCircle className="text-green-400 flex-shrink-0" size={24} />
              ) : scanStatus === 'error' ? (
                <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
              ) : scanStatus === 'checking_in' ? (
                <Loader2 className="text-indigo-400 animate-spin flex-shrink-0" size={24} />
              ) : scanStatus === 'scanning' ? (
                <Loader2 className="text-indigo-400 animate-spin flex-shrink-0" size={24} />
              ) : (
                <Camera className="text-slate-400 flex-shrink-0" size={24} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {scanStatus === 'idle' && 'Ready to scan - Point camera at QR code'}
                  {scanStatus === 'scanning' && 'QR code detected. Processing...'}
                  {scanStatus === 'checking_in' && 'Recording check-in...'}
                  {scanStatus === 'checked_in' && 'Check-in recorded successfully!'}
                  {scanStatus === 'error' && 'Unable to process QR code'}
                </p>
                {error && (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Participant Information */}
        <div className="flex flex-col space-y-4">
          {participantName ? (
            <>
              {/* Welcome Message */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Welcome!</h2>
                    <p className="text-sm text-indigo-100">Check-in successful</p>
                  </div>
                </div>
                <p className="text-lg text-white font-medium">
                  {scanStatus === 'checked_in' 
                    ? `Hello ${participantName}! You have been successfully checked in.`
                    : `Processing check-in for ${participantName}...`
                  }
                </p>
              </div>

              {/* Participant Details Card */}
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 space-y-4 flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="text-indigo-400" size={20} />
                  Participant Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Name</p>
                    <p className="text-lg font-semibold text-white">{participantName}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="text-slate-500" size={14} />
                      Event
                    </p>
                    <p className="text-base text-slate-200">
                      {eventName || <span className="text-slate-500 italic">Unknown event</span>}
                    </p>
                  </div>

                  {badgeUrl && (
                    <div className="space-y-1 pt-2 border-t border-slate-700">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Badge URL</p>
                      <p className="text-xs text-slate-500 break-all font-mono">{badgeUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetState}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                >
                  Scan Another
                </button>
                {scanStatus === 'checked_in' && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                  >
                    Close Scanner
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-slate-800/30 rounded-lg border-2 border-dashed border-slate-700">
              <div className="text-center p-8">
                <div className="bg-slate-700/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Camera className="text-slate-500" size={40} />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">Waiting for Scan</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Point your camera at a participant badge QR code to begin the check-in process.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgerDisplay;
