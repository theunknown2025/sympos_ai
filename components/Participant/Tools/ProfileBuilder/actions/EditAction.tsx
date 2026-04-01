import React from 'react';
import { Edit } from 'lucide-react';

interface EditActionProps {
  onEdit: () => void;
  className?: string;
}

const EditAction: React.FC<EditActionProps> = ({ onEdit, className = '' }) => {
  return (
    <button
      onClick={onEdit}
      className={`p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors ${className}`}
      title="Edit profile"
    >
      <Edit size={18} />
    </button>
  );
};

export default EditAction;
