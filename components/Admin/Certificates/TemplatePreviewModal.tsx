import React, { useEffect, useState } from 'react';
import { X, Loader2, QrCode } from 'lucide-react';
import { CertificateTemplate } from '../../../types';
import { getCertificateTemplate } from '../../../services/certificateTemplateService';
import { getBadgeTemplate } from '../../../services/badgeTemplateService';

export type TemplatePreviewKind = 'certificate' | 'badge';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: TemplatePreviewKind;
  templateId: string;
  titleBadge: string;
  titleCertificate: string;
  closeLabel: string;
}

const DEFAULT_W = 701;
const DEFAULT_H = 993;

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  kind,
  templateId,
  titleBadge,
  titleCertificate,
  closeLabel,
}) => {
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !templateId) {
      setTemplate(null);
      setError('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      setTemplate(null);
      try {
        const data =
          kind === 'badge'
            ? await getBadgeTemplate(templateId)
            : await getCertificateTemplate(templateId);
        if (!cancelled) {
          if (data) setTemplate(data);
          else setError('Template not found');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load template');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, templateId, kind]);

  if (!isOpen) return null;

  const w = template?.width || DEFAULT_W;
  const h = template?.height || DEFAULT_H;
  const maxDisplay = 520;
  const scale = Math.min(1, maxDisplay / w);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl max-w-[95vw] max-h-[90vh] flex flex-col border border-slate-200"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {kind === 'badge' ? titleBadge : titleCertificate}
            </h3>
            {template?.title ? (
              <p className="text-sm text-slate-600 mt-0.5">{template.title}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            aria-label={closeLabel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-auto p-6 flex justify-center items-start min-h-[200px]">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          )}
          {!loading && error && (
            <p className="text-sm text-red-600 py-8">{error}</p>
          )}
          {!loading && !error && template && (
            <div
              className="relative bg-white border border-slate-200 rounded-lg shadow-inner mx-auto"
              style={{
                width: w * scale,
                height: h * scale,
              }}
            >
              <div
                className="absolute top-0 left-0 bg-white"
                style={{
                  width: w,
                  height: h,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  backgroundImage: template.backgroundImage
                    ? `url(${template.backgroundImage})`
                    : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {(template.elements || []).map((element) => (
                  <div
                    key={element.id}
                    className="absolute select-none pointer-events-none"
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize:
                        element.type === 'qr' ? undefined : `${element.fontSize}px`,
                      fontFamily: element.fontFamily,
                      fontWeight: element.fontWeight,
                      color: element.color,
                      textAlign: element.textAlign,
                      width: element.type === 'qr' ? `${element.fontSize}px` : undefined,
                      height: element.type === 'qr' ? `${element.fontSize}px` : undefined,
                    }}
                  >
                    {element.type === 'field' ? (
                      <span className="px-2 py-1 bg-indigo-100 border border-indigo-300 rounded text-indigo-700 text-sm">
                        {'{'}{element.content}{'}'}
                      </span>
                    ) : element.type === 'qr' ? (
                      <div className="w-full h-full bg-slate-200 border-2 border-dashed border-slate-400 rounded flex items-center justify-center">
                        <QrCode size={element.fontSize * 0.6} className="text-slate-500" />
                      </div>
                    ) : (
                      <span>{element.content}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
