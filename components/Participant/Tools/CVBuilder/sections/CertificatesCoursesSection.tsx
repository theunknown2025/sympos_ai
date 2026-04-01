import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  credentialUrl?: string;
}

interface CertificatesCoursesSectionProps {
  data: {
    certificates: Certificate[];
  };
  onChange: (data: { certificates: Certificate[] }) => void;
}

const CertificatesCoursesSection: React.FC<CertificatesCoursesSectionProps> = ({ data, onChange }) => {
  const handleAddCertificate = () => {
    onChange({
      certificates: [
        ...data.certificates,
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

  const handleRemoveCertificate = (id: string) => {
    onChange({
      certificates: data.certificates.filter((cert) => cert.id !== id),
    });
  };

  const handleUpdateCertificate = (id: string, field: keyof Certificate, value: string) => {
    onChange({
      certificates: data.certificates.map((cert) =>
        cert.id === id ? { ...cert, [field]: value } : cert
      ),
    });
  };

  return (
    <div className="space-y-4">
      {data.certificates.map((certificate, index) => (
        <div key={certificate.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-900">Certificate {index + 1}</h4>
            {data.certificates.length > 1 && (
              <button
                onClick={() => handleRemoveCertificate(certificate.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove certificate"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Certificate/Course Name</label>
              <input
                type="text"
                value={certificate.name || ''}
                onChange={(e) => handleUpdateCertificate(certificate.id, 'name', e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Issuing Organization</label>
              <input
                type="text"
                value={certificate.issuer || ''}
                onChange={(e) => handleUpdateCertificate(certificate.id, 'issuer', e.target.value)}
                placeholder="e.g., Amazon Web Services"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="text"
                  value={certificate.date || ''}
                  onChange={(e) => handleUpdateCertificate(certificate.id, 'date', e.target.value)}
                  placeholder="MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Credential ID (Optional)</label>
                <input
                  type="text"
                  value={certificate.credentialId || ''}
                  onChange={(e) => handleUpdateCertificate(certificate.id, 'credentialId', e.target.value)}
                  placeholder="Credential ID"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Credential URL (Optional)</label>
              <input
                type="url"
                value={certificate.credentialUrl || ''}
                onChange={(e) => handleUpdateCertificate(certificate.id, 'credentialUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={handleAddCertificate}
        className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Add Certificate/Course
      </button>
    </div>
  );
};

export default CertificatesCoursesSection;
