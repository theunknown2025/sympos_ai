import React from 'react';
import { Type, Video, Image, Link2, FileText } from 'lucide-react';
import type { AcademyLessonContentBlockType } from '../../../../types';

const CONTENT_ACTIONS: { id: AcademyLessonContentBlockType; label: string; icon: React.ElementType }[] = [
  { id: 'video', label: 'Video', icon: Video },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'link', label: 'Link', icon: Link2 },
  { id: 'document', label: 'Document', icon: FileText },
];

export interface AddContentActionsProps {
  onAdd: (blockType: AcademyLessonContentBlockType) => void;
  disabled?: boolean;
}

const AddContentActions: React.FC<AddContentActionsProps> = ({ onAdd, disabled }) => (
  <div className="flex flex-wrap gap-2">
    {CONTENT_ACTIONS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onAdd(id)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon size={16} />
        Add {label}
      </button>
    ))}
  </div>
);

export default AddContentActions;
