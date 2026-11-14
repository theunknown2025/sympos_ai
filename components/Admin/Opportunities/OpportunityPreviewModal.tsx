import React from 'react';
import { X } from 'lucide-react';
import OpportunityPreviewPanel, {
  type OpportunityPreviewData,
} from './OpportunityPreviewPanel';

interface OpportunityPreviewModalProps {
  opportunity: OpportunityPreviewData;
  onClose: () => void;
}

const OpportunityPreviewModal: React.FC<OpportunityPreviewModalProps> = ({
  opportunity,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative max-w-2xl w-full max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 text-slate-700 shadow hover:bg-white"
        >
          <X size={20} />
        </button>
        <OpportunityPreviewPanel opportunity={opportunity} className="max-h-[90vh]" />
      </div>
    </div>
  );
};

export default OpportunityPreviewModal;
