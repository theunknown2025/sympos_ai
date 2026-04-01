import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getEditorTranslations } from '../editorTranslations';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface CertificationsSectionProps {
  data: {
    certifications: Certification[];
  };
  onChange: (data: { certifications: Certification[] }) => void;
  language?: 'en' | 'fr' | 'ar';
  direction?: 'ltr' | 'rtl';
}

const CertificationsSection: React.FC<CertificationsSectionProps> = ({ data, onChange, language = 'en', direction = 'ltr' }) => {
  const t = getEditorTranslations(language);

  const handleAddCertification = () => {
    onChange({
      certifications: [
        ...data.certifications,
        {
          id: uuidv4(),
          name: '',
          issuer: '',
          date: '',
          credentialId: '',
          credentialUrl: '',
        },
      ],
    });
  };

  const handleRemoveCertification = (id: string) => {
    onChange({
      certifications: data.certifications.filter((cert) => cert.id !== id),
    });
  };

  const handleUpdateCertification = (id: string, field: keyof Certification, value: string) => {
    onChange({
      certifications: data.certifications.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    });
  };

  return (
    <div className="space-y-4" dir={direction}>
      {data.certifications.map((certification, index) => (
        <div key={certification.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">{t.certification} {index + 1}</h4>
            {data.certifications.length > 1 && (
              <button
                onClick={() => handleRemoveCertification(certification.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t.remove}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.name}</label>
              <input
                type="text"
                value={certification.name || ''}
                onChange={(e) => handleUpdateCertification(certification.id, 'name', e.target.value)}
                placeholder={direction === 'rtl' ? 'اسم الشهادة' : 'Certification Name'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.issuer}</label>
              <input
                type="text"
                value={certification.issuer || ''}
                onChange={(e) => handleUpdateCertification(certification.id, 'issuer', e.target.value)}
                placeholder={direction === 'rtl' ? 'المنظمة المصدرة' : 'Issuing Organization'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir={direction}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.date}</label>
                <input
                  type="text"
                  value={certification.date || ''}
                  onChange={(e) => handleUpdateCertification(certification.id, 'date', e.target.value)}
                  placeholder={direction === 'rtl' ? 'شهر/سنة' : 'MM/YYYY'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  dir={direction}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">{t.credentialId} ({t.optional})</label>
                <input
                  type="text"
                  value={certification.credentialId || ''}
                  onChange={(e) => handleUpdateCertification(certification.id, 'credentialId', e.target.value)}
                  placeholder={direction === 'rtl' ? 'معرف الشهادة' : 'Credential ID'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  dir={direction}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.credentialUrl} ({t.optional})</label>
              <input
                type="url"
                value={certification.credentialUrl || ''}
                onChange={(e) => handleUpdateCertification(certification.id, 'credentialUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddCertification}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        {t.add} {t.certification}
      </button>
    </div>
  );
};

export default CertificationsSection;
