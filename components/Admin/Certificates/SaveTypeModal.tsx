import React from 'react';
import { X, Award, Badge } from 'lucide-react';

interface SaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'certificate' | 'badge') => void;
}

const SaveTypeModal: React.FC<SaveTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Save Template As</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            Choose how you want to save this template:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelect('certificate')}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Award size={32} className="text-indigo-600" />
              <span className="font-medium text-slate-900">Certificate</span>
              <span className="text-xs text-slate-500 text-center">
                Save as a certificate template
              </span>
            </button>
            
            <button
              onClick={() => onSelect('badge')}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Badge size={32} className="text-indigo-600" />
              <span className="font-medium text-slate-900">Badge</span>
              <span className="text-xs text-slate-500 text-center">
                Save as a badge template
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveTypeModal;
