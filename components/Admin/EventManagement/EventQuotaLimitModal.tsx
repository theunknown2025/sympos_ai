import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, X } from 'lucide-react';
import { useAdminTranslation } from '../../../i18n/admin/hooks/useAdminTranslation';
import { getRoutePath } from '../../../routes';
import { ViewState } from '../../../types';
import type { OrganizerEventQuota } from '../../../services/organizerEventQuota';

interface EventQuotaLimitModalProps {
  quota: OrganizerEventQuota;
  onClose: () => void;
}

const EventQuotaLimitModal: React.FC<EventQuotaLimitModalProps> = ({ quota, onClose }) => {
  const { t } = useAdminTranslation('eventManagement');
  const navigate = useNavigate();

  const body =
    quota.source === 'pro'
      ? quota.maxEvents === 1
        ? t('quotaModalProBodyOne')
        : t('quotaModalProBodyMany', { max: quota.maxEvents, used: quota.usedEvents })
      : quota.source === 'inactive'
        ? t('quotaModalInactiveBody')
        : t('quotaModalTrialBody');

  const goToPacks = () => {
    onClose();
    navigate(getRoutePath(ViewState.ACCOUNT_PRO));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-quota-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id="event-quota-title" className="text-lg font-semibold text-slate-900">
            {t('quotaModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label={t('quotaModalClose')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">{body}</p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('quotaModalClose')}
            </button>
            <button
              type="button"
              onClick={goToPacks}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Crown size={16} />
              {t('quotaModalUpgrade')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventQuotaLimitModal;
