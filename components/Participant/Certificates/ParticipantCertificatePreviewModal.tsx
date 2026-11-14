import React, { useEffect, useState } from 'react';
import { AlertCircle, Download, ExternalLink, Loader2, X } from 'lucide-react';
import {
  getCertificateQrPdfUrl,
  type ParticipantAccountCertificate,
} from '../../../services/certificateService';
import { renderParticipantAccountCertificatePreview } from '../../../services/certificateGenerationService';
import { getEvent } from '../../../services/eventService';
import jsPDF from 'jspdf';

interface ParticipantCertificatePreviewModalProps {
  certificate: ParticipantAccountCertificate | null;
  eventName?: string;
  onClose: () => void;
}

const ParticipantCertificatePreviewModal: React.FC<ParticipantCertificatePreviewModalProps> = ({
  certificate,
  eventName,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (!certificate) {
      setPreviewImageUrl(null);
      setPreviewError('');
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError('');
        setPreviewImageUrl(null);

        const eventData = await getEvent(certificate.eventId);
        if (cancelled) return;

        const imageData = await renderParticipantAccountCertificatePreview(certificate, eventData);
        if (cancelled) return;
        setPreviewImageUrl(imageData);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setPreviewError('Could not render certificate preview. Showing the saved copy.');
          setPreviewImageUrl(certificate.certificateImageUrl);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [certificate]);

  if (!certificate) return null;

  const hasRenderedPreview = !!previewImageUrl && !previewError;
  const displayedImageUrl = previewImageUrl || certificate.certificateImageUrl;

  const loadCertificateImage = (): Promise<{ dataUrl: string; width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not prepare certificate image'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error('Failed to load certificate image'));
      img.src = displayedImageUrl;
    });

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const { dataUrl, width, height } = await loadCertificateImage();
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      const safeName = (eventName || certificate.participantName).replace(/[^a-z0-9]/gi, '_');
      pdf.save(`certificate-${safeName}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setDownloading(true);
      const { dataUrl } = await loadCertificateImage();
      const link = document.createElement('a');
      link.href = dataUrl;
      const safeName = (eventName || certificate.participantName).replace(/[^a-z0-9]/gi, '_');
      link.download = `certificate-${safeName}.png`;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenCertificate = () => {
    const pdfUrl = getCertificateQrPdfUrl(certificate);
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!previewImageUrl) return;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<!DOCTYPE html><html><head><title>Certificate</title></head><body style="margin:0;background:#f1f5f9;display:flex;justify-content:center;"><img src="${previewImageUrl}" style="max-width:100%;height:auto;" alt="Certificate" /></body></html>`
      );
      newWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Certificate preview</h2>
            {eventName && <p className="text-sm text-slate-500 mt-0.5">{eventName}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCertificate}
              disabled={previewLoading || !hasRenderedPreview}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              <ExternalLink size={16} />
              Open certificate
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPng()}
              disabled={downloading || previewLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              PNG
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={downloading || previewLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          {previewError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}
          {previewLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm">Preparing certificate with verification QR code…</p>
            </div>
          ) : (
            <img
              src={displayedImageUrl}
              alt={`Certificate for ${certificate.participantName}`}
              className="mx-auto max-w-full h-auto rounded-lg shadow-md bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantCertificatePreviewModal;
