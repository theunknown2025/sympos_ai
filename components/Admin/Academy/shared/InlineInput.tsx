import React from 'react';
import { Check, X } from 'lucide-react';

export interface InlineInputProps {
  value: string;
  onChange: (v: string) => void;
  onApprove: () => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const InlineInput: React.FC<InlineInputProps> = ({
  value,
  onChange,
  onApprove,
  onCancel,
  placeholder = 'Enter title...',
  autoFocus = true,
}) => (
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') onApprove();
        if (e.key === 'Escape') onCancel();
      }}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="flex-1 min-w-0 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
    <button
      type="button"
      onClick={onApprove}
      disabled={!value.trim()}
      className="p-1.5 rounded text-green-600 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
      title="Approve"
    >
      <Check size={16} />
    </button>
    <button
      type="button"
      onClick={onCancel}
      className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
      title="Cancel"
    >
      <X size={16} />
    </button>
  </div>
);

export default InlineInput;
