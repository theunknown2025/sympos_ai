import React from 'react';
import { Pencil } from 'lucide-react';
import type { AcademyCourse } from '../../../../types';

export interface EditActionProps {
  course: AcademyCourse;
  onEdit: (course: AcademyCourse) => void;
}

const EditAction: React.FC<EditActionProps> = ({ course, onEdit }) => {
  return (
    <button
      type="button"
      onClick={() => onEdit(course)}
      className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
      title="Edit course"
    >
      <Pencil size={16} />
    </button>
  );
};

export default EditAction;
