import React from 'react';
import { Download } from 'lucide-react';

interface GenerateCertificateActionProps {
  onClick: () => void;
  disabled?: boolean;
  selectedCount: number;
  generating?: boolean;
}

const GenerateCertificateAction: React.FC<GenerateCertificateActionProps> = ({
  onClick,
  disabled = false,
  selectedCount,
  generating = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
          <Download className="text-indigo-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate Certificate</h3>
        <p className="text-sm text-slate-500 mb-6">
          Download certificates as PDF files
        </p>
      </div>
      
      <button
        onClick={onClick}
        disabled={disabled || generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        <Download size={18} />
        {generating ? 'Generating...' : `Generate ${selectedCount > 0 ? `${selectedCount} ` : ''}Certificate${selectedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

export default GenerateCertificateAction;
