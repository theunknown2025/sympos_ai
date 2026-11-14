import React from 'react';
import { AlertCircle, Award } from 'lucide-react';
import { CertificateTemplate } from '../../../types';

interface CertificateLinkedTemplatesProps {
  templates: CertificateTemplate[];
  missingMessage: string;
}

const CertificateLinkedTemplates: React.FC<CertificateLinkedTemplatesProps> = ({
  templates,
  missingMessage,
}) => {
  if (templates.length === 0) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-sm">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>{missingMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => (
        <span
          key={template.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-800"
        >
          <Award size={14} />
          {template.title}
        </span>
      ))}
    </div>
  );
};

export default CertificateLinkedTemplates;
