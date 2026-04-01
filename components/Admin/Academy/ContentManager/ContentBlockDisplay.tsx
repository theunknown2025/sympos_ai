import React from 'react';
import { Type, Video, Image, Link2, FileText, Pencil, Trash2 } from 'lucide-react';
import type { AcademyLessonContentBlockType } from '../../../../types';
import type { ContentBlock } from '../../../../services/academyContentBlockService';

const BLOCK_ICONS: Record<AcademyLessonContentBlockType, React.ElementType> = {
  text: Type,
  video: Video,
  image: Image,
  link: Link2,
  document: FileText,
  quiz: FileText,
};

const getBlockPreview = (block: ContentBlock): string => {
  const c = block.content || {};
  switch (block.blockType) {
    case 'text':
      return ((c as { text?: string }).text || '').slice(0, 80) || 'Empty text';
    case 'video':
      return (c as { url?: string }).url || 'No URL';
    case 'image':
      return (c as { url?: string }).url || 'No image';
    case 'link':
      return (c as { label?: string }).label || (c as { url?: string }).url || 'No link';
    case 'document':
      return (c as { title?: string }).title || (c as { url?: string }).url || 'No document';
    case 'quiz':
      return 'Quiz block';
    default:
      return 'Content';
  }
};

export interface ContentBlockDisplayProps {
  block: ContentBlock;
  onEdit: () => void;
  onDelete: () => void;
}

const ContentBlockDisplay: React.FC<ContentBlockDisplayProps> = ({ block, onEdit, onDelete }) => {
  const Icon = BLOCK_ICONS[block.blockType] || FileText;
  const preview = getBlockPreview(block);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white group">
      <div className="p-2 rounded-lg bg-slate-100 shrink-0">
        <Icon size={18} className="text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-slate-500 uppercase">{block.blockType}</span>
        <p className="text-sm text-slate-800 truncate mt-0.5">{preview}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-2 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ContentBlockDisplay;
