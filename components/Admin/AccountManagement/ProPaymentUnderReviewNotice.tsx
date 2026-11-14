import React from 'react';
import { Clock, Mail } from 'lucide-react';
import { useAdminDisplaySettings } from '../../../contexts/AdminDisplaySettingsContext';

const SUPPORT_EMAIL = 'admin@symposai.pro';

/** Shown while Pro payment proof awaits Super Admin approval (account suspended). */
export const ProPaymentUnderReviewNotice: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const { language } = useAdminDisplaySettings();
  const fr = language === 'fr';

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Clock className="text-amber-600 shrink-0 mt-0.5" size={22} />
        <div className="text-sm space-y-2 min-w-0">
          <p className="font-semibold text-base">
            {fr
              ? 'Compte en cours d’examen'
              : 'Account under review'}
          </p>
          <p className="text-amber-900 leading-relaxed">
            {fr
              ? 'Votre demande Pro et votre preuve de paiement ont bien été reçues. Votre compte reste suspendu jusqu’à l’approbation par le Super Admin.'
              : 'Your Pro request and proof of payment were received. Your account stays suspended until Super Admin approval.'}
          </p>
          <p className="text-amber-800 leading-relaxed">
            {fr
              ? 'Si la validation prend plus de 48 heures, contactez-nous :'
              : 'If approval takes longer than 48 hours, please reach out:'}{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-1 font-semibold text-amber-950 underline underline-offset-2 hover:text-amber-700"
            >
              <Mail size={14} className="shrink-0" />
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProPaymentUnderReviewNotice;
