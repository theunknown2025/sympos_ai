import React from 'react';
import { Eye } from 'lucide-react';
import type { AcademyCourse } from '../../../../types';

export interface DisplayActionProps {
  course: AcademyCourse;
  onDisplay: (course: AcademyCourse) => void;
}

const DisplayAction: React.FC<DisplayActionProps> = ({ course, onDisplay }) => {
  return (
    <button
      type="button"
      onClick={() => onDisplay(course)}
      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
      title="Display / Preview"
    >
      <Eye size={16} />
    </button>
  );
};

export default DisplayAction;
