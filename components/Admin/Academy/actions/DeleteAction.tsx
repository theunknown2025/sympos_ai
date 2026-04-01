import React from 'react';
import { Trash2 } from 'lucide-react';
import type { AcademyCourse } from '../../../../types';

export interface DeleteActionProps {
  course: AcademyCourse;
  onDelete: (course: AcademyCourse) => void;
}

const DeleteAction: React.FC<DeleteActionProps> = ({ course, onDelete }) => {
  return (
    <button
      type="button"
      onClick={() => onDelete(course)}
      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Delete course"
    >
      <Trash2 size={16} />
    </button>
  );
};

export default DeleteAction;
