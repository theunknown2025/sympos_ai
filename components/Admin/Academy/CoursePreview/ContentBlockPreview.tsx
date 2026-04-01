import React from 'react';
import { Type, Video, Image, Link2, FileText } from 'lucide-react';
import type { ContentBlock } from '../../../../services/academyContentBlockService';

export interface ContentBlockPreviewProps {
  block: ContentBlock;
}

const ContentBlockPreview: React.FC<ContentBlockPreviewProps> = ({ block }) => {
  const c = block.content || {};

  if (block.blockType === 'text') {
    const text = (c as { text?: string }).text || '';
    if (!text.trim()) return null;
    return (
      <div className="flex gap-2 py-2 px-3 rounded-lg bg-slate-50/80">
        <Type size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-700 whitespace-pre-wrap">{text}</p>
      </div>
    );
  }

  if (block.blockType === 'video') {
    const url = (c as { url?: string }).url || '';
    const title = (c as { title?: string }).title;
    if (!url) return null;
    return (
      <div className="flex gap-2 py-2 px-3 rounded-lg bg-slate-50/80">
        <Video size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          {title && <p className="text-xs font-medium text-slate-700">{title}</p>}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline truncate block"
          >
            {url}
          </a>
        </div>
      </div>
    );
  }

  if (block.blockType === 'image') {
    const url = (c as { url?: string }).url || '';
    const alt = (c as { alt?: string }).alt || '';
    if (!url) return null;
    return (
      <div className="py-2 px-3 rounded-lg bg-slate-50/80">
        <div className="flex gap-2 mb-1">
          <Image size={14} className="text-slate-400 shrink-0 mt-0.5" />
          {alt && <span className="text-xs text-slate-600">{alt}</span>}
        </div>
        <img src={url} alt={alt} className="max-w-full max-h-32 object-contain rounded" />
      </div>
    );
  }

  if (block.blockType === 'link') {
    const url = (c as { url?: string }).url || '';
    const label = (c as { label?: string }).label || url;
    if (!url) return null;
    return (
      <div className="flex gap-2 py-2 px-3 rounded-lg bg-slate-50/80">
        <Link2 size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline"
        >
          {label}
        </a>
      </div>
    );
  }

  if (block.blockType === 'document') {
    const url = (c as { url?: string }).url || '';
    const title = (c as { title?: string }).title;
    if (!url) return null;
    return (
      <div className="flex gap-2 py-2 px-3 rounded-lg bg-slate-50/80">
        <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          {title && <p className="text-xs font-medium text-slate-700">{title}</p>}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline truncate block"
          >
            {url}
          </a>
        </div>
      </div>
    );
  }

  return null;
};

export default ContentBlockPreview;
