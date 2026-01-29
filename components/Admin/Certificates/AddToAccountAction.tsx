import React from 'react';
import { UserPlus } from 'lucide-react';

interface AddToAccountActionProps {
  onClick: () => void;
  disabled?: boolean;
  selectedCount: number;
  adding?: boolean;
}

const AddToAccountAction: React.FC<AddToAccountActionProps> = ({
  onClick,
  disabled = false,
  selectedCount,
  adding = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
          <UserPlus className="text-purple-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Add to Account</h3>
        <p className="text-sm text-slate-500 mb-6">
          Save certificates to participant accounts
        </p>
      </div>
      
      <button
        onClick={onClick}
        disabled={disabled || adding}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        <UserPlus size={18} />
        {adding ? 'Adding...' : `Add ${selectedCount > 0 ? `${selectedCount} ` : ''}Certificate${selectedCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

export default AddToAccountAction;
