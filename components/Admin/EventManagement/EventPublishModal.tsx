import React, { useState } from 'react';
import { AlertCircle, Check, Copy, Globe, Loader2, X } from 'lucide-react';
import type { Event } from '../../../types';
import { getEventPublicUrl, publishEventPublicly } from '../../../services/eventService';
import { useAdminTranslation } from '../../../i18n/admin/hooks/useAdminTranslation';

interface EventPublishModalProps {
  event: Event;
  organizerUserId: string;
  onClose: () => void;
  onPublished: (slug: string) => void;
}

const EventPublishModal: React.FC<EventPublishModalProps> = ({
  event,
  organizerUserId,
  onClose,
  onPublished,
}) => {
  const { t } = useAdminTranslation('eventForm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicUrl, setPublicUrl] = useState(
    event.publicSlug ? getEventPublicUrl(event.publicSlug) : ''
  );
  const [copied, setCopied] = useState(false);

  const isPublished = event.publishStatus === 'Published' && event.publicSlug;

  const handlePublish = async () => {
    setLoading(true);
    setError('');
    try {
      const { slug, publicUrl: url } = await publishEventPublicly(event.id, organizerUserId);
      setPublicUrl(url);
      onPublished(slug);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(publicUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Globe className="text-indigo-600" size={22} />
            <h2 className="text-lg font-semibold text-slate-900">{t('publishPublicModalTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <p className="text-sm text-slate-600">{t('publishPublicModalBody')}</p>

          {isPublished || publicUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('publicUrlLabel')}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 font-mono"
                />
                <button
                  type="button"
                  onClick={copyUrl}
                  className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1.5 text-sm font-medium text-slate-700"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copied ? t('copied') : t('copyLink')}
                </button>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline"
              >
                {t('openPublicPage')}
              </a>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
            >
              {t('btnClose')}
            </button>
            {!isPublished && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                {t('publishPublicBtn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPublishModal;
