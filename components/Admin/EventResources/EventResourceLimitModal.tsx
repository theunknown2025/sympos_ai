import React from 'react';
import { X } from 'lucide-react';
import { useAdminTranslation } from '../../../i18n/admin/hooks/useAdminTranslation';
import type { EventResourceSlot } from '../../../services/eventResources';

interface EventResourceLimitModalProps {
  slot: EventResourceSlot;
  onClose: () => void;
}

function slotResourceLabel(
  t: (key: 'slot_landing_page' | 'slot_registration_form' | 'slot_submission_form' | 'slot_abstract_submission_form' | 'slot_submission_payment_form' | 'slot_evaluation_form' | 'slot_registration_certificate' | 'slot_submission_certificate' | 'slot_registration_badge' | 'slot_submission_badge' | 'slot_project') => string,
  slot: EventResourceSlot
): string {
  switch (slot) {
    case 'landing_page':
      return t('slot_landing_page');
    case 'registration_form':
      return t('slot_registration_form');
    case 'submission_form':
      return t('slot_submission_form');
    case 'abstract_submission_form':
      return t('slot_abstract_submission_form');
    case 'submission_payment_form':
      return t('slot_submission_payment_form');
    case 'evaluation_form':
      return t('slot_evaluation_form');
    case 'registration_certificate':
      return t('slot_registration_certificate');
    case 'submission_certificate':
      return t('slot_submission_certificate');
    case 'registration_badge':
      return t('slot_registration_badge');
    case 'submission_badge':
      return t('slot_submission_badge');
    case 'project':
      return t('slot_project');
  }
}

const EventResourceLimitModal: React.FC<EventResourceLimitModalProps> = ({ slot, onClose }) => {
  const { t } = useAdminTranslation('eventResources');
  const resource = slotResourceLabel(t, slot);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-resource-slot-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id="event-resource-slot-title" className="text-lg font-semibold text-slate-900">
            {t('slotModalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label={t('slotModalClose')}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {t('slotModalBody', { resource })}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {t('slotModalClose')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventResourceLimitModal;
