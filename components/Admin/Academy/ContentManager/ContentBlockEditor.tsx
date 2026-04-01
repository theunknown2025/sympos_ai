import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AcademyLessonContentBlock, AcademyLessonContentBlockType } from '../../../../types';

export type ContentBlockFormData = Record<string, unknown>;

export interface ContentBlockEditorProps {
  blockType: AcademyLessonContentBlockType;
  initialContent?: Record<string, unknown>;
  onSave: (content: ContentBlockFormData) => void;
  onCancel: () => void;
}

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  blockType,
  initialContent = {},
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState<Record<string, unknown>>(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [blockType, JSON.stringify(initialContent)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
  };

  const common = (
    <div className="flex gap-2 mt-3">
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Save
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>
    </div>
  );

  if (blockType === 'text') {
    const text = (content.text as string) ?? '';
    return (
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-800">Add Text</span>
          <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-indigo-100">
            <X size={16} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={e => setContent({ ...content, text: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Enter text content..."
          autoFocus
        />
        {common}
      </form>
    );
  }

  if (blockType === 'video') {
    const url = (content.url as string) ?? '';
    const title = (content.title as string) ?? '';
    return (
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-800">Add Video</span>
          <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-indigo-100">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => setContent({ ...content, url: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Video URL (e.g. https://youtube.com/...)"
            required
          />
          <input
            type="text"
            value={title}
            onChange={e => setContent({ ...content, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Title (optional)"
          />
        </div>
        {common}
      </form>
    );
  }

  if (blockType === 'image') {
    const url = (content.url as string) ?? '';
    const alt = (content.alt as string) ?? '';
    return (
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-800">Add Image</span>
          <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-indigo-100">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => setContent({ ...content, url: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Image URL"
            required
          />
          <input
            type="text"
            value={alt}
            onChange={e => setContent({ ...content, alt: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Alt text (optional)"
          />
        </div>
        {common}
      </form>
    );
  }

  if (blockType === 'link') {
    const url = (content.url as string) ?? '';
    const label = (content.label as string) ?? '';
    return (
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-800">Add Link</span>
          <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-indigo-100">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => setContent({ ...content, url: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Link URL"
            required
          />
          <input
            type="text"
            value={label}
            onChange={e => setContent({ ...content, label: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Link label"
            required
          />
        </div>
        {common}
      </form>
    );
  }

  if (blockType === 'document') {
    const url = (content.url as string) ?? '';
    const title = (content.title as string) ?? '';
    return (
      <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-800">Add Document</span>
          <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-indigo-100">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => setContent({ ...content, url: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Document URL (PDF, etc.)"
            required
          />
          <input
            type="text"
            value={title}
            onChange={e => setContent({ ...content, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Title (optional)"
          />
        </div>
        {common}
      </form>
    );
  }

  return null;
};

export default ContentBlockEditor;
